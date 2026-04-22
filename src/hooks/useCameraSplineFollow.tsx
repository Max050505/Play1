import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getPointAtDistance } from "../utils/splineUtils";
import { useTrainStore } from "../store/useTrainStore";
import type { SplineSample } from "../types";

const _camPos = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3();

interface UpdateCameraState {
  camera: THREE.Camera;
  clock: THREE.Clock;
}

export const useCameraSplineFollow = (
  distanceRef: React.RefObject<number>,
  offset: [number, number, number] = [35, 35, 35],
  smoothSpeed = 6,
) => {
  const samplesStore = useTrainStore((s) => s.samples) as unknown as
    | SplineSample[]
    | SplineSample[][];
  const activeSplineIndex = useTrainStore((s) => s.activeSplineIndex);
  const samples = Array.isArray(samplesStore[0])
    ? (samplesStore as SplineSample[][])[activeSplineIndex] || []
    : (samplesStore as SplineSample[]);
  const isInitialized = useRef(false);
  const lastSplineIndex = useRef(activeSplineIndex);
  const isTransitioning = useRef(false);
  const transStartPos = useRef(new THREE.Vector3());
  const transEndPos = useRef(new THREE.Vector3());
  const transProgress = useRef(0);

  const TRANSITION_DURATION = 0.5;

  useEffect(() => {
    lastSplineIndex.current = activeSplineIndex;
  }, [activeSplineIndex]);

  const updateCamera = (state: UpdateCameraState, delta: number) => {
    if (!samples?.length || distanceRef.current === null || distanceRef.current === undefined) return;

    const targetPoint = getPointAtDistance(samples, distanceRef.current);
    if (!targetPoint || !targetPoint.position) return;

    const tx = targetPoint.position.x + offset[0];
    const ty = targetPoint.position.y + offset[1];
    const tz = targetPoint.position.z + offset[2];

    if (Number.isNaN(tx) || Number.isNaN(ty) || Number.isNaN(tz)) return;

    const newTargetCamPos = new THREE.Vector3(tx, ty, tz);

    if (!isInitialized.current) {
      state.camera.position.copy(newTargetCamPos);
      isInitialized.current = true;
      isTransitioning.current = false;
      return;
    }

    if (activeSplineIndex !== lastSplineIndex.current) {
      lastSplineIndex.current = activeSplineIndex;
      transStartPos.current.copy(state.camera.position);
      transEndPos.current.copy(newTargetCamPos);
      transProgress.current = 0;
      isTransitioning.current = true;
    }

    if (isTransitioning.current) {
      transProgress.current += delta / TRANSITION_DURATION;
      
      if (transProgress.current >= 1) {
        transProgress.current = 1;
        isTransitioning.current = false;
      }

      const t = 1 - Math.pow(1 - Math.min(transProgress.current, 1), 3);
      state.camera.position.lerpVectors(transStartPos.current, transEndPos.current, t);
    } else {
      const lerpFactor = 1 - Math.exp(-smoothSpeed * Math.min(delta, 0.1));
      state.camera.position.lerp(newTargetCamPos, lerpFactor);
    }

    _lookAtTarget.set(
      state.camera.position.x - offset[0],
      state.camera.position.y - offset[1],
      state.camera.position.z - offset[2],
    );

    state.camera.lookAt(_lookAtTarget);
    state.camera.up.set(0, 1, 0);
    state.camera.updateMatrixWorld();
  };

  return { updateCamera };
};