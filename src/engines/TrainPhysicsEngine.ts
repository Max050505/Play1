import { BaseEngine, type EngineUpdateContext } from "./BaseEngine";
import { TRAIN_CONFIG } from "../utils/config";

export class TrainPhysicsEngine extends BaseEngine {
  readonly name = "TrainPhysics";
  priority = 10;

  private targetStopDistance: number | null = null;

  stopAt(distance: number): void {
    this.targetStopDistance = distance;
  }

  resume(): void {
    this.targetStopDistance = null;
  }

  update(context: EngineUpdateContext): void {
    const { dt } = context;
    const { distanceRef, currentSpeedRef } = this.context!;
    const isMoving = this.context!["isMovingRef"]?.current ?? false;
    const trainStore = this.context!.getTrainStore() as any;
    // trainStore.head.distance = distanceRef.current;
    // 1. ПОВНА ІЗОЛЯЦІЯ: Фізика отримує лише параметри руху та загальну довжину
    const moveIntent = trainStore.moveIntent || "FORWARD";
    const totalLength = trainStore.getTrackLength?.() || 0;
    const maxSpeed = trainStore.maxSpeed ?? TRAIN_CONFIG.PHYSICS.MAX_SPEED;

    let speed = currentSpeedRef.current ?? 0;
    const direction = moveIntent === "FORWARD" ? 1 : -1;
    let targetSpeed = isMoving ? maxSpeed * direction : 0;

    // 2. Логіка зупинки (залишається без змін)
    if (this.targetStopDistance !== null && totalLength > 0) {
      const distToStop = this.getSignedDistance(
        this.targetStopDistance,
        distanceRef.current,
        totalLength,
      );
      const brakingDistance =
        (speed * speed) / (2 * TRAIN_CONFIG.PHYSICS.DECELERATION) + 0.5;

      if (
        Math.abs(distToStop) <= brakingDistance ||
        Math.sign(distToStop) !== direction
      ) {
        targetSpeed = 0;
        // this.context!["isMovingRef"]!.current = false;
      }
    }

    // 3. Кінематика розгону/гальмування
    const ACCEL = TRAIN_CONFIG.PHYSICS.ACCELERATION;
    const DECEL = TRAIN_CONFIG.PHYSICS.DECELERATION;
    const rate = Math.abs(speed) < Math.abs(targetSpeed) ? ACCEL : DECEL;

    // Плавна зміна швидкості
    speed += (targetSpeed - speed) * Math.min(1, rate * dt);
    currentSpeedRef.current = speed;

    const previousDistance = distanceRef.current;

    // 4. Оновлення позиції (інтегрування)
    distanceRef.current = this.advanceDistance(
      previousDistance,
      speed * dt,
      totalLength,
    );
    trainStore.setHead?.({ distance: distanceRef.current, splineId: trainStore.activeSplineIndex });

    // 5. Перевірка прибуття на точку зупинки
    if (this.targetStopDistance !== null && totalLength > 0) {
      const before = this.getSignedDistance(
        this.targetStopDistance,
        previousDistance,
        totalLength,
      );
      const after = this.getSignedDistance(
        this.targetStopDistance,
        distanceRef.current,
        totalLength,
      );

      const crossedStop =
        Math.sign(before) !== Math.sign(after) &&
        Math.abs(before) < Math.max(2, Math.abs(speed * dt) + 0.5);
      const reachedStop =
        Math.abs(after) <= Math.max(0.35, Math.abs(speed * dt) + 0.05);

      if (
        crossedStop ||
        reachedStop ||
        (speed === 0 && Math.abs(after) < 0.75)
      ) {
        distanceRef.current = this.wrapDistance(
          this.targetStopDistance,
          totalLength,
        );
        trainStore.setHead?.({ distance: distanceRef.current, splineId: trainStore.activeSplineIndex });
        currentSpeedRef.current = 0;
        this.context!["isMovingRef"]!.current = false;
        this.targetStopDistance = null;
      }
    }

    // 6. Оновлення стору
    trainStore.setRawDistance?.(distanceRef.current);
    trainStore.updateMotion?.(
      distanceRef.current,
      currentSpeedRef.current,
      this.context!["isMovingRef"]?.current ?? false,
    );

  }

  private advanceDistance(
    distance: number,
    delta: number,
    total: number,
  ): number {
    const next = distance + delta;
    if (total > 0) {
      return this.wrapDistance(next, total);
    }
    // If no track loaded, keep value but ensure it's not negative
    return Math.max(0, next);
  }

  private wrapDistance(distance: number, total: number): number {
    return ((distance % total) + total) % total;
  }

  private getSignedDistance(a: number, b: number, total: number): number {
    let diff = a - b;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  }
}
