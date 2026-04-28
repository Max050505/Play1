import * as THREE from "three";

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

class PassengerEngine {
  private passengers: Passenger[] = [];

  getAll() {
    return this.passengers;
  }

  add(p: Passenger) {
    this.passengers.push(p);
  }

  remove(id: string) {
    this.passengers = this.passengers.filter((p) => p.id !== id);
  }

update(dt: number) {
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
  clear() {
    this.passengers = [];
  }
}

export const passengerEngine = new PassengerEngine();
