import { resourcesStore } from "../store/resourceStore";
import { ResourceAnimation } from "./animation/ResourceAnimation";

export const FxOverlay = () => {
  const activeFxs = resourcesStore((s) => s.activeFxs);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-9999">
      {activeFxs.map((fx) => (
        <ResourceAnimation
          key={fx.id}
          id={fx.id}
          x={fx.x}
          y={fx.y}
          type={fx.type}
        />
      ))}
    </div>
  );
};
