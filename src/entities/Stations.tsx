import * as THREE from "three";
import { useRegisterStation } from "../hooks/useRegistrationStation";
import {useMemo} from 'react'
interface StationInstanceProps {
  data: {
    id: string;
    name: string;
    pos: [number, number, number];
    rot?: [number, number, number];
  };
  model: THREE.Group;
}
const StationInstance = ({ data, model }: StationInstanceProps) => {
 useRegisterStation(data.id, data.name);

 if (!model) return null;
  const fixedModel = useMemo(() => {
    const clone = model.clone();

    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);

    clone.position.sub(center);

    return clone;
  }, [model]);
  return (
    <group position={data.pos} rotation={data.rot || [0, 0, 0]}>
      <primitive object={fixedModel}  />
    </group>
  );
};

export default StationInstance;
