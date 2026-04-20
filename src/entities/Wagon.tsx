import { useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface WagonProps {
  model: THREE.Group;
  isTail?: boolean;
  
}

export interface WagonHandle {
  triggerPulse: () => void;
}

const Wagon = forwardRef<WagonHandle, WagonProps>(({ model, isTail }, ref) => {
  const containerRef = useRef<THREE.Group>(null);
  

  const pulseAmount = useRef(1);


  const cloned = useMemo(() => {
    const c = model.clone();

    return c;
  }, [model]);


  useImperativeHandle(ref, () => ({
    triggerPulse: () => {
      pulseAmount.current = 1.3; 
    }
  }));

  useFrame((_, dt) => {
    if (!containerRef.current) return;

    if (pulseAmount.current > 1.0001) {

      pulseAmount.current = THREE.MathUtils.lerp(pulseAmount.current, 1, dt * 10); 
      const s = pulseAmount.current;
      containerRef.current.scale.setScalar(s);
    } else if (pulseAmount.current !== 1) {

      pulseAmount.current = 1;
      containerRef.current.scale.setScalar(1);
    }
  });

  return (
    <group ref={containerRef}>
      <primitive
        object={cloned}
        rotation-y={isTail ? Math.PI : 0}
        
      />
    </group>
  );
});

Wagon.displayName = "Wagon";

export default Wagon;