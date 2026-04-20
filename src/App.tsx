import { useEffect, useState } from "react";
import { useResponsiveStore } from "./store/useResponsiveStore";
import Scene from "./core/Scene";
import ResourcesOverlay from "./ui/ResourcesOverlay";
import QuestPanel from "./ui/QuestMessage";
import PassengerCounter from "./ui/PassengerCounter";
import { FxOverlay } from "./ui/FxOverlay";
import TrainShop from './ui/upgradeStationUI';

import { GameUI } from "./core/GameUI";
function App() {
  const [quest] = useState({ active: true, completed: false });
  const { updateDimensions } = useResponsiveStore();
  useEffect(() => {
    const handleResize = () => {
      updateDimensions();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateDimensions]);
  return (
    <main className="w-full h-screen  bg-gray-100">
      <Scene />
      <ResourcesOverlay />
      {/* <FinalScreen /> */}

      <GameUI/>
      {/* <CursorHand/> */}
      {/* <CursorsHandsToLeft /> */}
      {/* <CursorsHandsHint /> */}
      {/* <CursorsHandsSwipe/> */}
      <QuestPanel 
        active={quest.active} 
        isCompleted={quest.completed} 
        text="Go to the Airport" 
      />
      <PassengerCounter/>
      <FxOverlay/>
      <TrainShop/>

    </main>
  );
}

export default App;
