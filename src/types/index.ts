import * as THREE from "three";

export interface SplineSample {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  distance: number;
}

export interface PointAtDistance {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
}

export interface RawSplineData {
  samples: {
    p: { x: number; y: number; z: number };
    t: { x: number; y: number; z: number };
  }[];
}

export interface PassengerPhysics {
  id: string;
  position: THREE.Vector3;
  target: THREE.Vector3 | null;
  nextTarget?: THREE.Vector3 | null;
  phase?: number;
  animPhase: number;
  rotation: number;
  stationType?: string;
  onReach?: () => void;
}

export interface PassengersSystem {
  samples: SplineSample[];
  physics: PassengerPhysics[];
  spawn: (pos: THREE.Vector3, type: number) => void;
  goTo: (id: string, target: THREE.Vector3, resType?: ResourceType) => void;
  goToPyramid: (
    id: string,
    startPos: THREE.Vector3,
    gatheringPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    onEnter: () => void
  ) => void;
}

export type MoveIntent = "FORWARD" | "BACKWARD";

export interface SplineConfig {
  index: number;
  length: number;
}

export interface Transition {
  fromSpline: number;
  atDistance: number;
  toSpline: number;
  entryDistance: number;
  intent: MoveIntent;
}

export type StationType = "passenger" | "upgrade";
export type ResourceType = "coin" | "plane" | "police" | "hospital";

export interface StationData {
  id: string;
  name: string;
  type: StationType;
  resourceType: ResourceType;
  distance: number;
  price?: { police: number; hospital: number };
  decorToUnlock?: string;
}

export interface Station extends StationData {
  isBuilt: boolean;
  shouldStop?: boolean; 
}

export interface StationRegistration {
  id: string;
  name: string;
  distance: number;
  resourceType: ResourceType;
  type: StationType;
  decorToUnlock?: string;
}

export interface Wagon {
  id: number;
  isNew: boolean;
}

export interface TrackSwitchOption {
  targetSpline: number;
  entryDistance: number;
  intent: MoveIntent;
}

export interface TrackSwitch {
  splineIndex: number;
  distance: number;
  allowedDirection: MoveIntent;
  options: TrackSwitchOption[];
  triggerDistance: any;
}

export interface TrainState {
  maxCapacity: number;
  samples: SplineSample[][];
  setSamples: (data: SplineSample[][]) => void;
  locomotiveRef: React.RefObject<THREE.Group> | null;
  setLocomotiveRef: (ref: React.RefObject<THREE.Group>) => void;
  wagons: Wagon[];
  addWagon: () => void;
  removeWagon: (id: number) => void;
  upgradeSpeed: () => void;
  isAnimating: boolean;
  setAnimating: (val: boolean) => void;
  isUserPressing: boolean;
  setIsUserPressing: (val: boolean) => void;
  isAtStation: boolean;
  setAtStation: (val: boolean) => void;
  triggerSpeedWave: () => void;
  currentDistance: number;
  waveTrigger: number;
  velocity: number;
  isMoving: boolean;
  speedLevel: number;
  maxSpeed: number;
  resumeTrain: () => void;
  isUpgradeMenuOpen: boolean;
  setUpgradeMenu: (open: boolean) => void;
  canMoveTrain: boolean;
  setCanMoveTrain: (val: boolean) => void;
  updateMotion: (distance: number, velocity: number, isMoving: boolean) => void;
  setActiveSpline: (index: number) => void;
  activeSplineIndex: number;
  activeSwitch: TrackSwitch | null;
  setActiveSwitch: (sw: TrackSwitch | null) => void;
  showSwitchUI: boolean;
  setShowSwitchUI: (show: boolean) => void;
  rawDistanceRef: { current: number };
  setRawDistance: (dist: number) => void;
runtimeDistanceRef: React.RefObject<number> | null;
  setRuntimeDistanceRef: (ref: React.RefObject<number> | null) => void;
  moveIntent: MoveIntent;
  setMoveIntent: (intent: MoveIntent) => void;
  activeTransition: Transition | null;
  setActiveTransition: (t: Transition | null) => void;
}
