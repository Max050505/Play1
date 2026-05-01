import { useFrame } from "@react-three/fiber";
import { EngineManager } from "../engines/EngineManager";

interface LoopProps {
  engineManagerRef: React.MutableRefObject<EngineManager | null>;
}

const Loop = ({ engineManagerRef }: LoopProps) => {
  useFrame((_state, dt) => {
    engineManagerRef.current?.update(dt);
  });

  return null;
};

export default Loop;
