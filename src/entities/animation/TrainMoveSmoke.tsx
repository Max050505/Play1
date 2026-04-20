import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const PARTICLE_COUNT = 60;
const _obj = new THREE.Object3D();

export const TrainWheelDust = ({
  currentSpeed,
}: {
  currentSpeed: any;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const lastMovingRef = useRef(false); // Для відстеження моменту старту

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_v, i) => ({
      t: Math.random(),
      side: i % 2 === 0 ? 1 : -1,
      v: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.5 + 0.3,
        Math.random() * 1.5 + 1,
      ),
      randScale: 1.0 + Math.random() * 0.8,
      active: false, // Чи "вилетіла" часточка
    }));
  }, []);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    const speed = Math.abs(currentSpeed.current || 0);
    const isMoving = speed > 15;

    // МОМЕНТ СТАРТУ: якщо потяг почав рух, "будимо" часточки миттєво
    if (isMoving && !lastMovingRef.current) {
      particles.forEach((p) => {
        if (!p.active) {
          p.t = Math.random(); // Розподіляємо їх по часу, щоб не вилетіли купою
          p.active = true;
        }
      });
    }
    lastMovingRef.current = isMoving;

    let hasVisible = false;

    particles.forEach((p, i) => {
      // Якщо потяг стоїть і часточка не активна — нічого не робимо
      if (!p.active && !isMoving) {
        _obj.scale.setScalar(0);
        _obj.updateMatrix();
        meshRef.current.setMatrixAt(i, _obj.matrix);
        return;
      }

      // Рух продовжується завжди, якщо часточка active (доживання)
      const lifeStep = delta * (1.2 + speed * 0.03);
      p.t += lifeStep;

      if (p.t > 1) {
        if (isMoving) {
          p.t = 0; // Респавн, якщо їдемо
          p.active = true;
        } else {
          p.active = false; // Вимикаємо, якщо зупинились
          p.t = 0;
        }
      }

      if (p.active) {
        hasVisible = true;
        const t = p.t;
        const trackWidth = 0.7;
        const START_Z = 8;
        const TRAIL_LENGTH = 11;

        _obj.position.set(
          p.side * trackWidth + p.v.x * t,
          -0.8 + p.v.y * t * 2,
          START_Z - t * TRAIL_LENGTH,
        );

        // Масштаб залежить тільки від t
        const s = Math.sin(t * Math.PI) * p.randScale * 1.5;
        _obj.scale.set(s, s, s);
        _obj.rotation.set(t * 2, t * 3, 0);
      } else {
        _obj.scale.setScalar(0);
      }

      _obj.updateMatrix();
      meshRef.current.setMatrixAt(i, _obj.matrix);
    });

    meshRef.current.visible = hasVisible;

    // Плавна прозорість для доживання
    const targetOpacity = isMoving ? 0.45 : hasVisible ? 0.3 : 0;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.opacity = THREE.MathUtils.lerp(
      material.opacity,
      targetOpacity,
      delta * 3,
    );

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null as any, null as any, PARTICLE_COUNT]}
    >
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.5}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
};
