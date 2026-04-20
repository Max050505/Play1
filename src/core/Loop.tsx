import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useTrainStore } from "../store/useTrainStore";
import { useStationsStore } from "../store/useStationStore";
import { useDecoreStore } from "../store/useDecorStore";
import { usePassengerStore } from "../store/usePassengersStore";
import { getPointAtDistance } from "../utils/splineUtils";
import { STATION_CONFIG } from "../utils/config";
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
  // Залишаємо в хуках ТІЛЬКИ ті значення, які потрібні для ініціалізації
  // або ті, зміна яких має реально перерендерити компонент (наприклад, додавання вагонів)
  const samples = useTrainStore((s) => s.samples);
  const wagonCount = useTrainStore((s) => s.wagons.length);
  const maxSpeed = useTrainStore((s) => s.maxSpeed);

  const { updateTrain } = useTrainPhysics(
    samples,
    wagonCount,
    { maxSpeed },
    distanceRef,
    currentSpeedRef
  );

  const { updateCamera } = useCameraSplineFollow(distanceRef, [35, 60, -35], 6);

  // Стейт-машина тепер набагато простіша
  const trainState = useRef<TrainState>("CRUISING");
  const currentStationId = useRef<string | null>(null);

  // Оптимізований пошук найближчої станції попереду
  const getNextStationAhead = (normDist: number, total: number) => {
    let bestStation: any = null;
    let minDistance = Infinity;

    for (const st of STATIONS_DATA) {
      if (st.distance === undefined) continue;

      // Рахуємо дистанцію ТІЛЬКИ вперед по кільцю
      let distAhead = st.distance - normDist;
      if (distAhead < 0) distAhead += total;

      if (distAhead < minDistance) {
        minDistance = distAhead;
        bestStation = st;
      }
    }

    return { station: bestStation, distAhead: minDistance };
  };

  useFrame((state, dt) => {
    if (samples.length < 2) return;

    updateTrain(dt);
    updateCamera(state, dt);

    const total = samples[samples.length - 1].distance || 1;
    const rawDist = distanceRef.current;
    const normDist = ((rawDist % total) + total) % total;
    const speed = currentSpeedRef.current;

    // ВАЖЛИВО: Отримуємо свіжий стейт без підписки (щоб не було ре-рендерів)
    const stationsStore = useStationsStore.getState();
    const decorStore = useDecoreStore.getState();
    const trainStore = useTrainStore.getState();
    const passengerStore = usePassengerStore.getState();

    switch (trainState.current) {
      // =========================
      // 1. CRUISING (Звичайний рух, шукаємо станцію)
      // =========================
      case "CRUISING": {
        const { station, distAhead } = getNextStationAhead(normDist, total);

        if (!station || distAhead > SCAN_DISTANCE) return;
        
        // Ми в зоні сканування. Перевіряємо, чи треба зупинятися
        const stationState = stationsStore.stations.find((s) => s.id === station.id);
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
            // ОПТИМІЗАЦІЯ: Використовуємо distanceToSquared (працює швидше за distanceTo)
            const radiusSq = PASSENGER_RADIUS * PASSENGER_RADIUS;
            const hasPeople = system.physics.some((p: any) => 
              p.target === null && !p.isBoarding && p.position.distanceToSquared(point.position) < radiusSq
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

        const isBuilt = stData?.decorToUnlock ? (storeState?.isBuilt ?? false) : true;
        const full = passengerStore.countInside >= trainStore.maxCapacity;

        let hasPeople = false;
        const point = getPointAtDistance(samples, stData?.distance || 0);
        if (point) {
          const radiusSq = PASSENGER_RADIUS * PASSENGER_RADIUS;
          hasPeople = system.physics.some((p: any) => 
            p.target === null && !p.isBoarding && p.position.distanceToSquared(point.position) < radiusSq
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