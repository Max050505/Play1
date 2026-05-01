import { useRef, useEffect, useMemo, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Dust = forwardRef<THREE.Points>((_props, ref) => {
  const particles = 500;
  const positions = useMemo(() => {
    const arr = new Float32Array(particles * 3);
    for (let i = 0; i < particles; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 4; // x: -2 to 2
      arr[i * 3 + 1] = Math.random() * 1 + 1.0;    // y: 1.0 to 2.0 (ABOVE ground)
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4; // z: -2 to 2
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    if (!ref || typeof ref === 'function') return;
    const pos = ref.current?.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < particles; i++) {
      pos.array[i * 3 + 1] += delta * 0.8;
      if (pos.array[i * 3 + 1] > 2) {
        pos.array[i * 3 + 1] = 1.0; // Reset to start y
      }
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        sizeAttenuation
        color="#c2b280"
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
});

export const TrackBuildAnimation = ({ model, item }: any) => {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);

  useEffect(() => {
    progress.current = 0;

    if (ref.current) {
      ref.current.scale.set(1, 0.5, 1); // старт трохи “сплюснута”
      ref.current.position.y -= 0.5; // зсунута вниз
    }
  }, [model]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    if (progress.current < 1) {
      progress.current += delta * 2;

      const t = THREE.MathUtils.clamp(progress.current, 0, 1);

      // easing + легкий bounce
      const eased = 1 - Math.pow(1 - t, 3);
      const bounce = Math.sin(t * Math.PI) * 0.1;

      ref.current.scale.y = 0.5 + eased * 0.5 + bounce;

      // піднімаємо модель на місце
      ref.current.position.y = item.pos[1] - (1 - eased) * 0.5;
    }
  });

  return (
    <group ref={ref} position={item.pos} rotation={item.rot || [0, Math.PI, 0]}>
      <primitive object={model} />
      {progress.current < 0.6 && <Dust />}
    </group>
  );
};
