import { create } from "zustand";
import { STATIONS_CONFIG } from "../utils/constants";
import type { Station, StationRegistration } from "../types";

interface State {
  stations: Station[];
  nextStopId: string | null;
  isUpgradeMenuOpen: boolean;
  updateStationStatus: (
    id: string ,
    isBuilt: boolean,
    shouldStop: boolean,
  ) => void;
  onStationStop: ((stationId: string) => void) | null;
  registerStation: (newStation: StationRegistration) => void;
  unregisterStation: (id: string) => void;
  setNextStop: (id: string | null) => void;
  setUpgradeMenu: (open: boolean) => void;
  onStationStopListeners: ((stationId: string) => void)[];
  subscribeToStop: (callback: (stationId: string) => void) => () => void;
  triggerStopEvent: (id: string ) => void;
  setShouldStop: (id: string, value: boolean) => void;
}

export const useStationsStore = create<State>((set, get) => ({
  stations: STATIONS_CONFIG.map((config) => ({
    id: config.id,
    name: config.name,
    type: config.type as any,
    distance: config.distance,
    resourceType: config.resourceType as any,
    isBuilt: config.isDefault ?? false,
    shouldStop: config.shouldStop ?? false,
  })),
  setShouldStop: (id, value) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, shouldStop: value } : s,
      ),
    })),
  onStationStopListeners: [],
  nextStopId: null,
  onStationStop: null,
  isUpgradeMenuOpen: false,

registerStation: (newStation) =>
  set((state) => {
    const existing = state.stations.find((s) => s.id === newStation.id);
    if (existing) {
      // Merge, preserving isBuilt from existing or config
      return {
        stations: state.stations.map((s) =>
          s.id === newStation.id ? { ...s, ...newStation, isBuilt: existing.isBuilt } : s
        ),
      };
    }
    // New station - get isBuilt from STATIONS_CONFIG
    const config = STATIONS_CONFIG.find(c => c.id === newStation.id);
    return {
      stations: [...state.stations, { ...newStation, isBuilt: config?.isDefault ?? false }],
    };
  }),
  unregisterStation: (id) =>
    set((state) => ({
      stations: state.stations.filter((s) => s.id !== id),
      nextStopId: state.nextStopId === id ? null : state.nextStopId,
      isUpgradeMenuOpen:
        state.nextStopId === id ? false : state.isUpgradeMenuOpen,
    })),

  setNextStop: (id: string | null) => set({ nextStopId: id }),

  setUpgradeMenu: (open) => set({ isUpgradeMenuOpen: open }),

  subscribeToStop: (callback) => {
    set((state) => ({
      onStationStopListeners: [...state.onStationStopListeners, callback],
    }));

    return () => {
      set((state) => ({
        onStationStopListeners: state.onStationStopListeners.filter(
          (l) => l !== callback
        ),
      }));
    };
  },

  triggerStopEvent: (id) => {
    const state = get();
    const station = state.stations.find((s) => s.id === id);
    console.log("🔔 triggerStopEvent:", id, "isBuilt:", station?.isBuilt);

    if (station?.type === "upgrade") {
      set({ isUpgradeMenuOpen: true });
    }
    if (station?.shouldStop) {
      state.setShouldStop(id, false);
      console.log(`Stop flag reset for station: ${id}`);
    }
    state.onStationStopListeners.forEach((listener) => listener(id));
  },
  updateStationStatus: (id, isBuilt, shouldStop) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, isBuilt, shouldStop } : s,
      ),
    })),
}));