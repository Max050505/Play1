import * as THREE from "three";
import { useRegisterStation } from "../hooks/useRegistrationStation";

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

  return (
    <group position={data.pos}>
      <primitive object={model}  rotation={data.rot || [0, 0, 0]}/>
    </group>
  );
};

export default StationInstance;
