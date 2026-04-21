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

  useEffect(() => {
    isInitialized.current = false;
  }, [activeSplineIndex, samples.length]);

  const updateCamera = (state: UpdateCameraState, delta: number) => {
    if (!samples?.length || distanceRef.current === null || distanceRef.current === undefined) return;

    const targetPoint = getPointAtDistance(samples, distanceRef.current);
    if (!targetPoint || !targetPoint.position) return;

    const tx = targetPoint.position.x + offset[0];
    const ty = targetPoint.position.y + offset[1];
    const tz = targetPoint.position.z + offset[2];

    if (Number.isNaN(tx) || Number.isNaN(ty) || Number.isNaN(tz)) return;

    _camPos.set(tx, ty, tz);

    if (!isInitialized.current) {
      state.camera.position.copy(_camPos);
      isInitialized.current = true;
      return;
    }

    const t = 1 - Math.exp(-smoothSpeed * Math.min(delta, 0.1));
    state.camera.position.lerp(_camPos, t);

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
