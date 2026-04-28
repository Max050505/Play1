import { useFrame } from "@react-three/fiber";
import { useState, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { BuildingParticles } from "./BuildingParticles";

export interface AnimatedModelHandle {
  triggerPulsePyramid: () => void;
}

export const AnimatedModel = forwardRef(({ model, item, isUnlocked }: any, ref) => {
  const [showParticles, setShowParticles] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const isConstructed = useRef(false);
  const pulseScale = useRef(1);

  useImperativeHandle(ref, () => ({
    triggerPulsePyramid: () => {
      console.log("!!! ПУЛЬСАЦІЯ ПРИЙНЯТА МОДЕЛЛЮ !!!");
      pulseScale.current = 1.4; 
    }
  }));
  const clonedModel = useMemo(() => model.clone(), [model]);
clonedModel.position.set(0, 0, 0);
useFrame((_state, _delta) => {
    if (!groupRef.current) return;

    // 1. Повертаємо імпульс до 1
    pulseScale.current = THREE.MathUtils.lerp(pulseScale.current, 1, 0.1);

    // 2. Базовий масштаб (з'явився/схований)
    const baseScale = isUnlocked ? 1 : 0;

    // 3. Комбінована ціль
    const targetScale = baseScale * pulseScale.current;

    // 4. Плавний перехід до цілі
    // Використовуємо lerp до числа, а потім застосовуємо до вектора
    const currentScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    
    groupRef.current.scale.setScalar(nextScale);

    // Логіка часток при першому розблокуванні
    if (isUnlocked && !isConstructed.current) {
      isConstructed.current = true;
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1500);
    }
  });

  return (
    <group position={item.pos} rotation={item.rot || [0, 0, 0]}>
      {/* Частки */}
      <BuildingParticles position={[0, 0.5, 0]} active={showParticles} />
      
      {/* Сама модель */}
      <group ref={groupRef} >
        <primitive object={clonedModel} />
      </group>
    </group>
  );
});