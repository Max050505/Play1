import * as THREE from "three";
import { BaseEngine, type EngineUpdateContext } from "./BaseEngine";
import { getPointAtDistance } from "../utils/splineUtils";
import type { SplineSample } from "../types";

export class CameraEngine extends BaseEngine {
  readonly name = "CameraEngine";
  priority = 90;

  private isInitialized = false;
  private lastSplineIndex = -1;
  private isTransitioning = false;

  private transStartPos = new THREE.Vector3();
  private transEndPos = new THREE.Vector3();
  private transProgress = 0;

  private readonly TRANSITION_DURATION = 0.5;

  // ✅ SAME AS HOOK DEFAULT
  private readonly offset = new THREE.Vector3(-35, 60, 35);

  update(context: EngineUpdateContext): void {
    const { dt } = context;
    const { distanceRef } = this.context!;

    const trainStore = this.context!.getTrainStore();
    const head = trainStore.head;
    const camera = this.context!["camera"] as THREE.Camera;
    if (!camera) return;
    if (!head) return;

    const samples = trainStore.samples || [];
    const activeSplineIndex = head.splineId || 0;

    const samplesArray = Array.isArray(samples[0])
      ? (samples as SplineSample[][])[activeSplineIndex] || []
      : (samples as SplineSample[]);

    if (!samplesArray?.length) {
      // ✅ Fallback: Use previous spline's samples if new spline not loaded
      const fallbackSamples = trainStore.samples?.[this.lastSplineIndex] || [];
      if (fallbackSamples.length > 0) {
        const fallbackPoint = getPointAtDistance(
          fallbackSamples,
          head.distance,
        );
        if (fallbackPoint?.position) {
          camera.position.copy(
            new THREE.Vector3(
              fallbackPoint.position.x + this.offset.x,
              fallbackPoint.position.y + this.offset.y,
              fallbackPoint.position.z + this.offset.z,
            ),
          );
        }
      }
      return;
    }
    const targetPoint = getPointAtDistance(samplesArray, head.distance);
    if (!targetPoint?.position) {
      return;
    }

    // ✅ EXACT SAME MATH AS HOOK
    const tx = targetPoint.position.x + this.offset.x;
    const ty = targetPoint.position.y + this.offset.y;
    const tz = targetPoint.position.z + this.offset.z;

    if (Number.isNaN(tx) || Number.isNaN(ty) || Number.isNaN(tz)) return;

    const newTargetCamPos = new THREE.Vector3(tx, ty, tz);

    if (!this.isInitialized) {
      this.smoothLookTarget.copy(targetPoint.position);
      camera.position.copy(newTargetCamPos);
      this.isInitialized = true;
      this.lastSplineIndex = activeSplineIndex;
      return;
    }
    // 🔥 FIX: spline switch detection must be stable
    if (activeSplineIndex !== this.lastSplineIndex && samplesArray.length > 0) {
      if (Number.isNaN(tx) || Number.isNaN(ty) || Number.isNaN(tz)) {
        return; // Don't start transition with invalid target
      }
      this.lastSplineIndex = activeSplineIndex;

      this.transStartPos.copy(camera.position);
      this.transEndPos.copy(newTargetCamPos);

      this.transProgress = 0;
      this.isTransitioning = true;
    }

    const smoothSpeed = 6;
    const lerpFactor = 1 - Math.exp(-smoothSpeed * Math.min(dt, 0.1));
    camera.position.lerp(newTargetCamPos, lerpFactor);
    const lookAhead = getPointAtDistance(samplesArray, head.distance );

    if (lookAhead?.position) {
      const lookLerp = 1 - Math.exp(-10 * Math.min(dt, 0.1));

      this.smoothLookTarget.lerp(lookAhead.position, lookLerp);

      camera.lookAt(this.smoothLookTarget);
    }
    camera.up.set(0, 1, 0);
    camera.updateMatrixWorld();

    // =========================
    // TRANSITION MODE
    // =========================
    // if (this.isTransitioning) {
    //   this.transProgress += dt / this.TRANSITION_DURATION;

    //   if (this.transProgress >= 1) {
    //     this.transProgress = 1;
    //     this.isTransitioning = false;
    //   }

    //   const t =
    //     1 - Math.pow(1 - Math.min(this.transProgress, 1), 3);

    //   camera.position.lerpVectors(
    //     this.transStartPos,
    //     this.transEndPos,
    //     t,
    //   );
    // }
    // =========================
    // NORMAL FOLLOW MODE
    // =========================
    //   else {
    //     const lerpFactor =
    //       1 - Math.exp(-smoothSpeed * Math.min(dt, 0.1));

    //     camera.position.lerp(newTargetCamPos, lerpFactor);
    //   }

    //   // =========================
    //   // LOOK AT - SAME AS OLD HOOK
    //   // =========================
    //   camera.lookAt(targetPoint.position);
    //   camera.up.set(0, 1, 0);
    //   camera.updateMatrixWorld();
    // }
  }
  private smoothLookTarget = new THREE.Vector3();
  dispose(): void {
    this.isInitialized = false;
    this.isTransitioning = false;
    this.transProgress = 0;
  }
}
