import { create } from "zustand";
import { RESOURCES_CONFIG, REWARD_CONFIG } from "../utils/config";
export type ResourceType = "coin" | "police" | "plane" | "hospital";

interface ResourceFx {
  id: string;
  x: number;
  y: number;
  type: ResourceType;
}

interface resourceStoreProps {
  coin: number;
  police: number;
  plane: number;
  hospital: number;


  activeFxs: ResourceFx[];

  addResource: (type: ResourceType, amount: number) => void;
  spawnReward: (x: number, y: number, stationType: ResourceType, amount?: number) => void;
  removeFx: (id: string) => void;
  canAfford: (requirements: Partial<Record<ResourceType, number>>) => boolean;
  spendResources: (requirements: Partial<Record<ResourceType, number>>) => void;
   applyRewardBatch: (x: number, y: number, type: ResourceType, passengerCount?: number) => void;
}

export const resourcesStore = create<resourceStoreProps>((set, get) => ({
  coin: RESOURCES_CONFIG.coins,
  police: RESOURCES_CONFIG.police,
  plane: RESOURCES_CONFIG.plane,
  hospital: RESOURCES_CONFIG.hospital,
  value: 0,
  activeFxs: [],
  addResource: (type, amount) =>
    set((state) => ({
      ...state,
      [type]: (state[type] || 0) + amount,
    })),
canAfford: (requirements) => {
    const state = get();
    return Object.entries(requirements).every(([type, amount]) => {
      const resourceType = type as ResourceType;
      return (state[resourceType] || 0) >= (amount || 0);
    });
  },

  // Списання ресурсів
  spendResources: (requirements) => {
    set((state) => {
      const updates: Partial<Record<ResourceType, number>> = {};
      Object.entries(requirements).forEach(([type, amount]) => {
        const resourceType = type as ResourceType;
        updates[resourceType] = (state[resourceType] || 0) - (amount || 0);
      });
      return { ...state, ...updates };
    });
  },
spawnReward: (x, y, type) => {
  const id = `${Date.now()}-${Math.random()}`;
  const newFx: ResourceFx = { id, x, y, type };

  set((state) => ({
    activeFxs: [...state.activeFxs, newFx],
  }));
},

  removeFx: (id: string) =>
    set((state) => ({
      activeFxs: state.activeFxs.filter((f) => f.id !== id),
    })),


applyRewardBatch: (x, y, type, passengerCount = 1) => {
  const state = get();
  
  // Вилітає ОДИН літак (який дасть +passengerCount в кінці)
  state.spawnReward(x, y, type, passengerCount);

  // Вилітає ОДНА монета (яка дасть, наприклад, passengerCount * 3)
  if (type !== "coin") {
    state.spawnReward(x + 30, y, "coin", passengerCount * REWARD_CONFIG.coin);
  }
},

}));
