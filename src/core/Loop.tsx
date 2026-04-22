import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useTrainStore } from "../store/useTrainStore";
import { useStationsStore } from "../store/useStationStore";
import { useDecoreStore } from "../store/useDecorStore";
import { usePassengerStore } from "../store/usePassengersStore";
import { getPointAtDistance } from "../utils/splineUtils";
import { STATION_CONFIG, TRACK_SWITCHES, TRANSITIONS } from "../utils/config";
import { useTrainPhysics } from "../hooks/useTrainPhysics";
import { useCameraSplineFollow } from "../hooks/useCameraSplineFollow";
import { STATIONS_DATA } from "../utils/constants";

const { SCAN_DISTANCE, PASSENGER_RADIUS } = STATION_CONFIG;

type TrainState = "CRUISING" | "STOPPING" | "AT_STATION" | "LEAVING";

interface LoopProps {
  distanceRef: React.RefObject<number>;
  currentSpeedRef: React.RefObject<number>;
  system: any;
}

const Loop = ({ distanceRef, currentSpeedRef, system }: LoopProps) => {
  const samplesArray = useTrainStore((s) => s.samples);
  const activeIndex = useTrainStore((s) => s.activeSplineIndex);
  const runtimeDistanceRef = useTrainStore((s) => s.runtimeDistanceRef);
  const samples = samplesArray[activeIndex] || [];
  const wagonCount = useTrainStore((s) => s.wagons.length);
  const maxSpeed = useTrainStore((s) => s.maxSpeed);

  const { updateTrain } = useTrainPhysics(
    samples,
    wagonCount,
    { maxSpeed },
    distanceRef,
    currentSpeedRef,
  );

  const { updateCamera } = useCameraSplineFollow(distanceRef, [-35, 60, 35], 6);
  const lastDirection = useRef(-1);
  const trainState = useRef<TrainState>("CRUISING");
  const currentStationId = useRef<string | null>(null);

  // Оптимізований пошук найближчої станції попереду
  const getNextStation = (
    normDist: number,
    total: number,
    direction: number,
  ) => {
    let best = null;
    let bestDist = Infinity;

    for (const st of STATIONS_DATA) {
      let diff = st.distance - normDist;

      if (diff < -total / 2) diff += total;
      if (diff > total / 2) diff -= total;

      diff *= direction;

      if (diff > 0 && diff < bestDist) {
        bestDist = diff;
        best = st;
      }
    }

    return { station: best, dist: bestDist };
  };

  useFrame((state, dt) => {
    if (samples.length < 2) return;

    updateTrain(dt);
    updateCamera(state, dt);

    const total = samples[samples.length - 1].distance || 1;
    const rawDist = distanceRef.current;
    const normDist = ((rawDist % total) + total) % total;
    const speed = currentSpeedRef.current ?? 0;
    console.log(rawDist);
    
    const moveIntent = useTrainStore.getState().moveIntent;
    const intentDirection = moveIntent === "BACKWARD" ? -1 : 1;
    
    if (Math.abs(speed) > 0.05) {
      lastDirection.current = Math.sign(speed);
    } else {
      lastDirection.current = intentDirection;
    }
    const direction = lastDirection.current;
    // ВАЖЛИВО: Отримуємо свіжий стейт без підписки (щоб не було ре-рендерів)
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
        // Check for track switches FIRST (always run this)
        const currentSwitches = TRACK_SWITCHES.filter(
          (s) => s.splineIndex === activeIndex,
        );
        let foundSwitch = null;
        
        for (const sw of currentSwitches) {
          let distToSwitch = sw.distance - normDist;

          if (distToSwitch < -total / 2) distToSwitch += total;
          if (distToSwitch > total / 2) distToSwitch -= total;

          distToSwitch *= direction;
          
          if (distToSwitch > 0 && distToSwitch <= sw.triggerDistance) {
            foundSwitch = sw;
            break;
          }
        }
        
        if (foundSwitch) {
          trainStore.setActiveSwitch(foundSwitch);
          trainStore.setShowSwitchUI(true);
        } else if (trainStore.showSwitchUI && trainStore.activeSwitch) {
          let distAfterSwitch = trainStore.activeSwitch.distance - normDist;

          if (distAfterSwitch < -total / 2) distAfterSwitch += total;
          if (distAfterSwitch > total / 2) distAfterSwitch -= total;

          distAfterSwitch *= direction;
          
          if (distAfterSwitch > trainStore.activeSwitch.triggerDistance) {
            trainStore.setShowSwitchUI(false);
            trainStore.setActiveSwitch(null);
          }
        }

        // Auto-transition: check transitions based on movement direction
        const handleTransitions = () => {
          let movingDirection: "FORWARD" | "BACKWARD" | null = null;
          if (speed > 0.1) movingDirection = "FORWARD";
          else if (speed < -0.1) movingDirection = "BACKWARD";

          // Find matching transition based on current spline and direction
          const t = TRANSITIONS.find((tr) => {
            if (tr.fromSpline !== activeIndex) return false;
            if (movingDirection === "FORWARD") {
              return normDist >= tr.atDistance;
            } else if (movingDirection === "BACKWARD") {
              return normDist <= tr.atDistance;
            }
            return false;
          });
          if (!t) return;

          const newSamples = samplesArray[t.toSpline];
          if (!newSamples?.length) return;

          distanceRef.current = t.entryDistance;
          if (runtimeDistanceRef) {
            runtimeDistanceRef.current = t.entryDistance;
          }
          trainStore.setActiveSpline(t.toSpline);
          trainStore.setMoveIntent(t.intent);
          console.log(
            `🔄 TRANSITION: spline ${activeIndex} → ${t.toSpline} at ${t.entryDistance}, intent: ${t.intent}`,
          );
        };
        handleTransitions();

        // Then check for stations
        const { station, dist: distAhead } = getNextStation(
          normDist,
          total,
          direction,
        );

        if (!station || distAhead > SCAN_DISTANCE) return;
        
        // Ми в зоні сканування. Перевіряємо, чи треба зупинятися
        const stationState = stationsStore.stations.find(
          (s) => s.id === station.id,
        );
        const isBuilt = stationState?.isBuilt ?? false;
        const shouldStop = stationState?.shouldStop ?? false;
        
        const isManualStop = Math.abs(speed) < 0.2 && distAhead < 1.5;

        let reason = null;

        if (isManualStop) reason = "manual";
        else if (station.decorToUnlock && !isBuilt) reason = "build";
        else if (shouldStop) reason = "should_stop_flag";
        else {
          const point = getPointAtDistance(samples, station.distance);
          if (point) {
            const radiusSq = PASSENGER_RADIUS * PASSENGER_RADIUS;
            const hasPeople = system.physics.some(
              (p: any) =>
                p.target === null &&
                !p.isBoarding &&
                p.position.distanceToSquared(point.position) < radiusSq,
            );
            if (hasPeople) reason = "passengers_waiting";
          }
        }

        if (reason) {
          console.log(`🎯 STOPPING at: ${station.id} (Reason: ${reason})`);
          trainState.current = "STOPPING";
          currentStationId.current = station.id;
          stationsStore.setNextStop(station.id);
        }
        break;
      }

      // =========================
      // 2. STOPPING (Гальмуємо до повної зупинки)
      // =========================
      case "STOPPING": {
        const id = currentStationId.current;
        const st = STATIONS_DATA.find((s) => s.id === id);
        if (!st) return;

        // Рахуємо найкоротшу відстань (може бути від'ємною, якщо трохи проїхали)
        let diff = st.distance - normDist;
        if (diff < -total / 2) diff += total;
        if (diff > total / 2) diff -= total;
        diff *= direction;
        // Якщо пролетіли станцію (швидкість була зависока) — відміняємо зупинку
        if (diff < -2.5) {
          console.log("❌ OVERSHOT:", id);
          stationsStore.setNextStop(null);
          trainState.current = "CRUISING";
          currentStationId.current = null;
          return;
        }

        // Якщо швидкість впала майже до нуля — ми прибули
        if (Math.abs(speed) < 0.1) {
          trainState.current = "AT_STATION";
          if (id) stationsStore.triggerStopEvent(id);
          if (st.decorToUnlock) decorStore.setActiveBuildId(st.decorToUnlock);
        }
        break;
      }

      // =========================
      // 3. AT_STATION (Стоїмо, чекаємо завершення посадки/будівництва)
      // =========================
      case "AT_STATION": {
        const id = currentStationId.current;
        const stData = STATIONS_DATA.find((s) => s.id === id);
        const storeState = stationsStore.stations.find((s) => s.id === id);

        const isBuilt = stData?.decorToUnlock
          ? (storeState?.isBuilt ?? false)
          : true;
        const full = passengerStore.countInside >= trainStore.maxCapacity;

        let hasPeople = false;
        const point = getPointAtDistance(samples, stData?.distance || 0);
        if (point) {
          const radiusSq = PASSENGER_RADIUS * PASSENGER_RADIUS;
          hasPeople = system.physics.some(
            (p: any) =>
              p.target === null &&
              !p.isBoarding &&
              p.position.distanceToSquared(point.position) < radiusSq,
          );
        }

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
          trainStore.setCanMoveTrain(true);
          stationsStore.setNextStop(null);
          trainState.current = "LEAVING";
        }
        break;
      }

      // =========================
      // 4. LEAVING (Від'їжджаємо, чекаємо виходу з радіусу станції)
      // =========================
      case "LEAVING": {
        const id = currentStationId.current;
        const st = STATIONS_DATA.find((s) => s.id === id);
        
        if (!st) {
          trainState.current = "CRUISING";
          return;
        }

        let diff = st.distance - normDist;
        if (diff < -total / 2) diff += total;
        if (diff > total / 2) diff -= total;
        diff *= direction;
        // Щойно ми від'їхали на достатню відстань (SCAN_DISTANCE)
        // скидаємо все і знову готові шукати нові станції
        if (Math.abs(diff) > SCAN_DISTANCE + 1) {
          trainStore.setAtStation(false);
          stationsStore.setUpgradeMenu(false); 
          decorStore.setActiveBuildId(null);
          currentStationId.current = null;
          trainState.current = "CRUISING";
        }
        break;
      }
    }
  });

  return null;
};

export default Loop;
