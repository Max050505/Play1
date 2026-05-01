import { useCallback } from "react";
import * as THREE from "three";
import { type ResourceType } from "../store/resourceStore";
import { passengerEngine } from "../engines/PassengerEngine";

export interface PassengerPhysics {
  id: string;
  position: THREE.Vector3;
  target: THREE.Vector3 | null;
  nextTarget?: THREE.Vector3 | null;
  phase?: number;
  animPhase: number;
  rotation: number;
  stationType?: ResourceType;
  onReach?: () => void;
}

export const usePassenger = () => {
const spawn = (pos: THREE.Vector3, type: number, stationId?: string) => {
  const id = Math.random().toString(36).slice(2);

  passengerEngine.add({
    id,
    stationId,
    position: pos.clone(),
    target: undefined,
    nextTarget: undefined,
    animPhase: Math.random(),
    rotation: 0,
    modelType: type,
    lastPos: pos.clone(),
    state: "idle",
    rotationOffset: (Math.random() - 0.5) * Math.PI * 0.8,
  });
};

const goTo = (id: string, target: THREE.Vector3) => {
    const p = passengerEngine.getAll().find((p) => p.id === id);
  if (!p) return;

  p.target = target.clone();
  p.nextTarget = undefined;
  p.state = "moving";
  p.rotationOffset = 0;
};

const exit = useCallback((doorPos: THREE.Vector3, modelType: number) => {
  const id = `exit-${Math.random().toString(36).slice(2)}`;

  passengerEngine.add({
    id,
    position: doorPos.clone(),
    target: new THREE.Vector3(),
    nextTarget: new THREE.Vector3(),
    animPhase: Math.random(),
    rotation: 0,
    modelType,
    lastPos: doorPos.clone(),
    state: "exiting",
    rotationOffset: (Math.random() - 0.5) * Math.PI * 0.8,
  });
}, []);

const goToPyramid = (
  id: string,
  startPos: THREE.Vector3,
  gatheringPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  onEnter: () => void,
) => {
  passengerEngine.add({
    id,
    position: startPos.clone(),
    target: gatheringPos.clone(),
    nextTarget: targetPos.clone(),
    animPhase: Math.random(),
    rotation: 0,
    modelType: 0,
    lastPos: startPos.clone(),
    state: "moving",
    onReach: onEnter,

  });
};

  return {
    spawn,
    goTo,
    exit,
    goToPyramid,
    getPhysics: passengerEngine.getAll,
  };
};
