import { forwardRef, useRef, useMemo, useImperativeHandle } from "react";
import * as THREE from "three";


export const AnimatedDecorItem = forwardRef(
  ({ item, assets }: any, ref: any) => {
    const groupRef = useRef<THREE.Group>(null);
    const pulseScale = useRef(1);

    useImperativeHandle(ref, () => ({
      triggerPulsePyramid: () => {
        pulseScale.current = 1.4;
      },
    }));

    const sourceModel = assets.nodes
      ? assets.getMesh(
          item.asset,
          item.detach ? [item.detach] : []
        )
      : assets[item.asset];

    if (!sourceModel) return null;

    if (item.detach) {
      const names = Array.isArray(item.detach)
        ? item.detach
        : [item.detach];

      const set = new Set(names);

      const toRemove: any[] = [];

      sourceModel.traverse((child: any) => {
        if (
          set.has(child.name) ||
          set.has(child.parent?.name)
        ) {
          toRemove.push(child);
        }
      });

      toRemove.forEach((obj) => {
        obj.parent?.remove(obj);
      });
    }

    const staticModel = useMemo(() => {
      return sourceModel;
    }, [sourceModel]);

    return (
      <group ref={groupRef} position={item.pos} rotation={item.rot || [0, 0, 0]}>
        <primitive object={staticModel} />
      </group>
    );
  },
);

AnimatedDecorItem.displayName = "AnimatedDecorItem";