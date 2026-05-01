import * as THREE from "three";
import { BaseEngine, type EngineContext, type EngineUpdateContext } from "./BaseEngine";
import { PASSENGER_CONFIG } from "../utils/config";
import { STATIONS_CONFIG, WORLD_BASE, WORLD_DECOR } from "../utils/constants";
import { getPointAtDistance } from "../utils/splineUtils";
import { passengerEngine } from "./PassengerEngine";

type RewardResourceType = "coin" | "police" | "plane" | "hospital";

const REWARD_RESOURCE_TYPES = new Set<string>([
  "coin",
  "police",
  "plane",
  "hospital",
]);

const STATION_BUILDING_MAP: Record<string, string> = {
  Station_1: "Airport_building",
  Station_2: "Police_station",
  Station_3: "Hospital",
  Station_4: "Pizza",
  Station_5: "Observatory",
  Station_6: "Stadium",
};

export class PassengerManagerEngine extends BaseEngine {
  readonly name = "PassengerManager";
  priority = 50;

  private _state: string = "IDLE";
  private activeProcesses = 0;
  private onAllDone: (() => void) | null = null;
  private pendingStationForBuild: string | null = null;
  private spawnedStations = new Set<string>();
  private lastBuildTrigger = 0;
  private unsubscribeStop: (() => void) | null = null;

  get state(): string { return this._state; }

  init(context: EngineContext): void {
    super.init(context);
    this.lastBuildTrigger = context.getDecorStore().buildTrigger ?? 0;
    this.unsubscribeStop = context
      .getStationsStore()
      .subscribeToStop?.((stationId: string) => this.onStationStop(stationId)) ?? null;
  }

  update(_context: EngineUpdateContext): void {

    this.syncSpawnedPassengers();

    const buildTrigger = this.context!.getDecorStore().buildTrigger ?? 0;
    if (buildTrigger !== this.lastBuildTrigger) {
      this.lastBuildTrigger = buildTrigger;
      this.onBuildTrigger();
    }
  }

  // Called when train stops at a station
  onStationStop(stationId: string): void {
    const stationsStore = this.context!.getStationsStore();
    const stationData = STATIONS_CONFIG.find((s: any) => s.id === stationId);
    const stationInfo = stationsStore.stations?.find((s: any) => s.id === stationId);

    if (!stationData || !stationInfo) return;
    if (stationData.type !== "passenger") return;

    if (!stationInfo.isBuilt && stationData.decorToUnlock) {
      this.pendingStationForBuild = stationId;
      return;
    }

    this.unboardAll(false, () => this.executeBoarding(stationId), stationId);
  }

  // Boarding passengers onto train
  private executeBoarding(stationId: string): void {
    const stationData = STATIONS_CONFIG.find((s: any) => s.id === stationId);
    if (!stationData) return;

    const trainStore = this.context!.getTrainStore();
    const maxCapacity = trainStore.maxCapacity || 10;
    const resType = this.getRewardResourceType(stationData?.resourceType);

    const getWagonPos = this.context!["getWagonPos"];
    if (!getWagonPos) {
      this._state = "IDLE";
      trainStore.setCanMoveTrain?.(true);
      return;
    }

    const insideCount = passengerEngine
      .getAll()
      .filter((p: any) => p.state === "inside").length;

    const remainingSpace = maxCapacity - insideCount;

    if (remainingSpace <= 0) {
      this._state = "IDLE";
      trainStore.setCanMoveTrain?.(true);
      return;
    }

    const candidates = passengerEngine
      .getAll()
      .filter((p: any) => p.state === "idle" && p.stationId === stationId);

    if (candidates.length === 0) {
      this._state = "IDLE";
      trainStore.setCanMoveTrain?.(true);
      return;
    }

    const toBoard = candidates.slice(0, remainingSpace);
    this._state = "BOARDING";
    this.activeProcesses = toBoard.length;

    const wagonCount = trainStore.wagons?.length || 2;
    const wagonCountSafe = Math.max(2, wagonCount + 2);
    const distanceRef = this.context!.distanceRef;

    toBoard.forEach((p: any, i: number) => {
      const targetWagonIdx = i % wagonCountSafe;
      const phys = passengerEngine.getAll().find((pp: any) => pp.id === p.id);
      if (!phys) {
        this.checkDone();
        return;
      }

      const delay = i * 150;
      phys.state = "boarding";
      phys.target = null;
      phys.nextTarget = null;
      phys.onReach = undefined;

      setTimeout(() => {
        const liveDist = distanceRef?.current ?? stationData.distance;
        const currentTrainStore = this.context!.getTrainStore();
        const samples = currentTrainStore.samples || [];
        const activeSplineIndex = currentTrainStore.activeSplineIndex ?? 0;
        const spline = samples[activeSplineIndex];
        if (!spline) {
          this.checkDone();
          return;
        }

        const WAGON_DISTANCE_STEP = -1;
        const wagonDistance =
          liveDist + (targetWagonIdx - wagonCountSafe / 2) * WAGON_DISTANCE_STEP;

        const boardPoint = getPointAtDistance(spline, wagonDistance);
        if (!boardPoint) {
          this.checkDone();
          return;
        }

        const finalTargetPos = boardPoint.position.clone();
        const nextWagonPos =
          getWagonPos(targetWagonIdx - 1, liveDist, stationData.spline) ||
          getWagonPos(targetWagonIdx + 1, liveDist, stationData.spline);

        if (nextWagonPos) {
          const forward = new THREE.Vector3()
            .subVectors(nextWagonPos, finalTargetPos)
            .normalize();
          const side = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
          const longitudinalOffset = (Math.random() - 0.5) * 8.0;
          const lateralOffset = (Math.random() - 0.5) * 1.5;
          finalTargetPos.add(forward.multiplyScalar(longitudinalOffset));
          finalTargetPos.add(side.multiplyScalar(lateralOffset));
        } else {
          finalTargetPos.x += (Math.random() - 0.5) * 3;
          finalTargetPos.z += (Math.random() - 0.5) * 3;
        }

        this.moveToTarget(phys, finalTargetPos, targetWagonIdx, resType);
      }, delay);
    });
  }

  private moveToTarget(
    phys: any,
    targetPos: THREE.Vector3,
    wagonIdx: number,
    resType: RewardResourceType
  ): void {
    const camera = this.context!["camera"];
    const size = this.context!["size"];
    phys.state = "boarding";
    phys.target = targetPos.clone();

    phys.onReach = () => {
      if (phys.state === "inside") return;
      phys.state = "inside";

      const resourcesStore = this.context!.getResourcesStore();

      if (camera && size) {
        const vector = phys.position.clone().project(camera);
        const screenX = (vector.x * 0.5 + 0.5) * size.width;
        const screenY = (vector.y * -0.5 + 0.5) * size.height;
        resourcesStore?.applyRewardBatch?.(screenX, screenY, resType, 1);
      }

      const trainStateEngine = this.context!.getEngine("TrainState");
      if (trainStateEngine) {
        (trainStateEngine as any).triggerWagonPulse?.(wagonIdx);
      }

      phys.onReach = undefined;

      this.checkDone();
    };
  }

  // Unboarding passengers from train
  unboardAll(
    isBuildMode: boolean,
    callback?: () => void,
    stationIdForUnboard?: string
  ): void {
    const insidePassengers = passengerEngine
      .getAll()
      .filter((p: any) => p.state === "inside");

    if (insidePassengers.length === 0) {
      callback?.();
      return;
    }

    let targetStationPos: THREE.Vector3 | null = null;
    let exitStartOverride: THREE.Vector3 | null = null;

    if (stationIdForUnboard) {
      const stationConfig = STATIONS_CONFIG.find(
        (s: any) => s.id === stationIdForUnboard
      );
      if (stationConfig) {
        const distanceRef = this.context!.distanceRef;
        const liveDist = distanceRef?.current;
        const trainStore = this.context!.getTrainStore();
        const samples = trainStore.samples || [];
        const activeSplineIndex = trainStore.activeSplineIndex ?? 0;
        const spline = samples[activeSplineIndex];

        if (spline) {
          const exitPoint = getPointAtDistance(spline, liveDist);
          if (exitPoint) {
            const EXIT_SIDE_DISTANCE = 0;
            const base = exitPoint.position.clone();
            const tangent = exitPoint.tangent.clone().normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3()
              .crossVectors(tangent, up)
              .normalize();

            const startPos = base.clone();
            const exitPos = base
              .clone()
              .add(right.clone().multiplyScalar(EXIT_SIDE_DISTANCE));

            targetStationPos = exitPos;
            exitStartOverride = startPos;
          }
        }
      }
    }

    const trainStore = this.context!.getTrainStore();
    const wagonCount = trainStore.wagons?.length || 2;
    const safeWagonCount = Math.max(2, wagonCount + 2);

    this._state = "UNBOARDING";
    this.activeProcesses = insidePassengers.length;
    this.onAllDone = callback || null;

    const getWagonPos = this.context!["getWagonPos"];

    insidePassengers.forEach((passenger: any, i: number) => {
      setTimeout(() => {
        const doorPos = getWagonPos
          ? getWagonPos(i % safeWagonCount)
          : null;

        let exitStartPos =
          exitStartOverride?.clone() ||
          doorPos ||
          new THREE.Vector3();

        if (isBuildMode) {
          this.processExit(
            passenger,
            exitStartPos.clone(),
            i,
            i % safeWagonCount,
            undefined,
            stationIdForUnboard
          );
        } else if (targetStationPos) {
          const randomOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            0,
            (Math.random() - 0.5) * 3
          );
          const finalExitPos = targetStationPos.clone().add(randomOffset);
          this.processExit(
            passenger,
            exitStartPos.clone(),
            i,
            i % safeWagonCount,
            finalExitPos,
            stationIdForUnboard
          );
        } else {
          const exitPos =
            doorPos || new THREE.Vector3();
          this.processExit(
            passenger,
            exitPos.clone(),
            i,
            i % safeWagonCount,
            undefined,
            stationIdForUnboard
          );
        }
      }, i * 100);
    });
  }

  private processExit(
    passenger: any,
    startPos: THREE.Vector3,
    _index: number,
    wagonIdx: number,
    specificExitTarget?: THREE.Vector3,
    stationId?: string
  ): void {
    if (!stationId) {
      this.checkDone();
      return;
    }

    const buildingId = STATION_BUILDING_MAP[stationId];
    if (!buildingId) {
      this.checkDone();
      return;
    }

    const building = [...WORLD_BASE, ...WORLD_DECOR].find(
      (w: any) => w.id === buildingId
    ) as any;
    if (!building) {
      this.checkDone();
      return;
    }

    let animatableParts: string[] = [];

    if (building?.animatedParts) {
      animatableParts = [...building.animatedParts];
    } else {
      const allParts = building?.detach || building?.parts || [];
      animatableParts = [...WORLD_BASE, ...WORLD_DECOR]
        .filter((item: any) => allParts.includes(item.id) && item.isAnimated)
        .map((item: any) => item.id);
    }

    const hasAnimatableParts = animatableParts.length > 0;

    if (specificExitTarget && hasAnimatableParts) {
      const partPositions = this.getPartPositions(animatableParts);
      if (partPositions.length === 0) {
        this.checkDone();
        return;
      }

      const buildingTarget = this.getRandomTarget(partPositions);
      const randomPartName =
        animatableParts[Math.floor(Math.random() * animatableParts.length)];

      passenger.position.copy(startPos);
      passenger.lastPos.copy(startPos);
      passenger.target = specificExitTarget.clone();
      passenger.nextTarget = buildingTarget;
      passenger.state = "exiting";

      passenger.onReach = () => {
        passenger.state = "done";
        passenger.target = null;
        passenger.nextTarget = null;
        passenger.onReach = undefined;

        const trainStateEngine = this.context!.getEngine("TrainState");
        if (trainStateEngine) {
          (trainStateEngine as any).triggerPyramidPulse?.(randomPartName);
        }

        passengerEngine.remove(passenger.id);
        this.checkDone();
      };

      const trainStateEngine = this.context!.getEngine("TrainState");
      if (trainStateEngine) {
        (trainStateEngine as any).triggerWagonPulse?.(wagonIdx);
      }

      return;
    }

    if (specificExitTarget) {
      passenger.position.copy(startPos);
      passenger.lastPos.copy(startPos);
      passenger.target = specificExitTarget.clone();
      passenger.nextTarget = null;
      passenger.state = "exiting";

      passenger.onReach = () => {
        passenger.state = "idle";
        passenger.target = null;
        passenger.onReach = undefined;
        this.checkDone();
      };

      return;
    }

    if (!hasAnimatableParts) {
      this.checkDone();
      return;
    }

    const randomPartName =
      animatableParts[Math.floor(Math.random() * animatableParts.length)];
    const partPositions = this.getPartPositions(animatableParts);
    if (partPositions.length === 0) {
      this.checkDone();
      return;
    }

    const target = this.getRandomTarget(partPositions);

    passenger.position.copy(startPos);
    passenger.lastPos.copy(startPos);
    passenger.target = target;
    passenger.nextTarget = null;
    passenger.state = "exiting";

    passenger.onReach = () => {
      passenger.state = "done";
      passenger.target = null;
      passenger.onReach = undefined;

      const trainStateEngine = this.context!.getEngine("TrainState");
      if (trainStateEngine) {
        (trainStateEngine as any).triggerPyramidPulse?.(randomPartName);
      }

      passengerEngine.remove(passenger.id);
      this.checkDone();
    };
  }

  private getPartPositions(partNames: string[]): THREE.Vector3[] {
    const scene = this.context!["scene"];
    if (!scene) return [];

    return partNames
      .map((name: string) => scene.getObjectByName(name))
      .filter(Boolean)
      .map((obj: any) => obj.getWorldPosition(new THREE.Vector3()));
  }

  private getRandomTarget(points: THREE.Vector3[]): THREE.Vector3 {
    return points[Math.floor(Math.random() * points.length)];
  }

  private checkDone(): void {
    this.activeProcesses = Math.max(0, this.activeProcesses - 1);
    if (this.activeProcesses <= 0) {
      this.activeProcesses = 0;
      this._state = "IDLE";

      if (this.onAllDone) {
        const cb = this.onAllDone;
        this.onAllDone = null;
        setTimeout(() => {
          cb();
        }, 300);
      } else {
        const trainStore = this.context!.getTrainStore();
        trainStore.setCanMoveTrain?.(true);
        trainStore.setAtStation?.(false);
      }
    }
  }

  // Spawn passengers at station
  
  spawnPassengers(station: any, stationConfig: any): void {
    const { position, forward, right } = this.getStationTransform(stationConfig);

    const areaWidth = 7;
    const passengerCount = PASSENGER_CONFIG.countPerStation;
    const areaDepth = 2.8;

    const cols = Math.ceil(Math.sqrt(passengerCount));
    const spacingX = areaWidth / cols;
    const spacingZ = areaDepth / cols;

    for (let i = 0; i < passengerCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const jitterX = (Math.random() - 0.5) * spacingX * 0.6;
      const jitterZ = (Math.random() - 0.5) * spacingZ * 0.6;

      const edgeBias = 0.8;
      const baseX =
        (col - (cols - 1) / 2) * spacingX +
        Math.sign(col - cols / 2) * edgeBias * spacingX;
      const baseZ = (row - (cols - 1) / 2) * spacingZ;

      const final = position
        .clone()
        .add(right.clone().multiplyScalar(baseX + jitterX))
        .add(forward.clone().multiplyScalar(baseZ + jitterZ));
//?
      final.y -= 1.8;

      const type = Math.floor(Math.random() * 10);

      passengerEngine.add({
        
        id: Math.random().toString(36).slice(2),
        stationId: station.id,
        position: final,
        target: undefined,
        nextTarget: undefined,
        animPhase: Math.random(),
        rotation: 0,
        modelType: type,
        lastPos: final.clone(),
        state: "idle",
        rotationOffset: (Math.random() - 0.5) * Math.PI * 0.8,

      });

    }
  }

  private syncSpawnedPassengers(): void {

    const stationsStore = this.context!.getStationsStore();
    const stations = stationsStore.stations || [];
  

    for (const station of stations) {

      if (this.spawnedStations.has(station.id)) { continue; }
      if (!station.isBuilt) { console.log('[PM] -> not built, skip'); continue; }

      const stationConfig = STATIONS_CONFIG.find(
        (config: any) => config.id === station.id,
      );
 
      if (!stationConfig || stationConfig.type !== "passenger") {  continue; }

      this.spawnPassengers(station, stationConfig);
      this.spawnedStations.add(station.id);
    }
  }

  private getRewardResourceType(type: unknown): RewardResourceType {
    return typeof type === "string" && REWARD_RESOURCE_TYPES.has(type)
      ? (type as RewardResourceType)
      : "coin";
  }

  private getStationTransform(station: any) {
    const [x, y, z] = station.pos;
    const position = new THREE.Vector3(x, y, z);
    const rot = station.rot ?? [0, 0, 0];
    const quat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rot[0], rot[1], rot[2])
    );
    const forward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(quat)
      .normalize();
    const right = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(quat)
      .normalize();

    return { position, forward, right, quat };
  }

  // Handle build trigger
  onBuildTrigger(): void {
    const pendingId = this.pendingStationForBuild;
    if (pendingId) {
      this.pendingStationForBuild = null;
      this.unboardAll(false, () => this.executeBoarding(pendingId), pendingId);
    } else {
      this.unboardAll(true);
    }
  }

  dispose(): void {
    this.unsubscribeStop?.();
    this.unsubscribeStop = null;
    this._state = "IDLE";
    this.activeProcesses = 0;
    this.onAllDone = null;
    this.pendingStationForBuild = null;
    this.spawnedStations.clear();
  }
}
