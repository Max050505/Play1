import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useTrainStore } from "../../store/useTrainStore";
import lightSheet from "../../assets/textures/lightUp02.png";

const PARTICLES_PER_WAGON = 30; // Кількість вогників на один вагон

export const TrainWaveEffect = ({ 
  wagonPositions, 
  count 
}: { 
  wagonPositions: (THREE.Group | null)[], 
  count: number 
}) => {
  const totalCount = count * PARTICLES_PER_WAGON;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const texture = useTexture(lightSheet);
  const startTimeRef = useRef<number>(0);
  const [isActive, setIsActive] = useState(false);
  const waveTrigger = useTrainStore((s) => s.waveTrigger);

  // Створюємо випадкові параметри для кожної частинки (зміщення, швидкість, мікро-затримка)
  const pData = useMemo(() => {
    const data = [];
    for (let i = 0; i < totalCount; i++) {
      data.push({
        offsetX: (Math.random() - 0.5) * 8, // розкид вліво-вправо
        offsetZ: (Math.random() - 0.5) * 8, // розкид вперед-назад
        upSpeed: 2 + Math.random() * 2,     // швидкість польоту вгору
        individualDelay: Math.random() * 0.3 // щоб частинки вилітали не всі разом
      });
    }
    return data;
  }, [totalCount]);

  useEffect(() => {
    if (texture) texture.repeat.set(0.25, 0.5);
  }, [texture]);

  useEffect(() => {
    if (waveTrigger > 0) {
      startTimeRef.current = 0; 
      setIsActive(true);
      if (meshRef.current) meshRef.current.visible = true;
    }
  }, [waveTrigger]);

  useFrame((state) => {
    if (!isActive || !meshRef.current || !texture) return;

    if (startTimeRef.current === 0) startTimeRef.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTimeRef.current;

    // Збільшуємо загальний час, щоб хвиля встигла дійти до хвоста
    if (elapsed > 1) {
      setIsActive(false);
      meshRef.current.visible = false;
      return;
    }

    const _temp = new THREE.Object3D();

    for (let w = 0; w < count; w++) {
      const wagon = wagonPositions[w];
      if (!wagon) continue;

      const wagonDelay = w * 0.15; // Хвиля йде по вагонах

      for (let p = 0; p < PARTICLES_PER_WAGON; p++) {
        const i = w * PARTICLES_PER_WAGON + p;
        const particle = pData[i];
        
        const localTime = elapsed - wagonDelay - particle.individualDelay;
        const duration = 1; // Скільки летить одна частинка

        let scale = 0;
        let yPos = 0;

        if (localTime > 0 && localTime < duration) {
          const progress = localTime / duration;
          
          // 1. Плавний масштаб (виростає і зникає)
          scale = Math.sin(progress * Math.PI) * 4; 
          
          // 2. РУХ ВГОРУ (висота збільшується з часом)
          yPos = progress * particle.upSpeed * 5;
        }

        // Позиціонуємо частинку відносно вагона
        _temp.position.set(
          wagon.position.x + particle.offsetX,
          wagon.position.y + yPos - 5 , // починаємо з рівня даху
          wagon.position.z + particle.offsetZ
        );
        
        _temp.quaternion.copy(state.camera.quaternion); // Завжди до камери
        _temp.scale.setScalar(scale);
        _temp.updateMatrix();
        meshRef.current.setMatrixAt(i, _temp.matrix);
      }
    }

    // Оновлюємо кадри атласу (спільно для всіх, створює ефект мерехтіння)
    const frame = Math.floor((elapsed * 15) % 8);
    texture.offset.set((frame % 4) * 0.25, 0.5 - (Math.floor(frame / 4) * 0.5));

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, totalCount]} 
      frustumCulled={false}
      visible={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color={new THREE.Color(0.6, 0.43, 0)} 
      />
    </instancedMesh>
  );
};