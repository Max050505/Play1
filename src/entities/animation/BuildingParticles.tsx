import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import lightSheet from "../../assets/textures/lightUp02.png"; // Твоя текстура

const PARTICLES_COUNT = 40;

export const BuildingParticles = ({
  position,
  active,
}: {
  position: THREE.Vector3 | [number, number, number];
  active: boolean;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const texture = useTexture(lightSheet);
  const startTimeRef = useRef<number>(0);
  const [show, setShow] = useState(false);
  const isLaunched = useRef(false);
  // Створюємо випадкові дані один раз
  const pData = useMemo(() => {
    return Array.from({ length: PARTICLES_COUNT }).map(() => ({
      offsetX: (Math.random() - 0.5) * 15, // Розкид по ширині піраміди
      offsetZ: (Math.random() - 0.5) * 15,
      upSpeed: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
      size: 1 + Math.random() * 2,
    }));
  }, []);

  useEffect(() => {
    // Спрацьовуємо тільки якщо active став true і ми ще не запускалися
    if (active && !isLaunched.current) {
      startTimeRef.current = 0;
      setShow(true);
      isLaunched.current = true;
    }
  }, [active]);

  useFrame((state) => {
    if (!show || !meshRef.current) return;

    if (startTimeRef.current === 0)
      startTimeRef.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTimeRef.current;

    const duration = 1.5; // Тривалість всього ефекту
    if (elapsed > duration) {
      setShow(false);
      return;
    }

    const _temp = new THREE.Object3D();
    const pos = Array.isArray(position)
      ? new THREE.Vector3(...position)
      : position;

    pData.forEach((p, i) => {
      const localTime = elapsed - p.delay;
      let scale = 0;
      let yPos = 0;

      if (localTime > 0 && localTime < 1) {
        const progress = localTime / 1;
        scale = Math.sin(progress * Math.PI) * p.size;
        yPos = progress * p.upSpeed * 8; // Летить вгору
      }

      _temp.position.set(pos.x + p.offsetX, pos.y + yPos, pos.z + p.offsetZ);

      _temp.quaternion.copy(state.camera.quaternion);
      _temp.scale.setScalar(scale);
      _temp.updateMatrix();
      meshRef.current.setMatrixAt(i, _temp.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLES_COUNT]}
      frustumCulled={false}
      visible={show}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color={new THREE.Color(1, 0.8, 0.2)}
      />
    </instancedMesh>
  );
};
