import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTrainStore } from "../store/useTrainStore";

export const FollowLight = () => {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const locomotiveRef = useTrainStore((s) => s.locomotiveRef);

  const customTarget = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.matrixAutoUpdate = true; // Примусово дозволяємо оновлення
    return obj;
  }, []);

  const offset = useMemo(() => new THREE.Vector3(40, 45, -50), []);
  const trainPos = useMemo(() => new THREE.Vector3(), []);

useFrame(() => {
  if (!locomotiveRef?.current || !lightRef.current) return;

  // Отримуємо позицію саме з матриці світу (найбільш надійно)
  locomotiveRef.current.updateMatrixWorld();
  trainPos.setFromMatrixPosition(locomotiveRef.current.matrixWorld);

  // Оновлюємо світло
  lightRef.current.position.copy(trainPos).add(offset);
  lightRef.current.target.position.copy(trainPos);
  lightRef.current.target.updateMatrixWorld();
});

  return (
    <>
      <primitive object={customTarget} />
      <directionalLight
        ref={lightRef}
        castShadow
        intensity={4}
        color="#ffdca8"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-60, 60, 60, -60, 0.1, 550]}
        />
      </directionalLight>
    </>
  );
};