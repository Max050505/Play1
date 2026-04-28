import React, { useEffect, useState } from "react";
import { passengerEngine } from "../utils/passangerEngine";
import icon from '../assets/sprites/icon_passenger.png';
import { useTrainStore } from "../store/useTrainStore";
import { useResponsiveStore } from "../store/useResponsiveStore";

const PassengerCounter: React.FC = () => {
  const maxCapacity = useTrainStore((s) => s.maxCapacity);
  const { isMobile } = useResponsiveStore();
  const [pulse, setPulse] = useState(false);
  const [countInside, setCountInside] = useState(0);

  useEffect(() => {
    const update = () => {
      setCountInside(passengerEngine.getAll().filter((p) => p.state === "inside").length);
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((countInside / maxCapacity) * 100, 100);
  
  const barColor = countInside >= maxCapacity ? "#b91c1c" : "#FFD147";

  useEffect(() => {
    if (countInside > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 200);
      return () => clearTimeout(timer);
    }
  }, [countInside]);

  const top = isMobile ? "top-[60%]" : "top-[65%]";
  const gap = isMobile ? "gap-2" : "gap-3";
  const padding = isMobile ? "px-5 py-1.5" : "px-7 py-2";
  const iconSize = isMobile ? "w-5 h-5" : "w-7 h-7";
  const fontSize = isMobile ? "text-[14px]" : "text-[18px]";

  return (
    <div 
      className={`
        absolute ${top} left-1/2 -translate-x-1/2 -translate-y-1/2 
        pointer-events-none flex items-center ${gap}
        ${padding} rounded-full border-2 border-black/60
        shadow-2xl transition-all duration-300
        ${pulse ? "scale-105" : "scale-100"}
      `}
      style={{ 
        zIndex: 9999,

        background: `linear-gradient(to right, ${barColor} ${progress}%, rgba(0,0,0,0.8) ${progress}%)`
      }}
    >
      <img 
        src={icon} 
        alt="passenger" 
        className={`${iconSize} object-contain drop-shadow-md`} 
      />

      <div 
        className={`${fontSize} text-board flex items-center tracking-wider`} 

      >
        <span>{countInside}</span>
        <span className="mx-1 opacity-70 text-base">/</span>
        <span>{maxCapacity}</span>
      </div>
    </div>
  );
};

export default PassengerCounter;