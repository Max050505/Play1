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
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 }
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
  onSelect: (index: number) => void; // Приймає індекс кнопки
  title?: string;
}

const TrackSwitch = ({ 
  isOpen, 
  leftOption, 
  rightOption, 
  onSelect, 
  title = "Оберіть напрямок" 
}: TrackSwitchProps) => {
  const { isMobile } = useResponsiveStore();

  const cardWidth = isMobile ? "w-[120px]" : "w-[150px]";
  const cardHeight = isMobile ? "h-[90px]" : "h-[110px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 pointer-events-none z-[1200] flex flex-col items-center justify-center">
          <motion.h3 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-bold text-xl mb-6 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
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
            <SwitchButton 
              option={leftOption} 
              side="ПЕРЕЙТИ"
              width={cardWidth}
              height={cardHeight}
              onClick={() => onSelect(0)}
            />

            <SwitchButton 
              option={rightOption} 
              side="ПРЯМО"
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

const SwitchButton = ({ option, side, width, height, onClick }: any) => {
  return (
    <motion.div
      variants={optionVariants}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onPointerUp={onClick}
      className={`
        relative ${width} ${height} rounded-[16px] border-2 border-white/20 
        flex flex-col items-center justify-center cursor-pointer
        shadow-[0_10px_25px_rgba(0,0,0,0.4)]
        overflow-hidden select-none
      `}
      style={{ backgroundColor: option.color || "#0081cf" }}
    >
      <span className="text-white/60 font-bold text-[10px] tracking-widest mb-1 uppercase">
        {side}
      </span>
      <span className="text-white font-black text-center text-sm px-2 leading-tight">
        {option.label}
      </span>
      
      {/* Глянцевий ефект */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
    </motion.div>
  );
};

export { TrackSwitch };