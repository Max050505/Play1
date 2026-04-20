import { useTrainStore } from "../store/useTrainStore";
import { resourcesStore } from "../store/resourceStore";
import { useStationsStore } from "../store/useStationStore";
import { useResponsiveStore } from "../store/useResponsiveStore";
import coinImg from "../assets/sprites/icon_coin.png";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: {
    y: 50,
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 18,
      mass: 0.8,
    },
  },
};

interface UpgradeCardProps {
  title: string;
  level: number;
  cost: number;
  canAfford: boolean;
  onUpgrade?: () => void;
  disabled?: boolean;
  color?: string;
  isMobile?: boolean;
}

const UpgradeCard = ({
  title,
  level,
  cost,
  canAfford,
  onUpgrade,
  disabled = false,
  color = "#0081cf",
  isMobile = false,
}: UpgradeCardProps) => {
  const cardWidth = isMobile ? "w-[70px]" : "w-[90px]";
  const cardHeight = isMobile ? "h-[80px]" : "h-[100px]";
  const titleSize = isMobile ? "text-[14px]" : "text-[18px]";
  const levelSize = isMobile ? "text-[10px]" : "text-[12px]";
  const costSize = isMobile ? "text-[16px]" : "text-[20px]";
  const iconSize = isMobile ? "w-4 h-4" : "w-5.5 h-5.5";

  return (
    <motion.div
      variants={cardVariants}
      className={`
        relative ${cardWidth} ${cardHeight} rounded-[8px] border-2 border-[#222] 
        flex flex-col items-center justify-between overflow-hidden 
        select-none ring-inset ring-1 ring-white/50 
        duration-100
        shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]
        ${disabled ? "bg-gray-600 grayscale" : ""}
        ${canAfford && !disabled ? "cursor-pointer active:scale-95 hover:brightness-110" : "cursor-default"}
      `}
      style={{ backgroundColor: !disabled ? color : undefined }}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (canAfford && !disabled && onUpgrade) {
          onUpgrade();
        }
      }}
    >
      <div
        className="flex-1 flex flex-col items-center justify-center w-full uppercase pt-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          className={`${titleSize} text-board leading-none`}
          style={{ color: "yellow" }}
        >
          {title}
        </span>
        <span className={`text-white font-black ${levelSize} mt-0.5 drop-shadow-[0_1.5px_0_rgba(0,0,0,0.8)]`}>
          LEVEL {level}
        </span>
      </div>

      <div className="w-full h-9 px-2.5 pb-2.5 flex items-end">
        <div
          className="
            w-full h-full bg-[#82d8e5] rounded-t-[20px]
            flex items-center justify-center gap-0.5
            shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]
          "
        >
          <span className={`${costSize} text-board flex items-center translate-y-0.5`}>
            {cost}
          </span>
          <img src={coinImg} alt="coin" className={`${iconSize} object-contain`} />
        </div>
      </div>
    </motion.div>
  );
};

const TrainShop = () => {
  const isOpen = useStationsStore((s) => s.isUpgradeMenuOpen);
  const coins = resourcesStore((s) => s.coin);
  const { addWagon, upgradeSpeed, wagons, speedLevel, isAnimating } =
    useTrainStore();
  const isBlocked = isAnimating;
  const { isMobile } = useResponsiveStore();

  const top = isMobile ? "top-[75%]" : "top-[80%]";
  const gap = isMobile ? "gap-[10px]" : "gap-[15px]";
  const padding = isMobile ? "p-3" : "p-5";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          onPointerDown={(e) => e.stopPropagation()}
          variants={containerVariants}
          initial="visible"
          animate="visible"
          exit="exit"
          className={`
            absolute ${top} left-1/2 -translate-x-1/2 -translate-y-1/2 
            flex ${gap} z-[1100] ${padding} pointer-events-auto
          `}
        >
          <UpgradeCard
            title="Seats"
            level={wagons.length}
            cost={50}
            onUpgrade={addWagon}
            canAfford={coins >= 50}
            color="#006096"
            disabled={wagons.length >= 5 || isBlocked}
            isMobile={isMobile}
          />

          <UpgradeCard
            title="Speed"
            level={speedLevel}
            cost={50}
            onUpgrade={upgradeSpeed}
            canAfford={coins >= 50}
            color="#006096"
            disabled={speedLevel >= 10 || isBlocked}
            isMobile={isMobile}
          />

          <UpgradeCard
            title="Income"
            level={1}
            cost={200}
            canAfford={false}
            onUpgrade={() => {}}
            color="#555"
            disabled={true}
            isMobile={isMobile}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrainShop;
