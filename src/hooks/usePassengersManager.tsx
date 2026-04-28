import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import * as THREE from "three";
import { useStationsStore } from "../store/useStationStore";
import { STATIONS_CONFIG, WORLD_BASE } from "../utils/constants";
import { PASSENGER_CONFIG } from "../utils/config";
import { useTrainStore } from "../store/useTrainStore";
import { resourcesStore } from "../store/resourceStore";
import { useDecoreStore } from "../store/useDecorStore";
import { useThree } from "@react-three/fiber";
import { passengerEngine } from "../utils/passangerEngine";
import { getPointAtDistance } from "../utils/splineUtils";

const STATION_BUILDING_MAP: Record<string, string> = {
  Station_1: "Airport_building",
  Station_2: "Police_station",
  Station_3: "Hospital",
  Station_4: "Pizza",
  Station_5: "Observatory",
  Station_6: "Stadium",
};

export const PassengersManager = forwardRef(
  (
    {
      system,
      getWagonPos,
      wagonCount,
      onTriggerWagonPulse,
      triggerPyramidPulse,
      distanceRef,
    }: any,
    ref,
  ) => {
    const spawn = system.spawn;
    const goTo = system.goTo;
    const stations = useStationsStore((s) => s.stations);
    const subscribeToStop = useStationsStore((s) => s.subscribeToStop);
    const buildTrigger = useDecoreStore((s) => s.buildTrigger);
    const state = useRef("IDLE");
    const activeProcesses = useRef(0);
    const onAllDone = useRef<(() => void) | null>(null);
    const { camera, size, scene } = useThree();
    // Спільний колбек завершення анімацій
    const checkDone = useCallback(() => {
      activeProcesses.current = Math.max(0, activeProcesses.current - 1);
      if (activeProcesses.current <= 0) {
        activeProcesses.current = 0;
        state.current = "IDLE";

        if (onAllDone.current) {
          const cb = onAllDone.current;
          onAllDone.current = null;
          setTimeout(() => {
            cb();
          }, 300);
        } else {
          useTrainStore.getState().setCanMoveTrain(true);
          useTrainStore.getState().setAtStation(false);
        }
      }
    }, []);

    // Експортуємо метод для кнопки BUILD
    useImperativeHandle(ref, () => ({
      triggerBuildUnboard: () => {
        console.log("🛠 Сигнал будівництва: висаджуємо пасажирів до пірамід");
        unboardAll(true);
      },
    }));
    const isSubscribed = useRef(false);
    const pendingStationForBuild = useRef<string | null>(null);

    useEffect(() => {
      if (isSubscribed.current) return;
      isSubscribed.current = true;

      const unsub = subscribeToStop((stationId: string) => {
        const { stations } = useStationsStore.getState();

        const stationData = STATIONS_CONFIG.find((s) => s.id === stationId);
        const stationInfo = stations.find((s) => s.id === stationId);

        if (!stationData || !stationInfo) return;
        if (stationData.type !== "passenger") return;

        if (!stationInfo.isBuilt && stationData.decorToUnlock) {
          pendingStationForBuild.current = stationId;
          return;
        }

        unboardAll(false, () => executeBoarding(stationId), stationId);
      });

      return () => {
        unsub();
        isSubscribed.current = false;
      };
    }, []);
    // =========================
    // BOARDING (ПОСАДКА)
    // =========================
    const executeBoarding = (stationId: string) => {
      const stationData = STATIONS_CONFIG.find((s) => s.id === stationId);
      if (!stationData) {
        console.warn("executeBoarding: station not found", stationId);
        return;
      }

      const trainStore = useTrainStore.getState();

      const maxCapacity = trainStore.maxCapacity;

      const resType = (stationData?.resourceType || "coin") as any;

      if (!getWagonPos) {
        console.warn("executeBoarding: getWagonPos not available");
        trainStore.setCanMoveTrain(true);
        return;
      }
      const insideCount = passengerEngine
        .getAll()
        .filter((p) => p.state === "inside").length;

      const remainingSpace = maxCapacity - insideCount;

      if (remainingSpace <= 0) {
        console.log("executeBoarding: train full");
        trainStore.setCanMoveTrain(true);
        return;
      }

      const candidates = passengerEngine
        .getAll()
        .filter((p) => p.state === "idle" && p.stationId === stationId);

      if (candidates.length === 0) {
        console.log("executeBoarding: no passengers at station");
        trainStore.setCanMoveTrain(true);
        return;
      }

      const toBoard = candidates.slice(0, remainingSpace);
      activeProcesses.current = toBoard.length;

      const wagonCountSafe = Math.max(2, (wagonCount || 0) + 2);

      const getAnyWagonPos = getWagonPos;

      toBoard.forEach((p, i) => {
        const targetWagonIdx = i % wagonCountSafe;

        const phys = passengerEngine.getAll().find((pp) => pp.id === p.id);
        if (!phys) return;

        const delay = i * 150;
        phys.state = "boarding";
        phys.target = null;
        phys.nextTarget = null;
        phys.onReach = undefined;
        setTimeout(() => {
          const liveDist = distanceRef?.current ?? stationData.distance;
          console.log(liveDist);
          const index = useTrainStore.getState().activeSplineIndex;
          const spline = useTrainStore.getState().samples[index];
          const boardPointData = getPointAtDistance(
  spline,
  liveDist
);

const baseDistance = liveDist;
const WAGON_DISTANCE_STEP = -5;

const wagonDistance =
  baseDistance + (targetWagonIdx - wagonCountSafe / 2) * WAGON_DISTANCE_STEP;

const boardPoint = getPointAtDistance(spline, wagonDistance);

if (!boardPoint) {
  checkDone();
  return;
}


          
          if (!boardPoint) {
            checkDone();
            return;
          }
          phys.state = "boarding";
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

          goTo(p.id, finalTargetPos);

          phys.onReach = () => {
            if (phys.state === "inside") return;

            phys.state = "inside";

            const vector = phys.position.clone().project(camera);

            const screenX = (vector.x * 0.5 + 0.5) * size.width;
            const screenY = (vector.y * -0.5 + 0.5) * size.height;

            resourcesStore
              .getState()
              .applyRewardBatch(screenX, screenY, resType, 1);

            onTriggerWagonPulse(targetWagonIdx);

            const cb = phys.onReach;
            phys.onReach = undefined;

            cb?.();
            if (!boardPoint) {
              checkDone();
              return;
            }
            
          };
        }, delay);
      });
    };
    // =========================
    // UNBOARDING (ВИСАДКА)
    // =========================
    function getPartPositions(partNames: string[]) {
      return partNames
        .map((name) => scene.getObjectByName(name))
        .filter(Boolean)
        .map((obj) => obj!.getWorldPosition(new THREE.Vector3()));
    }
    function getRandomTarget(points: THREE.Vector3[]) {
      return points[Math.floor(Math.random() * points.length)];
    }
    const unboardAll = (
      isBuildMode: boolean,
      callback?: () => void,
      stationIdForUnboard?: string,
    ) => {
      const insidePassengers = passengerEngine
        .getAll()
        .filter((p) => p.state === "inside");

      if (insidePassengers.length === 0) {
        callback?.();
        return;
      }

      let targetStationPos: THREE.Vector3 | null = null;
      let exitStartOverride: THREE.Vector3 | null = null;
      if (stationIdForUnboard) {
        const stationConfig = STATIONS_CONFIG.find(
          (s) => s.id === stationIdForUnboard,
        );
        if (stationConfig) {
          const liveDist = distanceRef?.current;
          const index = useTrainStore.getState().activeSplineIndex;
          const spline = useTrainStore.getState().samples[index];
          const exitPoint = getPointAtDistance(spline, liveDist); // Pass samples from store
          console.log('exit:', exitPoint)
         if (exitPoint) {
  const EXIT_SIDE_DISTANCE = 0;

  const base = exitPoint.position.clone();
  const tangent = exitPoint.tangent.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);

  const right = new THREE.Vector3()
    .crossVectors(tangent, up)
    .normalize();

  // 👉 старт (де "двері")
  const startPos = base.clone();

  // 👉 куди виходять
  const exitPos = base
    .clone()
    .add(right.clone().multiplyScalar(EXIT_SIDE_DISTANCE));

  // зберігаємо обидві точки
  targetStationPos = exitPos;

  // 🔥 ВАЖЛИВО: прокинь startPos назовні
  exitStartOverride = startPos;
}
        }
      }

      const safeWagonCount = Math.max(2, (wagonCount || 0) + 2);

      state.current = "UNBOARDING";
      activeProcesses.current = insidePassengers.length;
      onAllDone.current = callback || null;

      insidePassengers.forEach((passenger, i) => {
        setTimeout(() => {
          const wagonIdx = i % safeWagonCount;
          const doorPos = getWagonPos(wagonIdx);

          let exitStartPos =
  exitStartOverride?.clone() ||
  doorPos ||
  getWagonPos(0) ||
  new THREE.Vector3();
          if (isBuildMode) {
            processExit(
              passenger,
              exitStartPos.clone(),
              i,
              wagonIdx,
              undefined,
              stationIdForUnboard,
            );
          } else if (targetStationPos) {
            const randomOffset = new THREE.Vector3(
              (Math.random() - 0.5) * 3,
              0,
              (Math.random() - 0.5) * 3,
            );
            const finalExitPos = targetStationPos.clone().add(randomOffset);
            processExit(
              passenger,
              exitStartPos.clone(),
              i,
              wagonIdx,
              finalExitPos,
              stationIdForUnboard,
            );
          } else {
            const exitPos = doorPos || getWagonPos(0) || new THREE.Vector3();
            processExit(
              passenger,
              exitPos.clone(),
              i,
              wagonIdx,
              undefined,
              stationIdForUnboard,
            );
          }
        }, i * 100);
      });
    };
    // Виніс логіку створення в окрему функцію для чистоти
    const processExit = (
      passenger: any,
      startPos: THREE.Vector3,
      _index: number,
      wagonIdx:number,
      specificExitTarget?: THREE.Vector3,
      stationId?: string,
    ) => {
      if (!stationId) {
        console.warn("processExit: stationId is required for animation");
        checkDone();
        return;
      }

      const buildingId = STATION_BUILDING_MAP[stationId];
      if (!buildingId) {
        console.warn("processExit: no building found for station:", stationId);
        checkDone();
        return;
      }

      const building = WORLD_BASE.find((w) => w.id === buildingId) as any;
      if (!building) {
        console.warn("processExit: building not found:", buildingId);
        checkDone();
        return;
      }

      const animatableParts = building?.animatedParts || [];
      const hasAnimatableParts = animatableParts.length > 0;

      // Two-stage exit: station platform -> building part
      if (specificExitTarget && hasAnimatableParts) {
        const partPositions = getPartPositions(animatableParts);
        const buildingTarget = getRandomTarget(partPositions);
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

          if (triggerPyramidPulse) triggerPyramidPulse(randomPartName);
          passengerEngine.remove(passenger.id);
        };
        
if (onTriggerWagonPulse) {
  onTriggerWagonPulse(wagonIdx);
}
        checkDone();
        return;
      }

      // Single-stage exit
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
        };

        checkDone();
        return;
      }

      // Exit to random building part (no specific target)
      if (!hasAnimatableParts) {
        console.warn(
          "processExit: no animatable parts found for building:",
          buildingId,
        );
        checkDone();
        return;
      }

      const randomPartName =
        animatableParts[Math.floor(Math.random() * animatableParts.length)];

      const partPositions = getPartPositions(animatableParts);
      const target = getRandomTarget(partPositions);

      passenger.position.copy(startPos);
      passenger.lastPos.copy(startPos);
      passenger.target = target;
      passenger.nextTarget = null;
      passenger.state = "exiting";

      passenger.onReach = () => {
        passenger.state = "done";
        passenger.target = null;
        passenger.onReach = undefined;

        if (triggerPyramidPulse) triggerPyramidPulse(randomPartName);
        passengerEngine.remove(passenger.id);
      };
    };
    useEffect(() => {
      if (!buildTrigger) return;

      const pendingId = pendingStationForBuild.current;

      if (pendingId) {
        console.log("🛠 BUILD DONE → unboard + board at station:", pendingId);
        pendingStationForBuild.current = null;
        unboardAll(false, () => executeBoarding(pendingId), pendingId);
      } else {
        console.log("🛠 BUILD DONE → unboard passengers");
        unboardAll(true);
      }
    }, [buildTrigger]);

    // =========================
    // ЛОГІКА ЗУПИНКИ
    // =========================
    // useEffect(() => {
    //   const unsub = subscribeToStop((stationId: string) => {
    //     const { stations } = useStationsStore.getState();

    //     const stationData = STATIONS_CONFIG.find((s) => s.id === stationId);
    //     const stationInfo = stations.find((s) => s.id === stationId);

    //     if (!stationData || !stationInfo) return;

    //     if (stationData.type !== "passenger") return;

    //     unboardAll(false, () => {
    //       executeBoarding(stationId);
    //     });
    //   });

    //   return () => unsub();
    // }, []);

    // =========================
    // SPAWN ПАСАЖИРІВ
    // =========================
    function getStationTransform(station: any) {
      const [x, y, z] = station.pos;

      const position = new THREE.Vector3(x, y, z);

      const rot = station.rot ?? [0, 0, 0];

      const quat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rot[0], rot[1], rot[2]),
      );

      const forward = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(quat)
        .normalize();
      const right = new THREE.Vector3(1, 0, 0)
        .applyQuaternion(quat)
        .normalize();

      return { position, forward, right, quat };
    }
    const spawnedStations = useRef(new Set<string>());
    useEffect(() => {
      stations.forEach((reg) => {
        if (spawnedStations.current.has(reg.id)) return;
        spawnedStations.current.add(reg.id);
        const config = STATIONS_CONFIG.find((c) => c.id === reg.id);
        if (!config || config.type !== "passenger" || !reg.isBuilt) return;
        const { position, forward, right } = getStationTransform(config);

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

          // 🔥 зміщення до краю платформи
          const edgeBias = 0.8;

          const baseX =
            (col - (cols - 1) / 2) * spacingX +
            Math.sign(col - cols / 2) * edgeBias * spacingX;

          const baseZ = (row - (cols - 1) / 2) * spacingZ;

          const final = position
            .clone()
            .add(right.clone().multiplyScalar(baseX + jitterX))
            .add(forward.clone().multiplyScalar(baseZ + jitterZ));

          final.y -= 1.8;

          const type = Math.floor(Math.random() * 10);

          spawn(final, type, reg.id);
        }
        console.count("SPAWN CALL");
      });
    }, [stations, spawn]);
    return null;
  },
);

export default PassengersManager;
