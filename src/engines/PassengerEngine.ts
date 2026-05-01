import * as THREE from "three";
import { BaseEngine, type EngineUpdateContext } from "./BaseEngine";

export type PassengerState =
  | "idle"
  | "moving"
  | "boarding"
  | "inside"
  | "exiting"
  | "done";

export type Passenger = {
  id: string;
  stationId?: string;
  position: THREE.Vector3;
  target?: THREE.Vector3 | null;
  nextTarget?: THREE.Vector3 | null;
  lastPos: THREE.Vector3;
  animPhase: number;
  rotation: number;
  modelType: number;
  state: PassengerState;
  onReach?: () => void;
  rotationOffset?: any;
};

export class PassengerEngine extends BaseEngine {
  readonly name = "PassengerEngine";
  priority = 80;

  private passengers: Passenger[] = [];

  getAll(): Passenger[] {
    return this.passengers;
  }

  add(p: Passenger): void {
    this.passengers.push(p);
  }

  remove(id: string): void {
    this.passengers = this.passengers.filter((p) => p.id !== id);
  }

  clear(): void {
    this.passengers = [];
  }

  getPassengersByState(state: PassengerState): Passenger[] {
    return this.passengers.filter((p) => p.state === state);
  }

  getPassengersAtStation(stationId: string): Passenger[] {
    return this.passengers.filter(
      (p) => p.stationId === stationId && p.state === "idle"
    );
  }

  update(context: EngineUpdateContext): void {
    const dt = context.dt;

    for (const p of this.passengers) {
      if (!p.target) continue;

      const dir = new THREE.Vector3()
        .subVectors(p.target, p.position)
        .setY(0);

      const dist = dir.length();

      if (dist < 0.05) {
        p.position.copy(p.target);
        p.lastPos = p.position.clone();

        if (p.nextTarget) {
          p.target = p.nextTarget;
          p.nextTarget = undefined;
          continue;
        }

        p.target = undefined;
        p.onReach?.();
        p.onReach = undefined;
        continue;
      }

      dir.normalize();

      let speed = 2.5;

      if (p.state === "boarding") speed = 10;
      if (p.state === "exiting") speed = 5.5;
      if (p.state === "moving") speed = 7;

      p.lastPos = p.position.clone();
      p.position.addScaledVector(dir, dt * speed);
    }
  }

  dispose(): void {
    this.passengers = [];
  }
}

export const passengerEngine = new PassengerEngine();
