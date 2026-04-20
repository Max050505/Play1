import { motion } from "framer-motion";
import { resourcesStore } from "../../store/resourceStore";
import { RESOURCE_ICONS } from "../../utils/constants";
import { type ResourceType } from "../../store/resourceStore";
import { REWARD_CONFIG } from "../../utils/config";

export const ResourceAnimation = ({ id, x, y, type }: { id: string; x: number; y: number; type: ResourceType }) => {
  const store = resourcesStore();

  const isCoin = type === "coin";


  return (
    <motion.img
      src={RESOURCE_ICONS[type]}
      className="fixed w-9 h-9 z-1000 pointer-events-none object-contain"
      initial={{ x, y, scale: 0, opacity: 0 }}
      animate={{ 

        x: [x, x + (isCoin ? -40 : 40), window.innerWidth - 60],
        y: [y, y - 80, 40 + (isCoin ? 0 : 50)], 
        scale: [0, 1, 0.7],
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: 1.1, // Трохи збільшили загальний час
        times: [0, 0.3, 1], // 0-0.3 (зависання), 0.3-1 (політ)
        ease: [
            "backOut", // Пружинистий виліт вгору
            "circIn"   // Стрімке прискорення до гаманця
        ],
        delay: isCoin ? 0 : 0.1 
      }}
      onAnimationComplete={() => {
        const amount = REWARD_CONFIG[type] || 1;
store.addResource(type, amount);
        store.removeFx(id);
      }}
    />
  );
};