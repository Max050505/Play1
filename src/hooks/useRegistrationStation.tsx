import { useEffect } from "react";
import { useStationsStore } from "../store/useStationStore";
import { STATIONS_DATA } from "../utils/constants";

export function useRegisterStation(id: string, name: string) {
  const register = useStationsStore((s) => s.registerStation);
  const unregister = useStationsStore((s) => s.unregisterStation);

  useEffect(() => {
    const staticData = STATIONS_DATA.find(s => s.id === id);
    
    if (staticData && staticData.distance !== undefined) {
      register({
        id,
        name,
        distance: staticData.distance, 
        resourceType: staticData.resourceType,
        type: staticData.type
      } as any);
    } else {
      console.warn(`Station ${id} not found in STATIONS_DATA!`);
    }

    return () => unregister(id);  
  }, [id, name, register, unregister]);
}