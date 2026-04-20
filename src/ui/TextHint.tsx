import { motion } from "framer-motion";
import { CursorsHandsHint } from "./CursorsHands";

interface TextHintProps {
  children: React.ReactNode;
}
const TextHint: React.FC<TextHintProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 0.5,
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className="absolute left-[48%] top-[81%] -translate-x-1/2 -translate-y-1/2 text-[36px] text-center text-outline text-white z-10 flex flex-col items-center"
    >
      <div>{children?.toString().toUpperCase()}</div>
      
      {/* Виклик курсора */}
      <CursorsHandsHint />
      
    </motion.div>
  );
};

export default TextHint;
