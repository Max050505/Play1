import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect } from "react";
import { useTrainStore } from "../store/useTrainStore";
import { useStationsStore } from "../store/useStationStore";
import { useDecoreStore } from "../store/useDecorStore";
import { usePassengerStore } from "../store/usePassengersStore";
import { getPointAtDistance } from "../utils/splineUtils";
import { STATION_CONFIG } from "../utils/config";
import { useTrainPhysics } from "../hooks/useTrainPhysics";
import { useCameraSplineFollow } from "../hooks/useCameraSplineFollow";
import { STATIONS_CONFIG } from "../utils/constants";
import { TRANSITIONS } from "../utils/selectPath";
import { passengerEngine } from "../utils/passangerEngine";

const { SCAN_DISTANCE, PASSENGER_RADIUS, STOP_RADIUS, APPROACH_ZONE } =
  STATION_CONFIG;

// Helper: Calculate signed distance accounting for loop
const getSignedDistance = (a: number, b: number, total: number) => {
  let diff = a - b;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
};

const stationsMap = new Map(STATIONS_CONFIG.map((s) => [s.id, s]));

type TrainState =
  | "CRUISING"
  | "STOPPING"
  | "AT_STATION"
  | "LEAVING"
  | "STOPPING_FOR_SWITCH"
  | "AT_SWITCH"
  | "STOPPING_FOR_RAILWAY";

interface LoopProps {
  distanceRef: React.MutableRefObject<number>;
  currentSpeedRef: React.MutableRefObject<number>;
}

const Loop = ({ distanceRef, currentSpeedRef }: LoopProps) => {
  const samplesArray = useTrainStore((s) => s.samples);
  const activeIndex = useTrainStore((s) => s.activeSplineIndex);
  const runtimeDistanceRef = useTrainStore((s) => s.runtimeDistanceRef);
  const samples = samplesArray[activeIndex] || [];
  const wagonCount = useTrainStore((s) => s.wagons.length);
  const maxSpeed = useTrainStore((s) => s.maxSpeed);
  const stations = useStationsStore((s) => s.stations);

  const { updateTrain, stopAt, resume } = useTrainPhysics(
    samples,
    wagonCount,
    { maxSpeed },
    distanceRef,
    currentSpeedRef,
  );

  useEffect(() => {
    const { setResumeFromSwitchFn } = useTrainStore.getState();
    setResumeFromSwitchFn(resume);
  }, [resume]);

  const { updateCamera } = useCameraSplineFollow(distanceRef, [-35, 60, 35], 6);
  const lastDirection = useRef(-1);
  const trainState = useRef<TrainState>("CRUISING");
  const currentStationId = useRef<string | null>(null);


  const getNextStation = (
    normDist: number,
    total: number,
    direction: number,
    currentSpline: number,
  ) => {
    let best = null;
    let bestDist = Infinity;

    for (const st of STATIONS_CONFIG) {
      if (st.spline !== currentSpline) continue;
      
      const diff = getSignedDistance(st.distance, normDist, total);

      const isAhead = direction === 1 ? diff > 0 : diff < 0;

      if (isAhead && Math.abs(diff) < bestDist) {
        bestDist = Math.abs(diff);
        best = st;
      }
    }

    return { station: best, dist: bestDist };
  };

  useFrame((state, dt) => {
    if (samples.length < 2) return;
    const physics = passengerEngine.getAll();
    updateTrain(dt);
    updateCamera(state, dt);

    const total = samples[samples.length - 1].distance || 1;
    const rawDist = distanceRef.current;
    console.log(rawDist)
    const normDist = ((rawDist % total) + total) % total;
    const speed = currentSpeedRef.current ?? 0;
  
    const moveIntent = useTrainStore.getState().moveIntent;
    const intentDirection = moveIntent === "BACKWARD" ? -1 : 1;

    if (Math.abs(speed) > 0.05) {
      lastDirection.current = Math.sign(speed);
    } else {
      lastDirection.current = intentDirection;
    }
    const direction = lastDirection.current;
    const stationsStore = useStationsStore.getState();
    const decorStore = useDecoreStore.getState();
    const trainStore = useTrainStore.getState();
    const passengerStore = usePassengerStore.getState();

    trainStore.setRawDistance(distanceRef.current);

    switch (trainState.current) {
      // =========================
      // 1. CRUISING (Звичайний рух, шукаємо станцію)
      // =========================
      case "CRUISING": {
        if (trainState.current !== "CRUISING") return;
        const handleTransitions = () => {
          let movingDirection: "FORWARD" | "BACKWARD" | null = null;
          if (speed > 0.5) movingDirection = "FORWARD";
          else if (speed < -0.5) movingDirection = "BACKWARD";

          if (!movingDirection) return;

          // 1. Get ALL transitions for current spline
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

          // === ЛОГІКА ДЛЯ РУЧНОГО ПЕРЕХОДУ (isManual: true) ===
          if (t.isManual && t.stopDistance) {
            const isEnteringZone = Math.abs(speed) > 1.0;
            const inZone =
              normDist <= t.stopDistance && normDist > t.stopDistance - 3;
console.log('zone:',inZone)
            if (inZone) {
              if (
                isEnteringZone &&
                trainState.current === "CRUISING" &&
                !trainStore.confirmedTransition &&
                !trainStore.hasTriggeredSwitch
              ) {
                trainStore.setHasTriggeredSwitch(true);
                trainState.current = "STOPPING_FOR_SWITCH";
                stopAt(t.stopDistance);
                trainStore.setPendingTransition(t);
                trainStore.setShowSwitchUI(true);
                trainStore.setCanMoveTrain(false)
              }
            }

            // Clear trigger if passed
            if (
              trainStore.hasTriggeredSwitch &&
              Math.abs(normDist - t.stopDistance) > 5
            ) {
              trainStore.setHasTriggeredSwitch(false);
            }

            if (
              trainStore.confirmedTransition === t &&
              normDist <= t.stopDistance + 3
            ) {
              performSwitch(t);
              trainStore.setConfirmedTransition(null);
              trainStore.setHasTriggeredSwitch(false);
            }
          }

          // === ЛОГІКА ДЛЯ АВТОМАТИЧНОГО ПЕРЕХОДУ ===
          else {
            const isTriggered =
              movingDirection === "FORWARD"
                ? normDist >= t.atDistance
                : normDist <= t.atDistance;

            console.log(
              "movingdir:",
              movingDirection,
              "normDist:",
              normDist,
              "t.atDistance",
              t.atDistance,
            );
            if (isTriggered) {
              currentSpeedRef.current = 0;
              performSwitch(t);
            }
          }
        };

        // Допоміжна функція
        const performSwitch = (t: any) => {
          const newSamples = samplesArray[t.toSpline];
          if (!newSamples?.length) return;

          distanceRef.current = t.entryDistance;
          if (runtimeDistanceRef) {
            runtimeDistanceRef.current = t.entryDistance;
          }
          trainStore.setActiveSpline(t.toSpline);
          trainStore.setMoveIntent(t.newIntent ?? t.intent);
          console.log(`🔄 ПЕРЕХІД ВИКОНАНО: на сплайн ${t.toSpline}`);
        };
        handleTransitions();

        // === RAILWAY BUILD CHECK ===
        const railwayBuilt = decorStore.railwayBuilt;
        if (!railwayBuilt && activeIndex === 0) {
          const RAILWAY_STOP_DIST = 290;
          const inRailwayZone = direction === 1 
            ? normDist >= RAILWAY_STOP_DIST - 3 && normDist <= RAILWAY_STOP_DIST + 3
            : normDist <= RAILWAY_STOP_DIST + 3 && normDist >= RAILWAY_STOP_DIST - 3;

          if (inRailwayZone && trainState.current === "CRUISING" && Math.abs(speed) > 1.0) {
            trainState.current = "STOPPING_FOR_RAILWAY";
            stopAt(RAILWAY_STOP_DIST);
            trainStore.setCanMoveTrain(false);
          }
        }

        // === OPTIMIZED STATION CHECK ===

        const currentId = currentStationId.current;
        let targetStation = null;


        if (currentId) {
          targetStation = stationsMap.get(currentId) || null;
        }

        if (!targetStation) {
          const { station: next } = getNextStation(normDist, total, direction, activeIndex);
          targetStation = next;
        }

        if (!targetStation) return;

        const distToStation = getSignedDistance(
          targetStation.distance,
          normDist,
          total,
        );

 
        const isApproaching =
          direction === 1 ? distToStation > 0 : distToStation < 0;

        const isInZone = Math.abs(distToStation) < STOP_RADIUS;


        const passedStation =
          direction === 1
            ? distToStation < -STOP_RADIUS
            : distToStation > STOP_RADIUS;

        if (!isInZone && passedStation && trainState.current === "CRUISING") {
          currentStationId.current = null;
        }


        const distAhead = Math.abs(distToStation);
        if (!isApproaching || distAhead > SCAN_DISTANCE) return;


        const stationState = stations.find((s) => s.id === targetStation.id);
        const isBuilt = stationState?.isBuilt ?? false;
        const shouldStop = stationState?.shouldStop ?? false;

        const isManualStop = Math.abs(speed) < 0.2 && distAhead < 6.5;

        let reason = null;

        if (isManualStop) reason = "manual";
        else if (targetStation.decorToUnlock && !isBuilt) reason = "build";
        else if (shouldStop) reason = "should_stop_flag";
        else {
          const point = getPointAtDistance(samples, targetStation.distance);
          if (point) {
            const radiusSq = PASSENGER_RADIUS * PASSENGER_RADIUS;

            const [sx, sy, sz] = targetStation.pos;
            const so = targetStation.spawnOffset || [0, 0, 0];

            const stationPos = new THREE.Vector3(
              sx + so[0],
              sy + so[1],
              sz + so[2],
            );

            const hasPeople = physics.some(
              (p) =>
                p.target === null &&
                p.state === "idle" &&
                p.position.distanceToSquared(stationPos) < radiusSq,
            );
            if (hasPeople) reason = "passengers_waiting";
          }
        }

        // === Bug 6 FIX: Add zone check to trigger stop ===
        if (reason && Math.abs(distToStation) < APPROACH_ZONE) {
          console.log(
            `🎯 STOPPING at: ${targetStation.id} (Reason: ${reason})`,
          );
          trainState.current = "STOPPING";
          currentStationId.current = targetStation.id;
          stationsStore.setNextStop(targetStation.id);
        }
        break;
      }

      // =========================
      // 2. STOPPING
      // =========================
      case "STOPPING": {
        const id = currentStationId.current;

        const st = stationsMap.get(id!);
        if (!st) return;

        const diff = getSignedDistance(st.distance, normDist, total);

        // === BUG 5 FIX: Better passed check ===
        const passed = Math.abs(diff) > STOP_RADIUS * 2;
        const inStationZone = Math.abs(diff) < STOP_RADIUS;

        if (passed) {
          stationsStore.setNextStop(null);
          trainState.current = "CRUISING";
          currentStationId.current = null;
          return;
        }

        if (inStationZone && Math.abs(speed) < 0.5) {
          if (!id) return;
          trainState.current = "AT_STATION";
          stationsStore.triggerStopEvent(id);

          if (st.decorToUnlock) {
            decorStore.setActiveBuildId(st.decorToUnlock);
          }
        }
        break;
      }

      // =========================
      // === BUG 7 FIX: Use cached stationsMap ===
      case "AT_STATION": {
        const id = currentStationId.current;
        const stData = id ? stationsMap.get(id) : undefined;
        const storeState = useStationsStore.getState().stations.find(
  (s) => s.id === id
);

        const isBuilt = stData?.decorToUnlock
          ? (storeState?.isBuilt ?? false)
          : true;
        const full = passengerStore.getCountInside() >= trainStore.maxCapacity;

        let hasPeople = false;

        // Check passengers BOTH near train AND near station
        const trainPoint = getPointAtDistance(samples, distanceRef.current || 0);
        const [sx, sy, sz] = stData?.pos || [0, 0, 0];
        const so = stData?.spawnOffset || [0, 0, 0];
        const stationPos = new THREE.Vector3(
          sx + so[0],
          sy + so[1],
          sz + so[2],
        );
        const radiusSq = PASSENGER_RADIUS * PASSENGER_RADIUS;

        hasPeople = physics.some(
          (p: any) =>
            p.target === null &&
            !p.isBoarding &&
            // Check near train OR near station
            ((trainPoint &&
              p.position.distanceToSquared(trainPoint.position) < radiusSq) ||
              (stationPos &&
                p.position.distanceToSquared(stationPos) < radiusSq)),
        );

        let shouldLeave = false;
        trainStore.setAtStation(true);
        // Логіка відправлення
        if (stData?.decorToUnlock && !isBuilt) {
          const noActiveBuild = decorStore.activeBuildId === null;
          shouldLeave = noActiveBuild && (!hasPeople || full);
        } else {
          shouldLeave = !hasPeople || full;
        }

        if (shouldLeave) {
          console.log("🚂 LEAVING:", id);
          trainStore.setAtStation(false);
          trainStore.setCanMoveTrain(true);
          stationsStore.setNextStop(null);
          resume();
          trainState.current = "LEAVING";
        }
        break;
      }

      // =========================
      // 4. LEAVING
      // =========================
      case "LEAVING": {
        const id = currentStationId.current;
        const st = STATIONS_CONFIG.find((s) => s.id === id);

        if (!st) {
          trainState.current = "CRUISING";
          return;
        }

        let diff: number;
        if (direction === 1) {
          diff = st.distance - normDist;
        } else {
          diff = normDist - st.distance;
        }

        if (Math.abs(diff) > SCAN_DISTANCE + 1) {
          trainStore.setAtStation(false);
          stationsStore.setUpgradeMenu(false);
          decorStore.setActiveBuildId(null);
          currentStationId.current = null;
          trainState.current = "CRUISING";
        }
        break;
      }

      // =========================
      // 5. STOPPING_FOR_SWITCH
      // =========================
      case "STOPPING_FOR_SWITCH": {
        const sw = trainStore.activeSwitch;
        if (!sw) {
          trainState.current = "CRUISING";
          resume();
          break;
        }

const diff = getSignedDistance(sw.atDistance, normDist, total);
        
     const passed = Math.abs(diff) > 2.5;
        if (passed) {
          trainState.current = "CRUISING";
          resume();
          break;
        }

        if (Math.abs(speed) < 0.1) {
          trainState.current = "AT_SWITCH";
          trainStore.setActiveSwitch(sw);
          trainStore.setShowSwitchUI(true);
        }
        break;
      }

      // =========================
      // 7. STOPPING_FOR_RAILWAY
      // =========================
      case "STOPPING_FOR_RAILWAY": {
        if (decorStore.railwayBuilt) {
          trainState.current = "CRUISING";
          resume();
        }
        break;
      }
    }
  });

  return null;
};

export default Loop;
