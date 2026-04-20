import { motion } from "framer-motion";
import CursorHand from "./CursorHand";
import circle from "../assets/icons/circle.png";

interface CursorsProps {
  className?: string;
}

export const CursorsHandsHint = () => {
  return (
    <div className="absolute bottom-[-200%] right-[-80%] pointer-events-none">
      <div className="relative flex items-center justify-center z-10">
        <motion.div
          className="absolute z-20 w-7 h-7"
          style={{ top: "11px", left: "24px" }}
          animate={{
            scale: [0, 1.2, 1, 0, 0],
            opacity: [0, 1, 0.99, 0, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.6, 0.8, 1],
          }}
        >
          <img src={circle} alt="fx" className="w-full h-full object-contain" />
        </motion.div>
        <CursorHand
          className="relative z-30 "
          size={100}
          animate={{
            scale: [1, 0.8, 0.8, 1, 1],
            rotate: [0, -15, -15, 0, 0],
            x: [0, 20, 20, 0, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.6, 0.8, 1],
          }}
        />
      </div>
    </div>
  );
};

export const CursorsHandsToLeft = ({className} : CursorsProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10000]">
      <motion.div
        initial={{ opacity: 1, y: -20, x: 0 }}
        animate={{
          opacity: 1,
          y: [-20, -30, -30, -20, -20],
          x: [0, -25, -25, 0, 0],
          rotate: [-10, -15, -15, -10, -10],
          scale: [1, 0.85, 0.85, 1, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.3, 0.4, 0.7, 0.8],
        }}
        className={className}
      >
        <CursorHand size={85} />
      </motion.div>
    </div>
  );
};

export const CursorsHandsSwipe = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{
          // 1. Поява -> Пауза -> Клік -> Зникнення -> (Перехід) -> Поява -> Пауза -> Клік -> Зникнення -> (Кінець)
          opacity: [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],

          // 2. Випливає (0), натискає (-15), ховається вниз (50)
          y: [50, 50, -15, -18, -18, 50, 50, -15, -18, -18],

          // 3. П'ять значень для лівої сторони (-15%) і п'ять для правої (15%)
          x: [
      "-5%", "-7%", "-20%", "-22%", "-22%", 
      "5%", "7%", "20%", "22%", "22%"
    ],

          // 4. Ефект стискання під час вказівки/кліку
          scale: [1, 0.97, 0.97, 0.97, 0.97, 1, 0.97, 0.97, 0.97, 0.97],

          // 5. Поворот: нахил вліво для лівої сторони, вправо — для правої
          rotate: [-10, -10, -18, -20, -20, -10, -10, -18, -20, -20],

          // 6. Відзеркалення іконки: перша половина циклу (1), друга (-1)
          scaleX: [1, 1, 1, 1, 1, -1, -1, -1, -1, -1],
        }}
        transition={{
          duration: 2.5, 
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.1, 0.3, 0.4, 0.5, 0.53, 0.6, 0.8, 0.9, 1],
        }}
        className="absolute left-1/2 bottom-10 -translate-x-1/2"
      >
        <CursorHand size={95} />
      </motion.div>
    </div>
  );
};
