export interface EngineUpdateContext {
  dt: number;
}

export interface EngineContext {
  getTrainStore: () => any;
  setTrainStore: (partial: any) => void;
  getStationsStore: () => any;
  setStationsStore: (partial: any) => void;
  getResourcesStore: () => any;
  getDecorStore: () => any;
  distanceRef: React.MutableRefObject<number>;
  currentSpeedRef: React.MutableRefObject<number>;
  samples: any[];
  getEngine: (name: string) => BaseEngine | undefined;
  camera?: any;
  scene?: any;
  size?: any;
  trainViewRef?: any;
  partRefs?: any;
  getWagonPos?: (idx: number, baseDistance?: number, splineIdx?: number) => any;
  isMovingRef?: React.MutableRefObject<boolean>;
}

export abstract class BaseEngine {
  abstract readonly name: string;
  priority: number = 100;
  enabled: boolean = true;

  protected context?: EngineContext;

  init(context: EngineContext): void {
    this.context = context;
  }

  abstract update(context: EngineUpdateContext): void;

  dispose?(): void;
}
