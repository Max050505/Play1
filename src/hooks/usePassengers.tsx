import { useRef, useCallback } from "react";
import { useFrame} from "@react-three/fiber";
import * as THREE from "three";
import { usePassengerStore } from "../store/usePassengersStore";
import { type ResourceType } from "../store/resourceStore";
import { PASSENGER_CONFIG } from "../utils/config";

const _dir = new THREE.Vector3();

export interface PassengerPhysics {
  id: string;
  position: THREE.Vector3;
  target: THREE.Vector3 | null;
  nextTarget?: THREE.Vector3 | null;
  phase?: number;
  animPhase: number;
  rotation: number;
  stationType?: ResourceType;
  onReach?: () => void;
}

export const usePassenger = () => {
  const physicsRef = useRef<PassengerPhysics[]>([]);
  const { addPassenger, setPassengerState, boardPassenger } =
    usePassengerStore();

  const spawn = useCallback(
    (basePos: THREE.Vector3, modelType: number) => {
      const id = Math.random().toString(36).substring(7);

      const spawnPos = basePos
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2,
          ),
        );

      physicsRef.current.push({
        id,
        position: spawnPos,
        target: null,
        animPhase: Math.random(),
        rotation: Math.random() * Math.PI * 2,
      });

      addPassenger(id, modelType);
    },
    [addPassenger],
  );

  const goTo = useCallback(
    (id: string, target: THREE.Vector3, stationType: ResourceType = "coin") => {
      const p = physicsRef.current.find((p) => p.id === id);
      if (p && target) {
        p.target = target.clone();
        p.stationType = stationType;
        setPassengerState(id, "moving");
      }
    },
    [setPassengerState],
  );

  const exit = useCallback(
    (doorPos: THREE.Vector3, modelType: number) => {
      const id = `exit-${Math.random().toString(36).substring(7)}`;

      const forwardAngle = Math.PI;

      // 1️⃣ Перша точка — прямо від дверей
      const firstDistance = 12 + Math.random() * 2;

      const firstTarget = doorPos
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(forwardAngle) * firstDistance,
            0,
            Math.sin(forwardAngle) * firstDistance,
          ),
        );

      // 2️⃣ Друга точка — вбік (новий напрямок)
      const sideAngle =
        forwardAngle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);

      const secondDistance = 12 + Math.random() * 4;

      const secondTarget = firstTarget
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(sideAngle) * secondDistance,
            0,
            Math.sin(sideAngle) * secondDistance,
          ),
        );

      physicsRef.current.push({
        id,
        position: doorPos.clone(),
        target: firstTarget,
        nextTarget: secondTarget, // 👈 нове
        phase: 0, // 👈 нове
        animPhase: Math.random(),
        rotation: Math.atan2(
          firstTarget.x - doorPos.x,
          firstTarget.z - doorPos.z,
        ),
      });

      addPassenger(id, modelType);
      setPassengerState(id, "moving");
    },
    [addPassenger, setPassengerState],
  );

const goToPyramid = useCallback(
    (id: string, startPos: THREE.Vector3, gatheringPos: THREE.Vector3, targetPos: THREE.Vector3, onEnter: () => void) => {
      physicsRef.current.push({
        id, // ID має починатися з "to-pyramid-", щоб useFrame спрацював правильно
        position: startPos.clone(),
        target: gatheringPos.clone(), // Спочатку йдемо до точки збору
        nextTarget: targetPos.clone(), // Потім — до входу в піраміду
        phase: 0,
        onReach: onEnter,
        animPhase: Math.random(),
        rotation: 0,
      });

      addPassenger(id, Math.floor(Math.random() * 4));
      setPassengerState(id, "moving");
    },
    [addPassenger, setPassengerState]
  );

 useFrame((_, dt) => {
    for (let i = physicsRef.current.length - 1; i >= 0; i--) {
      const p = physicsRef.current[i];

      if (p.target && typeof p.target === 'object' && 'x' in p.target && 'y' in p.target && 'z' in p.target) {
        const dist = p.position.distanceTo(p.target);

        // Перевірка на "мертві" цілі


        if (dist < 0.6) {
          // 1️⃣ ЛОГІКА ПЕРЕХОДУ (Для точки збору)
          if (p.nextTarget && p.phase === 0) {
            p.target = p.nextTarget;
            p.phase = 1;
            p.nextTarget = null; // Очищуємо наступну ціль

            // Оновлюємо поворот у бік нової цілі
            _dir.subVectors(p.target, p.position).normalize();
            p.rotation = Math.atan2(_dir.x, _dir.z);
            continue; 
          }

          // 2️⃣ ЛОГІКА ПІРАМІДИ (Фінальна точка)
          const isPyramidGoal = p.id.startsWith("to-pyramid-");

          if (isPyramidGoal) {
            if (p.onReach) p.onReach(); // Виклик пульсації

            // Видалення через стор та фізику
            // (Використовуємо replace, якщо ID містить префікс для візуалізації)
            usePassengerStore.getState().removePassenger(p.id);
            physicsRef.current.splice(i, 1);
            continue;
          }

          // 3️⃣ ЛОГІКА ВИСАДКИ / ПОСАДКИ (Інші типи пасажирів)
          const isExiting = p.id.startsWith("exit-");
          
          if (!isExiting) {
            if (p.onReach) p.onReach();
            boardPassenger(p.id);
          } else {
            usePassengerStore.getState().removePassenger(p.id);
          }

          physicsRef.current.splice(i, 1);
          continue;
        }

        // --- РУХ ТА ПОВОРОТ ---
        _dir.subVectors(p.target, p.position).normalize();
        const step = PASSENGER_CONFIG.moveSpeed * dt;
        p.position.addScaledVector(_dir, step);

        const targetRot = Math.atan2(_dir.x, _dir.z);
        p.rotation = THREE.MathUtils.lerp(p.rotation, targetRot, 0.15);
        p.animPhase = (p.animPhase + dt * 4) % 1;
      } else {
        p.animPhase = (p.animPhase + dt * 0.5) % 1;
        p.target = null; 
        continue;
      }
    }
  });

  return { physics: physicsRef.current, spawn, goTo, exit, goToPyramid };
};
