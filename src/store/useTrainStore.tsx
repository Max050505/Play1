import { create } from "zustand";
import { TRAIN_CONFIG } from "../utils/config";
import { resourcesStore } from "./resourceStore";
import type { TrainState } from "../types";

export type { TrainState };

const rawDistanceHolder = { current: 0 };
const runtimeDistanceHolder: React.RefObject<number> | null = null;

const spawnBehind = (targetSpline: number, targetDistance: number, offset: number, totalLength: number) => {
  let spawnDist = targetDistance - offset;
  
  // Якщо ми вилазимо за початок сплайну (наприклад, дистанція локомотива 5, а оффсет 7.5)
  // Для простоти поки що просто перекидаємо на кінець цього ж сплайну (зациклення)
  // Якщо у вас складна мережа, тут треба буде додати логіку пошуку попереднього сплайну
  if (spawnDist < 0 && totalLength > 0) {
    spawnDist = ((spawnDist % totalLength) + totalLength) % totalLength;
  }
  
  return { splineId: targetSpline, distance: spawnDist };
};

export const useTrainStore = create<TrainState>((set, get) => ({
  samples: [],
  activeSplineIndex: 0,
  wagons: [],
  head: {
  splineId: 0,
  distance: 0,
},
  tail: {
  splineId: 0,
  distance: TRAIN_CONFIG.WAGON_OFFSET ,
  },
  currentDistance: -1,
  waveTrigger: 0,
  velocity: 0,
  maxCapacity: 10,
  isMoving: false,
  speedLevel: 1,
    hasTriggeredSwitch: false,
  setHasTriggeredSwitch: (tr) => set({hasTriggeredSwitch: tr }),
  isAnimating: false,
  maxSpeed: TRAIN_CONFIG.PHYSICS.MAX_SPEED,
  isUpgradeMenuOpen: false,
  locomotiveRef: null,
  isUserPressing: false,
  isAtStation: false,
  moveIntent: "BACKWARD",
  setMoveIntent: (intent) => set({ moveIntent: intent }),
  activeTransition: null,
  setActiveTransition: (t) => set({ activeTransition: t }),
  rawDistanceRef: rawDistanceHolder,
  setUpgradeMenu: (open) => set({ isUpgradeMenuOpen: open }),
  triggerSpeedWave: () =>
    set((state) => ({ waveTrigger: state.waveTrigger + 1 })),
  setSamples: (data) => set({ samples: data }),
  setAnimating: (val) => set({ isAnimating: val }),
  setLocomotiveRef: (ref) => set({ locomotiveRef: ref }),
  setIsUserPressing: (val) => set({ isUserPressing: val }),
  setAtStation: (val) => set({ isAtStation: val }),
  canMoveTrain: true,
  setCanMoveTrain: (val) => set({ canMoveTrain: val }),
  setActiveSpline: (index) => set({ activeSplineIndex: index, showSwitchUI: false, activeSwitch: null }),
  activeSwitch: null,
  setActiveSwitch: (sw) => set({ activeSwitch: sw }),
  showSwitchUI: false,
  setShowSwitchUI: (show: boolean) => set(() => ({ 
  showSwitchUI: show,
  canMoveTrain: !show,
})),
  resumeFromSwitch: () => {
    set({ showSwitchUI: false, activeSwitch: null });
  },
  pendingBoarding: null as string | null,
setPendingBoarding: (id: string | null) =>
  set({ pendingBoarding: id }),
  resumeFromSwitchFn: null as (() => void) | null,
  setResumeFromSwitchFn: (fn: () => void) => set({ resumeFromSwitchFn: fn }),
  setRawDistance: (dist: number) => { rawDistanceHolder.current = dist; },
  runtimeDistanceRef: runtimeDistanceHolder,
  setRuntimeDistanceRef: (ref) => set({ runtimeDistanceRef: ref }),
pendingTransition: null,
confirmedTransition: null,
setPendingTransition: (t) => set({ pendingTransition: t }),
setConfirmedTransition: (t) => set({ confirmedTransition: t }),
setHead: (updates: Partial<{ splineId: number; distance: number }>) => 
  set((state) => ({ head: { ...state.head, ...updates } })),
setWagon: (id: number, updates: Partial<{ splineId: number; distance: number }>) =>
  set((state) => ({
    wagons: state.wagons.map((w) => (w.id === id ? { ...w, ...updates } : w)),
  })),
setWagons: (updater: (wagons: Array<{ id: number; isNew: boolean; splineId: number; distance: number }>) => Array<{ id: number; isNew: boolean; splineId: number; distance: number }>) =>
  set((state) => ({ wagons: updater(state.wagons) })),
setTail: (updates: Partial<{ splineId: number; distance: number }>) =>
  set((state) => ({ tail: { ...state.tail, ...updates } })),
forcedStop: false,
getTrackLength: () => {
  const state = get();
  const samples = state.samples[state.activeSplineIndex] || [];
  return samples.length > 0 ? samples[samples.length - 1].distance : 0;
},
setForcedStop: (v: boolean) => set({ forcedStop: v }),
  // КУПІВЛЯ ШВИДКОСТІ
  upgradeSpeed: () => {
    if (get().isAnimating) return;
    const { speedLevel } = get();
    const { coin, addResource } = resourcesStore.getState();
    const PRICE = 50;

    if (coin < PRICE) {
      return;
    }

    if (speedLevel >= 10) {
      return;
    }

    set({ isAnimating: true });
    addResource("coin", -PRICE);

    set((state) => {
      const increment =
        TRAIN_CONFIG.PHYSICS.MAX_SPEED *
        TRAIN_CONFIG.PHYSICS.MAX_SPEED_PER_LEVEL;
      const newMaxSpeed = state.maxSpeed + increment;

      return {
        speedLevel: state.speedLevel + 1,
        maxSpeed: newMaxSpeed,
        waveTrigger: state.waveTrigger + 1,
      };
    });
  },

  // КУПІВЛЯ ВАГОНА
addWagon: () => {
  if (get().isAnimating) return;
  
  const state = get();
  const { coin, addResource } = resourcesStore.getState();
  const PRICE = 50;

  if (state.wagons.length >= TRAIN_CONFIG.MAX_WAGONS) return;
  if (coin < PRICE) return;

  addResource("coin", -PRICE); 
  
  set((state) => {
    const samples = state.samples[state.activeSplineIndex] || [];
    const totalLength = samples[samples.length - 1]?.distance || 0;
    
    // Шукаємо, за ким будемо спавнити новий вагон
    const lastObject = state.wagons.length > 0 
      ? state.wagons[state.wagons.length - 1] 
      : { splineId: state.activeSplineIndex, distance: state.rawDistanceRef.current };

    // Народжуємо новий вагон позаду останнього об'єкта
    const newWagonPos = spawnBehind(lastObject.splineId, lastObject.distance, TRAIN_CONFIG.WAGON_OFFSET, totalLength);
    
    // Народжуємо хвіст позаду нового вагона
    const newTailPos = spawnBehind(newWagonPos.splineId, newWagonPos.distance, TRAIN_CONFIG.WAGON_OFFSET, totalLength);

    return {
      isAnimating: true,
      wagons: [...state.wagons, {
        id: Date.now(),
        isNew: true,
        splineId: newWagonPos.splineId,
        distance: newWagonPos.distance
      }],
      tail: {
        splineId: newTailPos.splineId,
        distance: newTailPos.distance - (TRAIN_CONFIG.WAGON_OFFSET * (state.wagons.length + 1)),
      },
      maxCapacity: state.maxCapacity + 5,
    };
  });
},

  removeWagon: (id) =>
    set((state) => {
      const wagons = state.wagons.filter((w) => w.id !== id);

      return {
        wagons,
        // tail: {
        //   splineId: state.activeSplineIndex,
        //   distance: spawnBehind(wagons.length + 1, state.moveIntent),
        // },
      };
    }),

  updateMotion: (currentDistance, velocity, isMoving) =>
    set({ currentDistance, velocity, isMoving }),

  resumeTrain: () => {
    set({ isUpgradeMenuOpen: false });
  },
}));
