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
  _wagonCount: number,
  options: UseTrainPhysicsOptions = {},
  externalDistanceRef?: React.RefObject<number>,
  externalSpeedRef?: React.RefObject<number>,
) {
  const {
    maxSpeed = TRAIN_CONFIG.PHYSICS.MAX_SPEED,
    acceleration = TRAIN_CONFIG.PHYSICS.ACCELERATION,
    deceleration = TRAIN_CONFIG.PHYSICS.DECELERATION,
    looped = true,
  } = options;

  const distanceRef = externalDistanceRef || useRef(0);
  const currentSpeedRef = externalSpeedRef || useRef(0);
  const isMovingRef = useRef(false);
  const targetStopDistance = useRef<number | null>(null);
  const pressTimeoutRef = useRef<number | null>(null);
const moveIntent = useTrainStore((s) => s.moveIntent);
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

  // Set initial distance when samples load
  useEffect(() => {
    const totalLength =
      samples.length > 0 ? samples[samples.length - 1].distance : 0;
    if (totalLength <= 0) return;

    const current = distanceRef.current;
    if (typeof current !== "number" || Number.isNaN(current)) {
      distanceRef.current = Math.min(200, totalLength);
      return;
    }

    distanceRef.current = ((current % totalLength) + totalLength) % totalLength;
  }, [samples, distanceRef]);

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

    if (distanceRef.current === undefined) distanceRef.current = 200;
    if (currentSpeedRef.current === undefined) currentSpeedRef.current = 0;

    let direction = 0;

if (moveIntent === "FORWARD") direction = 1;
if (moveIntent === "BACKWARD") direction = -1;

let targetSpeed = isMovingRef.current ? maxSpeed * direction : 0;

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
      } 
    }
    const rate =
      Math.abs(currentSpeedRef.current) < Math.abs(targetSpeed)
        ? acceleration
        : deceleration;
    currentSpeedRef.current +=
      (targetSpeed - currentSpeedRef.current) * Math.min(1, rate * dt);

    if (currentSpeedRef.current !== 0) {
      const totalLength = samples[samples.length - 1].distance;
      // Reverse: use - instead of +
      const nextDistance = distanceRef.current + currentSpeedRef.current * dt;
      distanceRef.current = looped
        ? ((nextDistance % totalLength) + totalLength) % totalLength
        : Math.max(0, Math.min(nextDistance, totalLength));
    }

    updateMotion(
      distanceRef.current,
      currentSpeedRef.current,
      isMovingRef.current,
    );
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
