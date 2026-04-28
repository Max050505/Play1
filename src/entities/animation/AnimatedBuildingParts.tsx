import { forwardRef, useRef, useMemo } from "react";
import * as THREE from "three";
import { AnimatedStationPart } from "./AnimatedStationPart";

export const AnimatedBuildingParts = forwardRef(
  ({ parts, assets, partRefs, position, rotation, buildingId, isUnlocked }: { 
    parts: string[];
    assets: any;
    partRefs: React.MutableRefObject<Map<string, Map<string, unknown>>>;
    position?: [number, number, number];
    rotation?: [number, number, number];
    buildingId: string;
    isUnlocked?: boolean;
  }, _ref) => {
    // Don't render animated parts if explicitly locked
    if (isUnlocked === false) return null;
    const groupRef = useRef<THREE.Group>(null);

    const meshes = useMemo(() => {
      return parts
        .map((partName) => {
          const mesh = assets.getMesh(partName);
          return { name: partName, mesh };
        })
        .filter((item) => item.mesh !== null);
    }, [parts, assets]);

    if (meshes.length === 0) {
      console.warn("No parts found for building:", buildingId);
      return null;
    }

    const handleRef = (el: unknown, partName: string) => {
      if (el && partRefs) {
        if (!partRefs.current.has(buildingId)) {
          partRefs.current.set(buildingId, new Map());
        }
        partRefs.current.get(buildingId)!.set(partName, el);
      }
    };

    return (
      <group ref={groupRef} position={position || [0, 0, 0]} rotation={rotation || [0, 0, 0]}>
        {meshes.map(({ name, mesh }) => (
          <AnimatedStationPart
            key={name}
            model={mesh}
            ref={(el: unknown) => handleRef(el, name)}
          />
        ))}
      </group>
    );
  },
);

AnimatedBuildingParts.displayName = "AnimatedBuildingParts";