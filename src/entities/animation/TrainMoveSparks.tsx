import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SPARK_COUNT = 50;
const _obj = new THREE.Object3D();

export const TrainMoveParticles= ({ currentSpeed }: { currentSpeed: React.RefObject<number> }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const particles = useMemo(() => {
    return Array.from({ length: SPARK_COUNT }, () => ({
      // Локальний офсет: під колесами локомотива
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 2, // Ширина (X)
        -0.1,                        // Висота (Y) - під потягом
        (Math.random() - 0.5) * 8   // Довжина (Z)
      ),
      speed: Math.random() * 0.04 + 0.02,
      progress: Math.random(),
    }));
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const speed = Math.abs(currentSpeed.current || 0);
    meshRef.current.visible = speed > 0.1;

    if (meshRef.current.visible) {
      particles.forEach((p, i) => {
        p.progress += p.speed * speed * delta * 50;
        if (p.progress > 1) p.progress = 0;

        _obj.position.copy(p.offset);
        // Летить назад по осі Z відносно локомотива
        _obj.position.z += p.progress * 5; 
        _obj.position.y += p.progress * 0.4; // Трохи піднімається вгору

        const s = (1 - p.progress) * 0.5;
        _obj.scale.set(s, s, s);
        
        _obj.updateMatrix();
        meshRef.current.setMatrixAt(i, _obj.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, SPARK_COUNT]}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshBasicMaterial 
        color="#ffaa00" 
        transparent 
        opacity={0.8} 
        blending={THREE.AdditiveBlending}
        depthWrite={false} 
      />
    </instancedMesh>
  );
};