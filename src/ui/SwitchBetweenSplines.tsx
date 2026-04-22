import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useResponsiveStore } from "../store/useResponsiveStore";


const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { staggerChildren: 0.1 } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const optionVariants: Variants = {
  hidden: { x: 0, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

interface SwitchOption {
  id: string;
  label: string;
  color?: string;
}

interface TrackSwitchProps {
  isOpen: boolean;
  leftOption: SwitchOption;
  rightOption: SwitchOption;
  onSelect: (optionIndex: number) => void;
  title?: string;
}

const TrackSwitch = ({ 
  isOpen, 
  leftOption, 
  rightOption, 
  onSelect, 
  title = "Choose Direction" 
}: TrackSwitchProps) => {
  const { isMobile } = useResponsiveStore();

  const cardWidth = isMobile ? "w-[120px]" : "w-[150px]";
  const cardHeight = isMobile ? "h-[90px]" : "h-[110px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 pointer-events-none z-[1200] flex flex-col items-center justify-center">
          {/* Заголовок */}
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white text-board mb-4 uppercase drop-shadow-md"
          >
            {title}
          </motion.h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex gap-6 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
{/* Ліва кнопка */}
            <SwitchButton 
              option={leftOption} 
              side="LEFT"
              width={cardWidth}
              height={cardHeight}
              onClick={() => onSelect(0)}
            />

            {/* Права кнопка */}
            <SwitchButton 
              option={rightOption} 
              side="RIGHT"
              width={cardWidth}
              height={cardHeight}
              onClick={() => onSelect(1)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Внутрішній допоміжний компонент для кнопки
const SwitchButton = ({ option, side, width, height, onClick }: { option: SwitchOption; side: string; width: string; height: string; onClick: () => void }) => {
  const color = option.color || "#0081cf";
  
  return (
    <motion.div
      variants={optionVariants}
      whileHover={{ scale: 1.05}}
      whileTap={{ scale: 0.95 }}
      onPointerUp={onClick}
      className={`
        relative ${width} ${height} rounded-[12px] border-2 border-[#222] 
        flex flex-col items-center justify-center cursor-pointer
        shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.3)]
        overflow-hidden select-none
      `}
      style={{ backgroundColor: color }}
    >
      <span className="text-white font-black text-[12px] opacity-70 mb-1">{side}</span>
      <span className="text-yellow-400 text-board uppercase text-center leading-tight px-2">
        {option.label}
      </span>
      
      {/* Світловий ефект зверху */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
    </motion.div>
  );
};

export { TrackSwitch };
export default TrackSwitch;