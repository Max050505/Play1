import { create } from "zustand";
import { TRAIN_CONFIG } from "../utils/config";
import { resourcesStore } from "./resourceStore";
import type { TrainState } from "../types";

export type { TrainState };

const rawDistanceHolder = { current: 200 };
const runtimeDistanceHolder: React.RefObject<number> | null = null;

export const useTrainStore = create<TrainState>((set, get) => ({
  samples: [],
  activeSplineIndex: 0,
  wagons: [],
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
forcedStop: false,
setForcedStop: (v: boolean) => set({ forcedStop: v }),
  // КУПІВЛЯ ШВИДКОСТІ
  upgradeSpeed: () => {
    if (get().isAnimating) return;
    set({ isAnimating: true });
    const { speedLevel } = get();
    const { coin, addResource } = resourcesStore.getState();
    const PRICE = 50;

    if (coin < PRICE) {
      return;
    }

    if (speedLevel >= 10) {
      return;
    }

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
    
    const { wagons } = get();
    const { coin, addResource } = resourcesStore.getState();
    const PRICE = 50;



    if (wagons.length >= TRAIN_CONFIG.MAX_WAGONS) return;
    if (coin < PRICE) return;

    addResource("coin", -PRICE); 
    set((state) => {
      console.log("addWagon set state, new wagons count:", state.wagons.length + 1);
      return {
        isAnimating: true,
        wagons: [...state.wagons, { id: Date.now(), isNew: true }],
        maxCapacity: state.maxCapacity + 5,
      };
    });
  },

  removeWagon: (id) =>
    set((state) => ({
      wagons: state.wagons.filter((w) => w.id !== id),
    })),

  updateMotion: (currentDistance, velocity, isMoving) =>
    set({ currentDistance, velocity, isMoving }),

  resumeTrain: () => {
    set({ isUpgradeMenuOpen: false });
  },
}));
