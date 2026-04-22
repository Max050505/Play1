import { forwardRef, useMemo } from "react"; // 👈 Додай імпорт
import { AnimatedModel } from "./animation/AnimatedModel";

// Обгортаємо у forwardRef
export const DecorItem = forwardRef(({ item, assets, unlockedDecor }: any, ref: any) => {
    const sourceModel = assets.nodes                                                                                                 
         ? assets.getMesh(item.asset)  // GLTF - use getMesh to apply custom material                                                   
         : assets[item.asset];
  if (!sourceModel) return null;


  const isAnimated = item.asset.includes("Pyramid") && !item.isDefault;
  const isUnlocked = item.isDefault || unlockedDecor.includes("pyramids");

  if (isAnimated) {
    return (
      <AnimatedModel
        ref={ref} 
        model={sourceModel}
        item={item}
        isUnlocked={isUnlocked}
      />
    );
  }

  const staticModel = useMemo(() => {
    const clone = sourceModel.clone();

    return clone;
  }, [sourceModel]);

  return (
    <group position={item.pos} rotation={item.rot || [0, Math.PI, 0]}>
      <primitive
        object={staticModel}  
      />
    </group>
  );
});

// Додай назву для дебагу (опціонально)
DecorItem.displayName = "DecorItem";