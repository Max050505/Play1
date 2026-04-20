import { create } from "zustand";
import { STATIONS_DATA, STATIONS_MAP } from "../utils/constants";
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
  subscribeToStop: (callback: (id: string) => void) => () => void;
  triggerStopEvent: (id: string ) => void;
  setShouldStop: (id: string, value: boolean) => void;
}

export const useStationsStore = create<State>((set, get) => ({
  stations: STATIONS_DATA.map((st) => {
    const mapInfo = STATIONS_MAP.find((m) => m.id === st.id);

    return {
      ...st,
      isBuilt: mapInfo?.isDefault ?? false,
      shouldStop: mapInfo?.shouldStop ?? false,
    };
  }),
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
      const exists = state.stations.some((s) => s.id === newStation.id);

      if (exists) return state;

      return {
        stations: [...state.stations, { ...newStation, isBuilt: false }],
      };
    }),
  unregisterStation: (id) =>
    set((state) => ({
      stations: state.stations.filter((s) => s.id !== id),
      nextStopId: state.nextStopId === id ? null : state.nextStopId,
      // Закриваємо меню, якщо станція видаляється
      isUpgradeMenuOpen:
        state.nextStopId === id ? false : state.isUpgradeMenuOpen,
    })),

  setNextStop: (id: string | null) => set({ nextStopId: id }),

  // Метод для ручного керування меню
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

    if (station?.type === "upgrade") {
      set({ isUpgradeMenuOpen: true });
    }
    if (station?.shouldStop) {
      state.setShouldStop(id, false);
      console.log(`Stop flag reset for station: ${id}`);
    }
    state.onStationStopListeners.forEach((listener) => listener(id));

    // if (state.onStationStop) {
    //   state.onStationStop(id);
    // }
  },
  updateStationStatus: (id, isBuilt, shouldStop) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, isBuilt, shouldStop } : s,
      ),
    })),
}));
