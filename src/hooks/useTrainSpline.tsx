import { useEffect, useRef } from "react";
import { useTrainStore } from "../store/useTrainStore";

interface SplineSample {
  position: { x: number; y: number; z: number };
  tangent: { x: number; y: number; z: number };
  distance: number;
}

export function useTrainSpline(
  _samples: SplineSample[],
  _onDistanceUpdate?: (distance: number) => void
) {
  const isMovingRef = useRef(false);
  const canMoveTrain = useTrainStore((s) => s.canMoveTrain);
  const setIsUserPressing = useTrainStore((s) => s.setIsUserPressing);

  useEffect(() => {
    const handleDown = () => {
      if (!canMoveTrain) return;
      isMovingRef.current = true;
      setIsUserPressing(true);
    };

    const handleUp = () => {
      isMovingRef.current = false;
      setIsUserPressing(false);
    };

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [canMoveTrain, setIsUserPressing]);

  return {
    isMovingRef,
  };
}
