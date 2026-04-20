import logo from "../assets/icons/logo_2.png";
import ray from "../assets/icons/rays.png";
import { motion } from "framer-motion";
const FinalScreen = () => {
  const START_DELAY = 3;
  const LOGO_APPEAR_TIME = START_DELAY + 0.2;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: START_DELAY, duration: 0.8 }}
        className="absolute inset-0 bg-black/85 z-0"
      />

      <div className="relative flex items-center justify-center z-10">
        <motion.img
          src={ray}
          alt="Rays"
          className="absolute w-132 h-132 object-contain will-change-transform opacity-100 "
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: -360 }}
          style={{ transform: "translateZ(0)" }}
          transition={{
            scale: { delay: LOGO_APPEAR_TIME, duration: 0.5, ease: "easeOut" },
            rotate: { repeat: Infinity, duration: 9, ease: "linear" },
          }}
        />

        <motion.img
          src={logo}
          alt="Logo"
          className="relative w-80 h-80 object-contain z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: LOGO_APPEAR_TIME,
            duration: 0.5,
            ease: "backOut",
          }}
        />
      </div>

      <motion.div
        className="absolute bottom-42"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: START_DELAY + 0.8,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        <motion.button
          animate={{ scale: [1, 1.12, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: START_DELAY + 1.4,
          }}
          className="relative z-20 text-outline uppercase text-[40px] font-bold tracking-[0.03em]"
          style={
            {
              display: "inline-block",
              cursor: "pointer",
              borderRadius: "15px",
              padding: "21px 37px",
              backgroundImage:
                "linear-gradient(to top, #F58200 10%, #FFD147 100%)",
              boxShadow: "inset 0 0 0 1.2px #ffffff",
              border: "2px solid #000000",
              color: "#FFFFFF",
              WebkitTextStroke: "2px #000000",
              paintOrder: "stroke fill",
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
              transform: "translateZ(0) scale(1.001)",
            } as React.CSSProperties
          }
        >
          Download
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FinalScreen;
