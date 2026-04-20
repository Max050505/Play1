import { create } from 'zustand';

interface PassengerMeta {
  id: string;
  modelType: number;
  state: 'waiting' | 'moving' | 'boarding' | 'inside';
  
}

interface PassengerStore {
  passengersMeta: PassengerMeta[];
  countInside: number;
  
  lastBuildTimestamp: number; // Час останнього будівництва
  triggerExit: (stationId: string | null, system: any) => void;
  // Екшени
  addPassenger: (id: string, modelType: number) => void;
  setPassengerState: (id: string, state: PassengerMeta['state']) => void;
  incrementInside: () => void;
  removePassenger:(id:string) => void;
  boardPassenger: (id:string) => void;
  exitPassenger: () => void;
  
}

export const usePassengerStore = create<PassengerStore>((set) => ({
  passengersMeta: [],
  countInside: 0,
  lastBuildTimestamp: 0,

  addPassenger: (id, modelType) => set((state) => ({
    passengersMeta: [...state.passengersMeta, { id, modelType, state: 'waiting' }]
  })),

  // Видаляє пасажира зі світу (наприклад, якщо він пішов зі станції)
  removePassenger: (id) => set((s) => ({
    passengersMeta: s.passengersMeta.filter(p => p.id !== id)
  })),

  // --- ДОДАЙ ЦЕЙ МЕТОД ---
  // Викликається, коли пасажир торкається вагона
  boardPassenger: (id) => set((s) => ({

    countInside: s.countInside + 1,

    passengersMeta: s.passengersMeta.filter(p => p.id !== id)
  })),

  setPassengerState: (id, state) => set((s) => ({
    passengersMeta: s.passengersMeta.map(p => p.id === id ? { ...p, state } : p)
  })),

  incrementInside: () => set((s) => ({ countInside: s.countInside + 1 })),
  exitPassenger: () => set((s) => ({
  countInside: Math.max(0, s.countInside - 1)
})),
triggerExit: (stationId: string | null, system: any) => {
  set((state) => {
    // Шукаємо всіх, хто у вагоні і чий пункт призначення — ця станція
    const exiting = system.physics.filter(
      (p: any) => p.target === "wagon" && p.destination === stationId
    );

    if (exiting.length === 0) return state;

    exiting.forEach((p: any) => {
      p.target = null; // Висаджуємо з вагона
      p.destination = null; // Скидаємо ціль
      
      // Даємо початковий імпульс у бік перону, щоб вони не стояли на коліях
      p.velocity.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
    });

    console.log(`🏃 Вийшло пасажирів: ${exiting.length} на станції ${stationId}`);

    return {
      ...state,
      countInside: Math.max(0, state.countInside - exiting.length)
    };
  });
},
}));