import { useDecoreStore } from "../store/useDecorStore";
import { useTrainStore } from "../store/useTrainStore";
import { resourcesStore, type ResourceType } from "../store/resourceStore";
import { RESOURCE_ICONS } from "../utils/constants";
import { useResponsiveStore } from "../store/useResponsiveStore";
import { motion } from "framer-motion";
import { CursorsHandsToLeft } from "./CursorsHands";
import check from "../assets/icons/mark_check.png";

const RequirementCard = ({
  icon,
  isReady,
  title,
  isMobile,
}: {
  icon: string;
  isReady: boolean;
  title: string;
  isMobile?: boolean;
}) => {
  const size = isMobile ? "w-[50px] h-[50px]" : "w-[64px] h-[64px]";
  const iconSize = isMobile ? "w-7 h-7" : "w-9 h-9";
  const fontSize = isMobile ? "text-[14px]" : "text-[18px]";
  const checkSize = isMobile ? "w-5 h-5" : "w-6 h-6";

  return (
    <div
      className={`
        relative ${size} rounded-[8px] border-2 border-[#222] 
        flex flex-col items-center justify-around overflow-hidden 
        select-none ring-inset ring-1 ring-white/50
        shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]
        ${isReady ? "bg-[#150930]" : "bg-gray-600"}
      `}
    >
      <div className=" flex flex-col items-center justify-center w-full pt-1">
        <img
          src={icon}
          alt={title}
          className={`${iconSize} object-contain drop-shadow-md translate-y-1`}
        />
      </div>

      <span className={`${fontSize} text-board leading-none translate-y-0`}>
        {isReady ? <img src={check} alt="Ready" className={checkSize} /> : "✘"}
      </span>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const buttonVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.6,
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
};

export const BuildRailwayUI = () => {
  const railwayBuilt = useDecoreStore((s) => s.railwayBuilt);
  const unlockRailway = useDecoreStore((s) => s.unlockRailway);
  const setCanMoveTrain = useTrainStore((s) => s.setCanMoveTrain);
  const canMoveTrain = useTrainStore((s) => s.canMoveTrain);
  const currentDistance = useTrainStore((s) => s.currentDistance);
  const resources = resourcesStore();
  const canAfford = resourcesStore((s) => s.canAfford);
  const { isMobile } = useResponsiveStore();

  const TARGET_DISTANCE = 290;
  const DISTANCE_THRESHOLD = 5;
  const isAtTargetDistance = Math.abs(currentDistance - TARGET_DISTANCE) <= DISTANCE_THRESHOLD;

  if (railwayBuilt || canMoveTrain || !isAtTargetDistance) return null;

  const price = { hospital: 15, police: 20, plane: 5 };
  const isEverythingReady = canAfford(price);

  const handleBuild = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEverythingReady) return;
    unlockRailway();
    
    setTimeout(() => {
      setCanMoveTrain(true);
    }, 300);
  };

  const top = isMobile ? "top-[35%]" : "top-[40%]";
  const gap = isMobile ? "gap-4" : "gap-6";
  const buttonMinWidth = isMobile ? "min-w-[140px]" : "min-w-[170px]";
  const buttonPadding = isMobile ? "px-4 py-4 text-2xl" : "px-6 py-5 text-3xl";

  return (
    <>
      <motion.div
        onPointerDown={(e) => e.stopPropagation()}
        className={`
          absolute ${top} left-1/2 -translate-x-1/2 -translate-y-1/2
          flex flex-col items-center ${gap} z-[40] pointer-events-auto 
        `}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          variants={containerVariants}
          className="flex gap-4 bg-[#164376] rounded-2xl border-1 ring-inset ring-1 ring-white/50 shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]"
          style={{ padding: "12px" }}
        >
          {Object.entries(price).map(([type, amount]) => {
            const resType = type as ResourceType;

            return (
              <motion.div key={resType} variants={itemVariants}>
                <RequirementCard
                  icon={RESOURCE_ICONS[resType]}
                  title={resType}
                  isReady={(resources[resType] as number) >= (amount as number)}
                  isMobile={isMobile}
                />
              </motion.div>
            );
          })}
        </motion.div>
        <motion.button
          variants={buttonVariants}
          onClick={handleBuild}
          onPointerDown={(e) => e.stopPropagation()}
          className={`
            ${buttonMinWidth} ${buttonPadding} text-board uppercase
            tracking-tighter rounded-[10px]
            bg-gradient-to-b from-[#FFD147] via-[#F58200] to-[#D46B00]
            
            active:translate-y-[6px]
            active:shadow-[0_2px_0_#944a00,inset_0_1px_0_rgba(255,255,255,0.3)]
            transition-all duration-75 select-none
            flex flex-col items-center
            ${
              !isEverythingReady
                ? "opacity-50 grayscale-[0.5] cursor-not-allowed"
                : ""
            } 
          `}
          style={{
            boxShadow: "inset 0 0 0 1.2px #ffffff",
            border: "1.5px solid #000000",
            padding: "8px 1px 8px 1px",
          }}
        >
          <span>BUILD</span>
        </motion.button>
      </motion.div>
      {isEverythingReady && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}>
          <CursorsHandsToLeft className="absolute left-[54%] bottom-[42.5%] pointer-events-none" />
        </motion.div>
      )}
    </>
  );
};