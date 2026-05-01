import { forwardRef, useMemo } from "react";
import { useDecoreStore } from "../store/useDecorStore";
import { AnimatedBuildingParts } from "./animation/AnimatedBuildingParts";
export const DecorItem = forwardRef(
  ({ item, assets, unlockedDecor, partRefs }: any, _ref: any) => {
    const sourceModel = assets.nodes
      ? assets.getMesh(item.asset, item.detach ? [item.detach] : [])
      : assets[item.asset];

    if (!sourceModel) return null;

    const railwayBuilt = useDecoreStore((s: any) => s.railwayBuilt);
    const isRailwayItem = item.id === "Loop_B" || item.id === "Bridge_AB";
    // Railway items: only visible when railway is built
    // Other items: visible if isDefault or in unlockedDecor
    const isUnlocked = isRailwayItem 
      ? railwayBuilt 
      : item.isDefault || unlockedDecor.includes(item.id);

      if (item.isAnimated) {
      const isUnlocked = item.isDefault || unlockedDecor.includes(item.id);
      return (
        <AnimatedBuildingParts
          parts={item.detach || item.parts || item.animatedParts || [item.asset]}
          assets={assets}
          partRefs={partRefs}
          position={item.animatedPos || item.pos}
          rotation={item.animatedRot || item.rot || [0, Math.PI, 0]}
          buildingId={item.id}
          isUnlocked={isUnlocked}
        />
      );
    }

    const staticModel = useMemo(() => {
      const clone = sourceModel.clone();

      const detachNames = [
        ...(Array.isArray(item.detach)
          ? item.detach
          : item.detach
            ? [item.detach]
            : []),
      ];

      if (item.isAnimated && item.detach) {
        detachNames.push(...item.detach);
      } else if (item.animatedParts) {
        detachNames.push(...item.animatedParts);
      }

      if (detachNames.length > 0) {
        const set = new Set(detachNames);
        const toRemove: any[] = [];

        clone.traverse((child: any) => {
          if (set.has(child.name) || set.has(child.parent?.name)) {
            toRemove.push(child);
          }
        });

        toRemove.forEach((obj) => {
          obj.parent?.remove(obj);
        });
      }

      if (item.noShadow) {
        clone.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });
      }

      return clone;
    }, [sourceModel, item.detach, item.animatedParts, item.noShadow]);


    if (!isUnlocked) {

      if (isRailwayItem) return null;


      return (
        <group position={item.pos} rotation={item.rot || [0, Math.PI, 0]}>
          <primitive object={staticModel} />
        </group>
      );
    }

    if (isUnlocked) {
      return (
        <group position={item.pos} rotation={item.rot || [0, Math.PI, 0]}>
          <primitive object={staticModel} />
        </group>
      );
    }
  },
);

DecorItem.displayName = "DecorItem";
