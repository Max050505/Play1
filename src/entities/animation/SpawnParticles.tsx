import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import starImg from "../../assets/textures/fx_star_yellow.png";

// Поза компонентом для стабільності
const _temp = new THREE.Object3D();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _zeroScaleMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

export const SpawnParticles = ({ 
  position, 
  targetOffset = new THREE.Vector3(0, 6, 0) 
}: { 
  position: THREE.Vector3; 
  targetOffset?: THREE.Vector3 
}) => {
  const count = 70;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const startTimeRef = useRef<number | null>(null);
  const { camera } = useThree();
  
  // Завантажуємо текстуру
  const texture = useTexture(starImg);

  // 1. ПОВНЕ ОБНУЛЕННЯ ПРИ МОНТУВАННІ
  // Спрацьовує до першого малювання. Всі інстанси отримують scale 0.
  useLayoutEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        meshRef.current.setMatrixAt(i, _zeroScaleMatrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.visible = false; // Початково приховано
    }
  }, [count]);

  // 2. ГЕНЕРАЦІЯ ДАНИХ ПАРТИКЛІВ
  const pData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      startOffset: new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 5
      ),
      endJitter: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      ),
      scale: 1.0 + Math.random() * 0.5,
      speed: 0.7 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2, // для індивідуального хитання
    }));
  }, [count]);

  // 3. АНІМАЦІЙНИЙ ЦИКЛ
  useFrame((state) => {
    if (!meshRef.current) return;

    // Фіксація часу старту
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
      return;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;

    // ЗАХИСТ ВІД СПАЛАХУ: 
    // Показуємо меш лише після короткої затримки (3 кадри), 
    // коли математика гарантовано оновила матриці.
    if (elapsed > 0.05 && !meshRef.current.visible) {
      meshRef.current.visible = true;
    }

    // Життєвий цикл (2 сек)
    if (elapsed > 2.0) {
      meshRef.current.visible = false;
      return;
    }

    pData.forEach((p, i) => {
      const t = Math.min(elapsed * p.speed, 1);
      
      // Рух від старту до цілі
      _v1.copy(position).add(p.startOffset);
      _v2.copy(position).add(targetOffset).add(p.endJitter);
      _temp.position.lerpVectors(_v1, _v2, t);
      
      // Додаткова хаотичність руху
      _temp.position.x += Math.sin(elapsed * 10 + p.phase) * 0.1;
      _temp.position.z += Math.cos(elapsed * 8 + p.phase) * 0.1;

      // Життєвий цикл масштабу
      let s = 0;
      if (t < 0.2) {
        s = THREE.MathUtils.lerp(0, p.scale, t / 0.2); // Поява
      } else if (t < 0.8) {
        s = p.scale; // Політ
      } else {
        s = THREE.MathUtils.lerp(p.scale, 0, (t - 0.8) / 0.2); // Зникнення
      }

      _temp.scale.setScalar(s);
      
      // Billboard ефект (обличчям до камери)
      _temp.quaternion.copy(camera.quaternion);
      
      _temp.updateMatrix();
      meshRef.current.setMatrixAt(i, _temp.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, count]} 
      frustumCulled={false}
      visible={false} // Важливо для старту
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture}
        transparent
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={new THREE.Color(5, 3.5, 1)} // HDR яскравість для Bloom
      />
    </instancedMesh>
  );
};