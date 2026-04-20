import React, { useEffect, useRef } from "react";
import { useTrainStore } from "../store/useTrainStore";
import { TRAIN_CONFIG } from "../utils/config";
import type { SplineSample } from "../types";

interface UseTrainPhysicsOptions {
  maxSpeed?: number;
  acceleration?: number;
  deceleration?: number;
  looped?: boolean;
  wagonOffset?: number;
}

export function useTrainPhysics(
  samples: SplineSample[],
  wagonCount: number,
  options: UseTrainPhysicsOptions = {},
  externalDistanceRef?: React.RefObject<number>,
  externalSpeedRef?: React.RefObject<number>,
) {
  const {
    maxSpeed = TRAIN_CONFIG.PHYSICS.MAX_SPEED,
    acceleration = TRAIN_CONFIG.PHYSICS.ACCELERATION,
    deceleration = TRAIN_CONFIG.PHYSICS.DECELERATION,
    looped = true,
    wagonOffset = TRAIN_CONFIG.WAGON_OFFSET,
  } = options;

  const distanceRef = externalDistanceRef || useRef(0);
  const currentSpeedRef = externalSpeedRef || useRef(0);
  const isMovingRef = useRef(false);
  const targetStopDistance = useRef<number | null>(null);
  const pressTimeoutRef = useRef<number | null>(null);

  const canMoveTrain = useTrainStore((s) => s.canMoveTrain);
  const setIsUserPressing = useTrainStore((s) => s.setIsUserPressing);
  const updateMotion = useTrainStore((s) => s.updateMotion);

  useEffect(() => {
    const handleDown = () => {
      if (!canMoveTrain) return;
      isMovingRef.current = true;
      pressTimeoutRef.current = window.setTimeout(() => {
        setIsUserPressing(true);
      }, 100);
    };

    const handleUp = () => {
      isMovingRef.current = false;
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
        pressTimeoutRef.current = null;
      }
      setIsUserPressing(false);
    };

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
      }
    };
  }, [canMoveTrain, setIsUserPressing]);

  useEffect(() => {
    const totalLength = samples.length > 0 ? samples[samples.length - 1].distance : 0;
    if (totalLength > 0 && distanceRef.current === 0) {
      distanceRef.current = (wagonCount + 1) * wagonOffset;
    }
  }, [samples, wagonCount, wagonOffset]);

  const stopAt = (dist: number) => {
    targetStopDistance.current = dist;
  };

  const resume = () => {
    targetStopDistance.current = null;
  };

  const updateTrain = (dt: number) => {
    if (samples.length < 2) return;

    const totalLength = samples[samples.length - 1].distance;
    if (!totalLength) return;

    if (distanceRef.current === undefined) distanceRef.current = 0;
    if (currentSpeedRef.current === undefined) currentSpeedRef.current = 0;

    let targetSpeed = isMovingRef.current ? maxSpeed : 0;

    if (targetStopDistance.current !== null) {
      let distToStop = targetStopDistance.current - distanceRef.current;
      if (looped) {
        if (distToStop < -totalLength / 2) distToStop += totalLength;
        if (distToStop > totalLength / 2) distToStop -= totalLength;
      }

      if (Math.abs(distToStop) < 0.5) {
        distanceRef.current = targetStopDistance.current;
        currentSpeedRef.current = 0;
        targetSpeed = 0;
        isMovingRef.current = false;
        targetStopDistance.current = null;
      } else {
        targetSpeed = isMovingRef.current ? maxSpeed : 0;
      }
    }

    const rate =
      currentSpeedRef.current < targetSpeed ? acceleration : deceleration;
    currentSpeedRef.current +=
      (targetSpeed - currentSpeedRef.current) * Math.min(1, rate * dt);

    if (currentSpeedRef.current !== 0) {
      const totalLength = samples[samples.length - 1].distance;
      const nextDistance = distanceRef.current + currentSpeedRef.current * dt;
      distanceRef.current = looped
        ? ((nextDistance % totalLength) + totalLength) % totalLength
        : Math.max(0, Math.min(nextDistance, totalLength));
    }

    updateMotion(distanceRef.current, currentSpeedRef.current, isMovingRef.current);
  };

  return {
    distanceRef,
    currentSpeedRef,
    isMovingRef,
    stopAt,
    resume,
    updateTrain,
  };
}
