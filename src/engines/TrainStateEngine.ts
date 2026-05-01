  import * as THREE from "three";
  import { BaseEngine, type EngineUpdateContext } from "./BaseEngine";
  import { STATION_CONFIG } from "../utils/config";
  import { STATIONS_CONFIG } from "../utils/constants";
  import { TRANSITIONS } from "../utils/selectPath";
  import { getPointAtDistance } from "../utils/splineUtils";
  import { passengerEngine } from "./PassengerEngine";

  type TrainState =
    | "CRUISING"
    | "STOPPING"
    | "AT_STATION"
    | "LEAVING"
    | "STOPPING_FOR_SWITCH"
    | "AT_SWITCH"
    | "STOPPING_FOR_RAILWAY";

  export class TrainStateEngine extends BaseEngine {
    readonly name = "TrainState";
    priority = 40;

    private trainState: TrainState = "CRUISING";
    private currentStationId: string | null = null;
    private lastDirection = -1;
    private _railwayStopTime?: number;

    setTrainState(state: TrainState): void {
      this.trainState = state;
    }

    setCurrentStationId(id: string | null): void {
      this.currentStationId = id;
    }

    triggerWagonPulse(wagonIdx: number): void {
      const trainView = this.context!["trainViewRef"];
      if (trainView?.triggerWagonPulse) {
        trainView.triggerWagonPulse(wagonIdx);
      }
    }

    triggerPyramidPulse(partName?: string): void {
      const partRefs = this.context!["partRefs"];
      if (!partRefs || !partName) return;

      for (const [, partsMap] of partRefs.current) {
        const partRef = partsMap.get(partName);
        if (partRef) {
          (partRef as { triggerPulsePyramid: () => void }).triggerPulsePyramid();
          return;
        }
      }
    }

    update(_context: EngineUpdateContext): void {
      const { distanceRef, currentSpeedRef } = this.context!;

      const trainStore = this.context!.getTrainStore() as any;
      const stationsStore = this.context!.getStationsStore() as any;
      const decorStore = this.context!.getDecorStore() as any;

      const samplesArray = trainStore.samples || [];
      const activeIndex = trainStore.activeSplineIndex || 0;
      const samples = samplesArray[activeIndex] || [];

      if (samples.length < 2) return;

      const _total = samples[samples.length - 1]?.distance || 1;
      const rawDist = distanceRef.current;
      const normDist = ((rawDist % _total) + _total) % _total;
      const speed = currentSpeedRef.current ?? 0;

      // Track direction
      if (Math.abs(speed) > 0.05) {
        this.lastDirection = Math.sign(speed);
      } else {
        const moveIntent = trainStore.moveIntent;
        this.lastDirection = moveIntent === "BACKWARD" ? -1 : 1;
      }

      const direction = this.lastDirection;

      const stationsMap = new Map(STATIONS_CONFIG.map((s: any) => [s.id, s]));

      switch (this.trainState) {
        case "CRUISING": {
          this.handleCruising(
            normDist,
            _total,
            direction,
            activeIndex,
            samplesArray,
            speed,
            trainStore,
            stationsStore,
            decorStore,
            _context,
          );
          break;
        }

        case "STOPPING": {
          this.handleStopping(normDist, _total, stationsStore, stationsMap);
          console.log("handle-stop", this.handleStopping);
          break;
        }

        case "AT_STATION": {
          this.handleAtStation(
            normDist,
            samples,
            distanceRef,
            trainStore,
            stationsStore,
            decorStore,
          );
          break;
        }

        case "LEAVING": {
          this.handleLeaving(
            normDist,
            _total,
            direction,
            trainStore,
            stationsMap,
          );
          break;
        }

        case "STOPPING_FOR_SWITCH": {
          this.handleStoppingForSwitch(normDist, _total, trainStore);
          break;
        }

        case "STOPPING_FOR_RAILWAY": {
          this.handleStoppingForRailway(decorStore, trainStore);
          break;
        }
      }
    }

    private handleCruising(
      normDist: number,
      total: number,
      direction: number,
      activeIndex: number,
      samplesArray: any[],
      speed: number,
      trainStore: any,
      stationsStore: any,
      decorStore: any,
      _context: any,
      
    ): void {
      this.handleTransitions(
        normDist,
        total,
        speed,
        activeIndex,
        trainStore,
        samplesArray,
        _context,
        direction ,
      );
      if (this.trainState !== "CRUISING") return;

      const railwayBuilt = decorStore.railwayBuilt;
      if (!railwayBuilt && activeIndex === 0) {
        const RAILWAY_STOP_DIST = 291;
        const inRailwayZone =
          direction === 1
            ? normDist >= RAILWAY_STOP_DIST - 3 &&
              normDist <= RAILWAY_STOP_DIST + 3
            : normDist <= RAILWAY_STOP_DIST + 3 &&
              normDist >= RAILWAY_STOP_DIST - 3;

        if (inRailwayZone && Math.abs(speed) > 1.0) {
          this.trainState = "STOPPING_FOR_RAILWAY";
          this.stopTrainAt(RAILWAY_STOP_DIST);
          trainStore.setCanMoveTrain?.(false);
          return;
        }
      }

      const { station: nextStation } = this.getNextStation(
        normDist,
        total,
        direction,
        activeIndex,
      );
      if (!nextStation) return;

      const distToStation = this.getSignedDistance(
        nextStation.distance,
        normDist,
        total,
      );
      const isApproaching =
        direction === 1 ? distToStation > 0 : distToStation < 0;

      if (!isApproaching) return;

      const distAhead = Math.abs(distToStation);
      if (distAhead > STATION_CONFIG.APPROACH_ZONE) return;

      const stationState = stationsStore.stations?.find(
        (s: any) => s.id === nextStation.id,
      );
      const isBuilt = nextStation.decorToUnlock
        ? (stationState?.isBuilt ?? false)
        : true;
      const shouldStop = stationState?.shouldStop ?? false;

      const physics = passengerEngine.getAll();
      const [sx, sy, sz] = nextStation.pos;
      const so = nextStation.spawnOffset || [0, 0, 0];
      const stationPos = new THREE.Vector3(sx + so[0], sy + so[1], sz + so[2]);
      const radiusSq =
        STATION_CONFIG.PASSENGER_RADIUS * STATION_CONFIG.PASSENGER_RADIUS;

      const hasPeople = physics.some(
        (p: any) =>
          p.target === null &&
          p.state === "idle" &&
          p.position.distanceToSquared(stationPos) < radiusSq,
      );

      let reason = null;
      const isManualStop = Math.abs(speed) < 0.2 && distAhead < 6.5;

      if (isManualStop) reason = "manual";
      else if (nextStation.decorToUnlock && !isBuilt) reason = "build";
      else if (shouldStop) reason = "should_stop_flag";
      else if (hasPeople) reason = "passengers_waiting";

      if (reason && Math.abs(distToStation) < STATION_CONFIG.APPROACH_ZONE) {
        this.trainState = "STOPPING";
        this.currentStationId = nextStation.id;
        stationsStore.setNextStop?.(nextStation.id);
        this.stopTrainAt(nextStation.distance);
        trainStore.setCanMoveTrain?.(false);
      }
    }

    private handleTransitions(
      normDist: number,
      _total: number,
      speed: number,
      activeIndex: number,
      trainStore: any,
      samples: any[],
      context: EngineUpdateContext, 
      direction: number
    ): void {
      const { dt } = context;
      let movingDirection: "FORWARD" | "BACKWARD" | null = null;
      if (speed > 0.5) movingDirection = "FORWARD";
      else if (speed < -0.5) movingDirection = "BACKWARD";

      if (!movingDirection) return;

      const allTransitions = TRANSITIONS.filter(
        (tr: any) => tr.fromSpline === activeIndex,
      );
      if (!allTransitions.length) return;

      let best: any = null;
      let bestDist = Infinity;

      for (const t of allTransitions) {
        const triggerDist = t.stopDistance ?? t.atDistance;
        const distToTrigger = Math.abs(normDist - triggerDist);

        const dirOk =
          (t.intent === "FORWARD" && movingDirection === "FORWARD") ||
          (t.intent === "BACKWARD" && movingDirection === "BACKWARD");

        if (dirOk && distToTrigger < bestDist) {
          bestDist = distToTrigger;
          best = t;
        }
      }

      if (!best) return;

      const t = best;

      if (t.isManual && t.stopDistance) {
        const isEnteringArmZone = Math.abs(normDist - t.stopDistance) <= 3;

        const isMoving = Math.abs(speed) > 1.0;

        const canArm =
          this.trainState === "CRUISING" &&
          !trainStore.confirmedTransition &&
          !trainStore.hasTriggeredSwitch;
        if (isEnteringArmZone && isMoving && canArm) {
          isMoving &&
            this.trainState === "CRUISING" &&
            !trainStore.confirmedTransition &&
            !trainStore.hasTriggeredSwitch;

          trainStore.setHasTriggeredSwitch(true);
          trainStore.setPendingTransition(t);

          this.trainState = "STOPPING_FOR_SWITCH";
          this.context!.currentSpeedRef.current = 0;
          this.stopTrainAt(t.stopDistance);

          trainStore.setShowSwitchUI(true);
          trainStore.setCanMoveTrain(false);
        }

        if (
          trainStore.hasTriggeredSwitch &&
          Math.abs(normDist - t.stopDistance) > 5
        ) {
          trainStore.setHasTriggeredSwitch?.(false);
          trainStore.setPendingTransition(null);
        }

        const confirmed = trainStore.confirmedTransition === t;

     const previousDist = ((normDist - (speed * dt) % _total) + _total) % _total;
  const crossed = this.crossedDistance(previousDist, normDist, t.atDistance, direction, _total)
    const overshoot =
  direction > 0
    ? normDist - t.atDistance
    : t.atDistance - normDist;
        if (
          
          confirmed && crossed
        ) {
          this.performSwitch(t, trainStore, samples,overshoot);
          trainStore.setConfirmedTransition?.(null);
          trainStore.setHasTriggeredSwitch?.(false);
        }
      } else {
        const isTriggered =
          movingDirection === "FORWARD"
            ? normDist >= t.atDistance
            : normDist <= t.atDistance;
  const overshoot =
  direction > 0
    ? normDist - t.atDistance
    : t.atDistance - normDist;
        if (isTriggered) {
          this.context!.currentSpeedRef.current = 0;
          this.performSwitch(t, trainStore, samples, overshoot);
          
        }
      }
    }

    private performSwitch(t: any, trainStore: any, samplesArray: any[], overshoot:any): void {
      const newSamples = samplesArray[t.toSpline];
      if (!newSamples?.length) return;

      const distanceRef = this.context!.distanceRef;
      distanceRef.current =
  t.entryDistance + overshoot;

      trainStore.setHead?.({ distance: distanceRef.current, splineId: t.toSpline });

      const runtimeDistanceRef = trainStore.runtimeDistanceRef;
      if (runtimeDistanceRef) {
        runtimeDistanceRef.current = t.entryDistance;
      }

      trainStore.setActiveSpline?.(t.toSpline);
      trainStore.setMoveIntent?.(t.newIntent ?? t.intent);
      trainStore.setCanMoveTrain?.(true);
      
    }

    private handleStopping(
      _normDist: number,
      _total: number,
      stationsStore: any,
      stationsMap: any,
    ): void {
      const id = this.currentStationId;
      const st = stationsMap.get(id!);
      if (!st) return;

      const diff = this.getSignedDistance(st.distance, _normDist, _total);
      const passed = Math.abs(diff) > STATION_CONFIG.STOP_RADIUS + 0.2;
      const inStationZone = Math.abs(diff) < STATION_CONFIG.STOP_RADIUS;

      if (passed) {
        stationsStore.setNextStop?.(null);
        this.trainState = "CRUISING";
        this.currentStationId = null;
        this.resumeTrain();
        return;
      }

      const currentSpeedRef = this.context!.currentSpeedRef;
      if (inStationZone && Math.abs(currentSpeedRef.current) < 0.5) {
        if (!id) return;
        this.trainState = "AT_STATION";
        stationsStore.triggerStopEvent?.(id);

        const stData = STATIONS_CONFIG.find((s: any) => s.id === id);
        if (stData?.decorToUnlock) {
          const decorStore = this.context!.getDecorStore();
          decorStore.setActiveBuildId?.(stData.decorToUnlock);
        }
      }
    }

    private handleAtStation(
      _normDist: number,
      _samples: any[],
      _distanceRef: React.MutableRefObject<number>,
      trainStore: any,
      stationsStore: any,
      decorStore: any,
    ): void {
      const id = this.currentStationId;
      const stData = id
        ? STATIONS_CONFIG.find((s: any) => s.id === id)
        : undefined;
      const storeState = stationsStore.stations?.find((s: any) => s.id === id);
      const isBuilt = stData?.decorToUnlock
        ? (storeState?.isBuilt ?? false)
        : true;
      const full =
        passengerEngine.getPassengersByState("inside").length >=
        trainStore.maxCapacity;

      let hasPeople = false;
      const trainPoint = getPointAtDistance(_samples, _distanceRef.current || 0);
      const [sx, sy, sz] = stData?.pos || [0, 0, 0];
      const so = stData?.spawnOffset || [0, 0, 0];
      const stationPos = new THREE.Vector3(sx + so[0], sy + so[1], sz + so[2]);
      const radiusSq =
        STATION_CONFIG.PASSENGER_RADIUS * STATION_CONFIG.PASSENGER_RADIUS;

      hasPeople = passengerEngine
        .getAll()
        .some(
          (p: any) =>
            p.target === null &&
            p.state === "idle" &&
            ((trainPoint &&
              p.position.distanceToSquared(trainPoint.position) < radiusSq) ||
              (stationPos &&
                p.position.distanceToSquared(stationPos) < radiusSq)),
        );

      trainStore.setAtStation?.(true);

      const passengerManager = this.context!.getEngine("PassengerManager") as
        | { state?: string }
        | undefined;
      if (passengerManager?.state && passengerManager.state !== "IDLE") {
        return;
      }

      let shouldLeave = false;
      if (stData?.decorToUnlock && !isBuilt) {
        const noActiveBuild = decorStore.activeBuildId === null;
        shouldLeave = noActiveBuild && (!hasPeople || full);
      } else {
        shouldLeave = !hasPeople || full;
      }

      if (shouldLeave) {
        trainStore.setAtStation?.(false);
        trainStore.setCanMoveTrain?.(true);
        stationsStore.setNextStop?.(null);
        this.resumeTrain();
        this.trainState = "LEAVING";
      }
    }

    private handleLeaving(
      _normDist: number,
      _total: number,
      _direction: number,
      trainStore: any,
      _stationsMap: any,
    ): void {
      const id = this.currentStationId;
      const st = STATIONS_CONFIG.find((s: any) => s.id === id);

      if (!st) {
        this.trainState = "CRUISING";
        return;
      }

      let diff: number;
      if (_direction === 1) {
        diff = st.distance - _normDist;
      } else {
        diff = _normDist - st.distance;
      }

      if (Math.abs(diff) > STATION_CONFIG.SCAN_DISTANCE + 1) {
        trainStore.setAtStation?.(false);
        const stationsStore = this.context!.getStationsStore() as any;
        const decorStore = this.context!.getDecorStore() as any;
        stationsStore.setUpgradeMenu?.(false);
        decorStore.setActiveBuildId?.(null);
        this.currentStationId = null;
        this.trainState = "CRUISING";
      }
    }

    private handleStoppingForSwitch(
      _normDist: number,
      _total: number,
      trainStore: any,
    ): void {
      const sw = trainStore.activeSwitch ?? trainStore.pendingTransition;
      if (!sw) {
        this.trainState = "CRUISING";
        this.resumeTrain();
        return;
      }

      const diff = this.getSignedDistance(sw.atDistance, _normDist, _total);
      const passed = Math.abs(diff) > 2.5;

      if (passed) {
        this.trainState = "CRUISING";
        trainStore.setActiveSwitch?.(null);
        this.resumeTrain();
        return;
      }

      const currentSpeedRef = this.context!.currentSpeedRef;
      if (Math.abs(currentSpeedRef.current) < 0.1) {
        this.trainState = "AT_SWITCH";
        trainStore.setActiveSwitch?.(sw);
        trainStore.setShowSwitchUI?.(true);
      }
    }

    private handleStoppingForRailway(_decorStore: any, _trainStore: any): void {
      if (_decorStore.railwayBuilt) {
        this.trainState = "CRUISING";
        this.resumeTrain();
      } else {
        // Fallback: if stuck for too long without railway being built, force resume
        const now = Date.now();
        if (!this._railwayStopTime) {
          this._railwayStopTime = now;
        } else if (now - this._railwayStopTime > 5000) {
          // 5 second timeout
          this.trainState = "CRUISING";
          this.resumeTrain();
          this._railwayStopTime = undefined;
        }
      }
    }

    private stopTrainAt(distance: number): void {
      const physics = this.context!.getEngine("TrainPhysics") as
        | { stopAt?: (distance: number) => void }
        | undefined;
      physics?.stopAt?.(distance);
    }

    private resumeTrain(): void {
      const physics = this.context!.getEngine("TrainPhysics") as
        | { resume?: () => void }
        | undefined;
      physics?.resume?.();
      const trainStore = this.context!.getTrainStore() as any;
      trainStore.setCanMoveTrain?.(true);
    }

    private getNextStation(
      normDist: number,
      _total: number,
      direction: number,
      currentSpline: number,
    ): { station: any; dist: number } {
      let best = null;
      let bestDist = Infinity;

      for (const st of STATIONS_CONFIG) {
        if (st.spline !== currentSpline) continue;

        const diff = st.distance - normDist;
        const isAhead = direction === 1 ? diff > 0 : diff < 0;

        if (isAhead && Math.abs(diff) < bestDist) {
          bestDist = Math.abs(diff);
          best = st;
        }
      }

      return { station: best, dist: bestDist };
    }

    private getSignedDistance(a: number, b: number, _total: number): number {
      let diff = a - b;
      if (diff > _total / 2) diff -= _total;
      if (diff < -_total / 2) diff += _total;
      return diff;
    }

    dispose(): void {
      this.trainState = "CRUISING";
      this.currentStationId = null;
      this.lastDirection = -1;
    }

  private crossedDistance(from: number, to: number, target: number, direction: number, total: number): boolean {
  if (direction > 0) {
    if (total > 0 && to < from) return target >= from || target <= to;
    return from <= target && to >= target;
  }
  if (direction < 0) {
    if (total > 0 && to > from) return target <= from || target >= to;
    return from >= target && to <= target;
  }
  return false;
}
  }

  