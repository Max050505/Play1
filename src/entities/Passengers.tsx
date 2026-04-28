import passengersModel from "../assets/models/eu_characters.fbx";
import passengersTexture from "../assets/textures/Main_texture.png";
import { useFBX, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { IDLE_SCALE, MOVE_SCALE, MOVE_POS_Y } from "../utils/config";
import * as THREE from "three";
import { passengerEngine } from "../utils/passangerEngine";

const MAX_PASSENGERS_PER_TYPE = 20;

const tempMatrix = new THREE.Matrix4();
const tempPos = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();

const forwardVec = new THREE.Vector3(0, 0, 1);
const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

const Passengers = () => {
  const fbx = useFBX(passengersModel);
  const texture = useTexture(passengersTexture);

  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);

  const characterTypes = useMemo(() => {
    const types: {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
    }[] = [];

    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        types.push({
          geometry: mesh.geometry,
          material: new THREE.MeshStandardMaterial({ map: texture }),
        });
      }
    });

    return types;
  }, [fbx, texture]);
  console.log("TYPES COUNT", characterTypes.length);
  useFrame((_state, dt) => {
    const physics = passengerEngine.getAll();

    for (let typeIndex = 0; typeIndex < characterTypes.length; typeIndex++) {
      const mesh = meshRefs.current[typeIndex];
      if (!mesh) continue;

      let instanceIdx = 0;
      const passengersOfType = physics.filter((p) => p.modelType === typeIndex);
      passengersOfType.forEach((phys, i) => {
        if (i >= MAX_PASSENGERS_PER_TYPE) return;
        if (!phys || isNaN(phys.position.x)) return;
        if (phys.modelType !== typeIndex) return;
        if (phys.state === "inside" || phys.state === "done") return;
        if (instanceIdx >= MAX_PASSENGERS_PER_TYPE) return;

        const isMoving = phys.target !== null;

        const animSpeed = isMoving ? 0.4165 : 0.567;

        phys.animPhase = (phys.animPhase + dt / animSpeed) % 1;
        const t = Math.sin(phys.animPhase * Math.PI * 2) * 0.5 + 0.5;

        // =========================
        // POSITION
        // =========================
        tempPos.copy(phys.position);

        if (isMoving) {
          tempPos.y += THREE.MathUtils.lerp(MOVE_POS_Y[0], MOVE_POS_Y[1], t);
        }

        // =========================
        // ROTATION (FIX)
        // =========================
        let dir = forwardVec.clone();

        if (phys.target) {
          // 🚶 рух → дивиться вперед
          dir = new THREE.Vector3()
            .subVectors(phys.position, phys.lastPos)
            .setY(0);

          if (dir.lengthSq() > 0.00001) {
            dir.normalize();
          } else {
            dir.copy(forwardVec);
          }
        } else {
          // 🧍 стоїть → випадковий поворот
          dir.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            phys.rotationOffset || 0,
          );
        }
        tempQuat.setFromUnitVectors(forwardVec, dir);

        // 🔥 додаємо "живий" поворот
        if (phys.rotationOffset) {
          const offsetQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            phys.rotationOffset,
          );

          tempQuat.multiply(offsetQuat);
        }
        // =========================
        // SCALE
        // =========================
        if (isMoving) {
          tempScale.lerpVectors(MOVE_SCALE[0], MOVE_SCALE[1], t);
        } else {
          tempScale.lerpVectors(IDLE_SCALE[0], IDLE_SCALE[1], t);
        }

        // =========================
        // APPLY MATRIX
        // =========================
        tempMatrix.compose(tempPos, tempQuat, tempScale);
        mesh.setMatrixAt(instanceIdx, tempMatrix);

        instanceIdx++;
      });

      // hide unused slots
      for (let i = instanceIdx; i < MAX_PASSENGERS_PER_TYPE; i++) {
        mesh.setMatrixAt(i, hiddenMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {characterTypes.map((type, i) => (
        <instancedMesh
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          args={[type.geometry, type.material, MAX_PASSENGERS_PER_TYPE]}
          frustumCulled={false}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
};

export default Passengers;
