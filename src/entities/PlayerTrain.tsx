import { useEffect, useCallback, forwardRef } from "react";
import * as THREE from "three";
import { useTrainStore } from "../store/useTrainStore";
import TrainView from "./TrainView";
import { TRAIN_CONFIG } from "../utils/config";
import { getPointAtDistance } from "../utils/splineUtils";
import type { TrainViewHandle } from "./TrainView";

type PlayerTrainProps = {
  distanceRef: React.RefObject<number>;
  currentSpeed: React.RefObject<number>;
  models: {
    locomotive: THREE.Group;
    wagon: THREE.Group;
    tail: THREE.Group;
  };
  onRegistryPosGetter: (fn: (idx: number) => THREE.Vector3 | null) => void;
};

const PlayerTrain = forwardRef<TrainViewHandle, PlayerTrainProps>(
  ({ models, onRegistryPosGetter, distanceRef, currentSpeed }, ref) => {
    const samplesArray = useTrainStore((s) => s.samples);
    const activeSplineIndex = useTrainStore((s) => s.activeSplineIndex);
    const wagonCount = useTrainStore((s) => s.wagons.length);

    const getWagonPos = useCallback(
      (idx: number, baseDistance?: number, splineIdx?: number) => {
        const trainState = useTrainStore.getState();
        const tailIndex = trainState.wagons.length + 1;
        const part =
          idx === tailIndex
            ? trainState.tail
            : idx > 0
              ? trainState.wagons[idx - 1]
              : undefined;
        const targetSpline = splineIdx ?? part?.splineId ?? activeSplineIndex;
        const samples = samplesArray[targetSpline] || [];
        if (!samples || samples.length === 0) return null;
        const totalLength = samples[samples.length - 1].distance;
        const currentDist = baseDistance ?? part?.distance ?? distanceRef.current;
        const offset = part && baseDistance === undefined ? 0 : idx * TRAIN_CONFIG.WAGON_OFFSET;
        const targetDist = (currentDist - offset + totalLength) % totalLength;
        const result = getPointAtDistance(samples, targetDist);
        return result?.position ? result.position.clone() : null;
      },
      [samplesArray, distanceRef, activeSplineIndex],
    );

    useEffect(() => {
      onRegistryPosGetter(getWagonPos);
    }, [onRegistryPosGetter, getWagonPos]);

    return (
      <TrainView
        distanceRef={distanceRef}
        models={models}
        wagonCount={wagonCount}
        ref={ref}
        currentSpeed={currentSpeed}
      />
    );
  },
);

PlayerTrain.displayName = "PlayerTrain";

export default PlayerTrain;
