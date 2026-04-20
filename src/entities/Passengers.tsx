import passengersModel from "../assets/models/eu_characters.fbx";
import passengersTexture from "../assets/textures/Main_texture.png";
import { useFBX, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { usePassengerStore } from "../store/usePassengersStore";
import { IDLE_SCALE, MOVE_SCALE, MOVE_POS_Y } from "../utils/config";
import * as THREE from "three";
import {type ResourceType} from '../store/resourceStore'
interface PassengerPhysics {
  id: string;
  position: THREE.Vector3;
  target: THREE.Vector3 | null;
  animPhase: number;
  rotation: number;
}

export interface PassengersProps {
  system: {
    
    physics: PassengerPhysics[];
    spawn: (pos: THREE.Vector3, type: number) => void;
    goTo: (id: string, target: THREE.Vector3, resType?: ResourceType) => void;
  };
}


const MAX_PASSENGERS_PER_TYPE = 8;
const tempMatrix = new THREE.Matrix4();
const tempPos = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const upVector = new THREE.Vector3(0, 1, 0);
const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

const Passengers = ({ system }: PassengersProps) => {
  const { physics } = system;
  const passengersMeta = usePassengerStore((s) => s.passengersMeta);
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

  useFrame((_state, dt) => {
    characterTypes.forEach((_type, typeIndex) => {
      const mesh = meshRefs.current[typeIndex];
      if (!mesh) return;

      let instanceIdx = 0;

      // Проходимо по мета-даних пасажирів
      passengersMeta.forEach((meta) => {
        if (meta.modelType !== typeIndex) return;
        
        const phys = physics.find((p) => p.id === meta.id);
        
        if (!phys || !phys.position || isNaN(phys.position.x)) return;

        const isMoving = phys.target !== null;
        const animSpeed = isMoving ? 0.4165 : 0.667;
        
        // Оновлення фази анімації
        phys.animPhase = (phys.animPhase + dt / animSpeed) % 1;
        const t = Math.sin(phys.animPhase * Math.PI * 2) * 0.5 + 0.5;

        // Трансформації
        tempPos.copy(phys.position);
        tempQuat.setFromAxisAngle(upVector, phys.rotation);

        if (isMoving) {
          tempScale.lerpVectors(MOVE_SCALE[0], MOVE_SCALE[1], t);
          tempPos.y += THREE.MathUtils.lerp(MOVE_POS_Y[0], MOVE_POS_Y[1], t);
        } else {
          tempScale.lerpVectors(IDLE_SCALE[0], IDLE_SCALE[1], t);
        }


        tempMatrix.compose(tempPos, tempQuat, tempScale);
        mesh.setMatrixAt(instanceIdx, tempMatrix);
        instanceIdx++;
      });


      for (let i = instanceIdx; i < MAX_PASSENGERS_PER_TYPE; i++) {
        mesh.setMatrixAt(i, hiddenMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    });
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