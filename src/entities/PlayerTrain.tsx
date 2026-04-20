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
  onRegistryPosGetter: (fn: (idx: number) => THREE.Vector3) => void;
};

const PlayerTrain = forwardRef<TrainViewHandle, PlayerTrainProps>(
  ({ models, onRegistryPosGetter, distanceRef, currentSpeed }, ref) => {
    const samples = useTrainStore((s) => s.samples);
    const wagonCount = useTrainStore((s) => s.wagons.length);

    const getWagonPos = useCallback(
      (idx: number) => {
        if (!samples || samples.length === 0) return new THREE.Vector3(0, 0, 0);
        const totalLength = samples[samples.length - 1].distance;
        const currentDist = distanceRef.current;
        const offset = idx * TRAIN_CONFIG.WAGON_OFFSET;
        const targetDist = (currentDist - offset + totalLength) % totalLength;
        const result = getPointAtDistance(samples, targetDist);
        return result && result.position
          ? result.position.clone()
          : new THREE.Vector3(0, 0, 0);
      },
      [samples, distanceRef],
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
