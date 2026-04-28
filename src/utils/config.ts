import * as THREE from 'three'

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
  countPerStation: 10,
  
  spawnArea: {
    width: 3,  
    depth: 8,  
    minDistance: 2 
  },

  // Фізика руху
  moveSpeed: 7,
  stopDistance: 0.1,

  // Візуал
  modelScale: [1, 1, 1],
  rotationRandomness: Math.PI * 2, 

  defaultOffset: [0, 0.5, 0]
};

export const STATION_CONFIG = {                                                                                                                                    
  SCAN_DISTANCE: 5,                                                                                                                         
  PASSENGER_RADIUS: 10,                                                                                                        
  RESET_DISTANCE: 10,
  STOP_RADIUS: 30, 
  APPROACH_ZONE: 60,  
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

