import { create } from "zustand";

interface DecorProps {
  unlockedDecor: string[];
  activeBuildId: string | null;
  railwayBuilt: boolean;
  setActiveBuildId: (id: string | null) => void;
  buildDecor: (id: string) => void;
  buildTrigger: number;
  unlockRailway: () => void;
}

export const useDecoreStore = create<DecorProps>((set) => ({
  unlockedDecor: [],
  activeBuildId: null,
  buildTrigger: 0,
  railwayBuilt: false,

  setActiveBuildId: (id) => set({ activeBuildId: id }),

  buildDecor: (id) =>
    set((state) => {
      if (state.unlockedDecor.includes(id)) {
        return { activeBuildId: null };
      }

      return {
        unlockedDecor: [...state.unlockedDecor, id],
        buildTrigger: state.buildTrigger + 1,
        activeBuildId: null,
      };
    }),

  unlockRailway: () =>
    set((state) => ({
      railwayBuilt: true,
      unlockedDecor: [...state.unlockedDecor, "Loop_B", "Bridge_AB"],
    })),
}));
