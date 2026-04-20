import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import * as THREE from "three";
import { useStationsStore } from "../store/useStationStore";
import { STATIONS_DATA, STATIONS_MAP } from "../utils/constants";
import { PASSENGER_CONFIG } from "../utils/config";
import { usePassengerStore } from "../store/usePassengersStore";
import { useTrainStore } from "../store/useTrainStore";
import { resourcesStore } from "../store/resourceStore";
import { useDecoreStore } from "../store/useDecorStore";
import { useThree } from "@react-three/fiber";
const PYRAMID_ENTRANCES: Record<string, THREE.Vector3> = {
  Pyramid_3_2: new THREE.Vector3(-60, 0, 40),
  Pyramid_2_2_1: new THREE.Vector3(-70, 0, 10),
};

const GATHERING_POINT = new THREE.Vector3(-55, 0, 15);

export const PassengersManager = forwardRef(
  (
    {
      system,
      getWagonPos,
      wagonCount,
      onTriggerWagonPulse,
      triggerPyramidPulse,
    }: any,
    ref,
  ) => {
    const { spawn, goTo, physics } = system;
    const stations = useStationsStore((s) => s.stations);
    const subscribeToStop = useStationsStore((s) => s.subscribeToStop);
    const buildTrigger = useDecoreStore((s) => s.buildTrigger);
    const state = useRef("IDLE");
    const activeProcesses = useRef(0);
    const onAllDone = useRef<(() => void) | null>(null);
const { camera, size } = useThree();
    // Спільний колбек завершення анімацій
    const checkDone = useCallback(() => {
      activeProcesses.current -= 1;
      if (activeProcesses.current <= 0) {
        activeProcesses.current = 0;
        state.current = "IDLE";
        if (onAllDone.current) {
          const cb = onAllDone.current;
          onAllDone.current = null;
          cb();
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
        unboardAll(true); // true означає висадку саме для будівництва
      },
    }));

    // =========================
    // BOARDING (ПОСАДКА)
    // =========================
const executeBoarding = (stationId: string) => {
  const headPos = getWagonPos(0);
  if (!headPos) return;

  const trainStore = useTrainStore.getState();
  const passengerStore = usePassengerStore.getState();

  const maxCapacity = trainStore.maxCapacity;
  const remainingSpace = maxCapacity - passengerStore.countInside;

  const stationData = STATIONS_DATA.find((s) => s.id === stationId);
  const resType = stationData?.resourceType || "coin";

  // 🎯 беремо тільки idle пасажирів біля поїзда
  const candidates = physics.filter(
    (p: any) => p.target === null && p.position.distanceTo(headPos) < 15,
  );

  if (candidates.length === 0 || remainingSpace <= 0) {
    trainStore.setCanMoveTrain(true);
    return;
  }

  const toBoard = candidates.slice(0, remainingSpace);
  activeProcesses.current = toBoard.length;

  // 🚆 визначаємо кількість вагонів (враховуємо locomotive + всі вагони)
 const wagonCountSafe = Math.max(2, (wagonCount || 0) + 2);                                                                                   
                                                      

  toBoard.forEach((p: any, i: number) => {
    const targetWagonIdx = i % wagonCountSafe;

    const phys = physics.find((pp: any) => pp.id === p.id);
    if (!phys) return;

    phys.target = "boarding"; // 🔒 блокуємо повторний вибір

    setTimeout(() => {
      const baseTarget = getWagonPos(targetWagonIdx);
      if (!baseTarget) {
        checkDone();
        return;
      }

      const finalTargetPos = baseTarget.clone();

      const nextWagonPos =
        getWagonPos(targetWagonIdx + 1) ||
        getWagonPos(targetWagonIdx - 1);

      // 🚀 ЛОГІКА РОЗСІЮВАННЯ (з твого 2-го прикладу)
      if (nextWagonPos) {
        const forward = new THREE.Vector3()
          .subVectors(nextWagonPos, baseTarget)
          .normalize();

        const side = new THREE.Vector3(0, 1, 0)
          .cross(forward)
          .normalize();

        const longitudinalOffset = (Math.random() - 0.5) * 4.0;
        const lateralOffset = (Math.random() - 0.5) * 1.5;

        finalTargetPos.add(forward.multiplyScalar(longitudinalOffset));
        finalTargetPos.add(side.multiplyScalar(lateralOffset));
      } else {
        finalTargetPos.x += (Math.random() - 0.5) * 3;
        finalTargetPos.z += (Math.random() - 0.5) * 3;
      }

      goTo(p.id, finalTargetPos, p.type);

      phys.onReach = () => {
        if (phys.hasBoarded) return;
        phys.hasBoarded = true;

        const vector = phys.position.clone().project(camera);

        const screenX = (vector.x * 0.5 + 0.5) * size.width;
        const screenY = (vector.y * -0.5 + 0.5) * size.height;

        resourcesStore
          .getState()
          .applyRewardBatch(screenX, screenY, resType, 1);

        onTriggerWagonPulse(targetWagonIdx);

        phys.target = "inside";
        passengerStore.addPassenger(p.id, p.type || 0);

        checkDone();
        phys.onReach = null;
      };
    }, i * 150);
  });
};
    // =========================
    // UNBOARDING (ВИСАДКА)
    // =========================

const unboardAll = (_isBuildMode = false, callback?: () => void) => {
  const passengerStore = usePassengerStore.getState();
  const countInside = passengerStore.countInside;

  if (countInside === 0) {
    if (callback) callback();
    return;
  }

  // ГАРАНТІЯ ЧИСЛА: враховуємо locomotive + всі вагони

const safeWagonCount = Math.max(2, (wagonCount || 0) + 2);  
  state.current = "UNBOARDING";
  activeProcesses.current = countInside;
  onAllDone.current = callback || null;

  for (let i = 0; i < countInside; i++) {
    setTimeout(() => {
      const wagonIdx = i % safeWagonCount;
      const doorPos = getWagonPos(wagonIdx);
      
      if (!doorPos) {
        console.warn(`Не знайдено позицію для вагона ${wagonIdx}, використовуємо голову`);
        // Якщо вагон не знайдено, беремо хоча б позицію голови (0), щоб не (0,0,0)
        const fallbackPos = getWagonPos(0) || new THREE.Vector3(); 
        processExit(fallbackPos, i);
      } else {
        processExit(doorPos.clone(), i);
      }

      passengerStore.exitPassenger(); 
    }, i * 150);
  }
};

// Виніс логіку створення в окрему функцію для чистоти
const processExit = (startPos: THREE.Vector3, index: number) => {
  const availablePyramids = ["Pyramid_3_2", "Pyramid_2_2_1"];
  const pyramidId = availablePyramids[index % availablePyramids.length];
  const entrancePos = PYRAMID_ENTRANCES[pyramidId] || GATHERING_POINT;

  const randomGathering = GATHERING_POINT.clone().add(
    new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3)
  );

  const newId = `to-pyramid-${Date.now()}-${index}`;
  system.goToPyramid(newId, startPos, randomGathering, entrancePos, () => {
    if (triggerPyramidPulse) triggerPyramidPulse(pyramidId);
    checkDone();
  });
};
      useEffect(() => {
        if (!buildTrigger) return;

        console.log("🛠 BUILD DONE → unboard passengers");
        unboardAll(true);
      }, [buildTrigger]);

    // =========================
    // ЛОГІКА ЗУПИНКИ
    // =========================
    useEffect(() => {
      const unsub = subscribeToStop((stationId: string) => {
        const stationData = STATIONS_DATA.find((s) => s.id === stationId);
        if (!stationData) return;

        // 1. Пасажирські станції: всі виходять -> нові заходять
        if (stationData.type === "passenger") {
          unboardAll(false, () => {
            executeBoarding(stationId);
          });
        }
        // 2. Станція будівництва DLine1_v1
        else if (stationId === "DLine1_v1") {
          const stationInfo = stations.find((s) => s.id === "DLine1_v1");
          if (stationInfo?.isBuilt) {
            // Якщо вже збудовано — просто посадка
            executeBoarding(stationId);
          } else {
            // Якщо не збудовано — стоїмо і чекаємо на Build (блокуємо газ)
            useTrainStore.getState().setCanMoveTrain(false);
            console.log("🏗️ Зупинка на будівництві. Чекаємо кнопку Build.");
          }
        }
      });

      return () => unsub();
    }, [stations, physics.length, wagonCount]);

    // =========================
    // SPAWN ПАСАЖИРІВ (Твій старий алгоритм)
    // =========================
    const spawnedStations = useRef<Set<string>>(new Set());

    useEffect(() => {
      stations.forEach((reg) => {
        // 1. Перевірка: чи станція вже була оброблена?
        if (spawnedStations.current.has(reg.id)) return;

        const data = STATIONS_DATA.find((d) => d.id === reg.id);
        // 2. Спавнимо тільки на збудованих пасажирських станціях
        if (!data || data.type !== "passenger" || !reg.isBuilt) return;

        const map = STATIONS_MAP.find((m) => m.id === reg.id);
        if (!map) return;

        const [px, py, pz] = map.pos;
        const rot = new THREE.Euler(...(map.rot || [0, 0, 0]));
        const baseOff = new THREE.Vector3(...(map.spawnOffset || [0, 0, 0]));

        // Визначаємо ширину зони спавну (дефолт 6)
        const areaWidth = map.spawnArea?.width || 6;
        const passengerCount = PASSENGER_CONFIG.countPerStation;
        const step = areaWidth / passengerCount;

        for (let i = 0; i < passengerCount; i++) {
          // 3. РОЗРАХУНОК ЦЕНТРУВАННЯ:
          // Додаємо step / 2, щоб пасажири стояли в центрі своїх секторів, а не на краях
          const gx = -areaWidth / 2 + i * step + step / 2;

          // 4. ГЕНЕРАЦІЯ ЛОКАЛЬНОЇ ПОЗИЦІЇ
          // (Math.random() - 0.5) * 1.5 додає трохи "живого" хаосу, щоб не стояли ідеально в лінію
          const loc = map.isVertical
            ? new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, gx)
            : new THREE.Vector3(gx, 0, (Math.random() - 0.5) * 1.5);

          // 5. ТРАНСФОРМАЦІЯ У СВІТОВІ КООРДИНАТИ
          const final = baseOff
            .clone()
            .add(loc)
            .applyEuler(rot)
            .add(new THREE.Vector3(px, py, pz));

          spawn(final, Math.floor(Math.random() * 4));
        }

        // Позначаємо станцію як "заселену"
        spawnedStations.current.add(reg.id);
      });
    }, [stations, spawn]);

    return null;
  },
);

export default PassengersManager;
