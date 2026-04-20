import React from "react";
import { useState, useEffect } from "react";
import { useResponsiveStore } from "../store/useResponsiveStore";

interface QuestPanelProps {
  text: string;
  active: boolean;
  isCompleted: boolean;
}

const QuestPanel: React.FC<QuestPanelProps> = ({
  text,
  active,
  isCompleted,
}) => {
  const [activeAnim, setActiveAnim] = useState(false);
  const { isMobile } = useResponsiveStore();
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setActiveAnim(true), 20);
      return () => clearTimeout(timer);
    } else {
      setActiveAnim(false);
    }
  }, [active]);

  if (!active) return null;

  const top = isMobile ? "80px" : "105px";
  const width = isMobile ? "160px" : "200px";
  const padding = isMobile ? "14px 16px" : "18px 20px";
  const fontSize = isMobile ? "15px" : "19px";
  const minHeight = isMobile ? "40px" : "50px";

  return (
    <div
      id="ui-root"
      className={`quest-overlay ${activeAnim ? "show" : ""}`}
      style={{
        position: "fixed",

        top: top,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: 0
      }}
    >
      <div
        style={{
          width: width,
          minHeight: minHeight,
          background: isCompleted
            ? "linear-gradient(to top, #F58200 10%, #FFD147 100%)"
            : "linear-gradient(180deg, #1C4D78 0%, #173B5A 100%)",
          padding: padding,
          borderRadius: "15px",
          boxShadow: "inset 0 0 0 1.2px #ffffff, 0 5px 4px rgba(0,0,0,0.6)",
          border: "1.2px solid #000000",
          color: "white",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          transition: "all 0.5s ease-in-out",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <h2 className={`text-board uppercase flex justify-center items-center`} style={{ fontSize: fontSize }}>
          {isCompleted ? "Complete" : text}
        </h2>
      </div>

<style>{`
  .quest-overlay.show {
    /* Трохи швидше (0.8s), щоб анімація не затягувалась */
    animation: smoothSpring 0.8s cubic-bezier(0.2, 0.9, 0.3, 1.1) forwards;
  }

  @keyframes smoothSpring {
    0% { 
      opacity: 0; 
      /* Початковий виліт: scale 1.5 і нижче на 50px */
      transform: translateX(-50%) translateY(50px) scale(1.5); 
    }
    
    /* ФІКСАЦІЯ (Punch/Pause 0.1с) */
    12% {
      opacity: 1;
      transform: translateX(-50%) translateY(45px) scale(1.4);
    }
    22% {
      opacity: 1;
      transform: translateX(-50%) translateY(45px) scale(1.4);
    }

    /* ПЕРШИЙ ВІДСКОК: м'яко пролітаємо фінал вгору */
    55% {
       transform: translateX(-50%) translateY(-12px) scale(0.95); 
    }

    /* ДРУГИЙ ВІДСКОК: легке затухання вниз */
    80% {
       transform: translateX(-50%) translateY(4px) scale(1.03); 
    }

    /* ФІНАЛ: плавне заспокоєння */
    100% { 
      opacity: 1; 
      transform: translateX(-50%) translateY(0) scale(1); 
    }
  }
`}</style>
    </div>
  );
};

export default QuestPanel;
