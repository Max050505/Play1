import { useFrame } from "@react-three/fiber";
import { useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

export interface AnimatedStationPartHandle {
  triggerPulsePyramid: () => void;
}

export const AnimatedStationPart = forwardRef(
  ({ model }: { model: THREE.Object3D }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const pulseTime = useRef(0);
    const isPulsing = useRef(false);
    const buildProgress = useRef(0);
    const hasBuilt = useRef(false);

    useImperativeHandle(ref, () => ({
      triggerPulsePyramid: () => {
        pulseTime.current = 0;
        isPulsing.current = true;
      },
    }));

    useFrame((_state, delta) => {
      if (!groupRef.current) return;

      // Build animation (plays once on mount)
      if (!hasBuilt.current) {
        buildProgress.current += delta * 2;
        const t = THREE.MathUtils.clamp(buildProgress.current, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        groupRef.current.scale.setScalar(eased);

        if (t >= 1) {
          hasBuilt.current = true;
          groupRef.current.scale.setScalar(1);
        }
        return; // Skip pulse logic during build
      }

      if (isPulsing.current) {
        pulseTime.current += delta * 2;

        const t = pulseTime.current;
        const scale = 1 + Math.sin(t * Math.PI) * 0.01;

        groupRef.current.scale.setScalar(scale);
        groupRef.current.position.y = (1 - scale) * 0.5;

        if (t >= 1) {
          isPulsing.current = false;
          groupRef.current.scale.setScalar(1);
        }
      }
    });

    return (
      <group ref={groupRef}>
        <primitive object={model} />
      </group>
    );
  },
);

AnimatedStationPart.displayName = "AnimatedStationPart";