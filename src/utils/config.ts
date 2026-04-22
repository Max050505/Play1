import * as THREE from 'three'
import type { SplineConfig, Transition } from "../types";

export const TRAIN_CONFIG = {

  WAGON_OFFSET: 7.5,     
  MAX_WAGONS: 5,         
  
  PHYSICS: {
    MAX_SPEED: 22,
    ACCELERATION: 10,     
    DECELERATION: 20,
    MAX_SPEED_PER_LEVEL: 0.2,     
  },
  
  ANIMATION: {
    BOUNCE_HEIGHT: 0.12,  
    BOUNCE_SPEED: 8,    
    WIGGLE_ANGLE: 1.8,
  }
};

export const PASSENGER_CONFIG = {
  // Налаштування спавну
  countPerStation: 6,
  
  spawnArea: {
    width: 8,  // Вздовж перону (X)
    depth: 3,  // Вглиб перону (Z)
    minDistance: 2 // Мінімальна візуальна відстань (щоб не злипались)
  },

  // Фізика руху
  moveSpeed: 7,
  stopDistance: 0.1,

  // Візуал
  modelScale: [1, 1, 1],
  rotationRandomness: Math.PI * 2, // 360 градусів

  defaultOffset: [10, 0.5, 32]
};

     export const STATION_CONFIG = {                                                                                                                                    
       SCAN_DISTANCE: 5,                                                                                                                         
       PASSENGER_RADIUS: 15,                                                                                                        
       RESET_DISTANCE: 10,                                                                                                                          
     };           

export const RESOURCES_CONFIG = {
  coins: 100,
  plane: 0,
  police: 25,
  hospital: 20
}
export const REWARD_CONFIG: Record<string, number> = {
  coin: 3,
  plane: 1,
  police: 1,
  hospital: 1,
};

export const IDLE_SCALE = [new THREE.Vector3(0.95, 1.05, 0.95), new THREE.Vector3(1.05, 1.0, 1.05)];
export const MOVE_SCALE = [new THREE.Vector3(1.125, 0.95, 1.125), new THREE.Vector3(0.9, 1.07, 1.3)];
export const MOVE_POS_Y = [0, 0.2];

export const TRACK_SWITCHES: {
  splineIndex: number;
  distance: number;
  allowedDirection: "FORWARD" | "BACKWARD";
  options: {
    targetSpline: number;
    entryDistance: number;
    intent: "FORWARD" | "BACKWARD";
  }[];
  triggerDistance: number;
}[] = [ 
  { 
    splineIndex: 0, 
    distance: 280, 
    allowedDirection: "BACKWARD",
    triggerDistance: 20,
    options: [
    { targetSpline: 2, entryDistance: 30, intent: "BACKWARD" },
    { targetSpline: 0, entryDistance: 280, intent: "BACKWARD" }
    ]
  }
];


export const TRANSITIONS: Transition[] = [
  // Track 2 -> Track 1 (auto, backward) at distance 30
  { fromSpline: 2, atDistance: 1, toSpline: 1, entryDistance: 266, intent: "BACKWARD" },
  // Track 1 -> Track 0 (auto, forward) at distance 266
  { fromSpline: 1, atDistance: 1, toSpline: 0, entryDistance: 207, intent: "FORWARD" },
];