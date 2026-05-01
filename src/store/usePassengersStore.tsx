import { create } from 'zustand';
import { passengerEngine } from '../engines/PassengerEngine';

interface PassengerStore {
  getCountInside: () => number;
}

export const usePassengerStore = create<PassengerStore>(() => ({
  getCountInside: () => passengerEngine.getAll().filter((p) => p.state === "inside").length,
}));