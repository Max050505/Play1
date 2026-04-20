import TextHint from "../ui/TextHint";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useTrainStore } from "../store/useTrainStore";
import { BuildUI } from "../ui/BuildPyramidsUI";

export const GameUI = () => {
  const isUserPressing = useTrainStore((state) => state.isUserPressing);
  const isAtStation = useTrainStore((state) => state.isAtStation);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<any>(null);
  useEffect(() => {

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isUserPressing && !isAtStation) {
      timerRef.current = setTimeout(() => setShowHint(true), 1500);
    } else {
      setShowHint(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isUserPressing, isAtStation]);

  return (
    <>
      <BuildUI />
      <AnimatePresence>
        {showHint && <TextHint>Hold to move</TextHint>}
      </AnimatePresence>
    </>
  );
};
