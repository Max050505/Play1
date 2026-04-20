import { motion, type HTMLMotionProps } from "framer-motion";
import { icons } from "../utils/constants";

interface CursorHandProps extends HTMLMotionProps<"div"> {
  iconIndex?: number;
  size?: number;
  imageClassName?: string;
}

const CursorHand = ({
  iconIndex = 0,
  size = 64,
  className = "",
  imageClassName = "",
  style,
  ...props
}: CursorHandProps) => {
  return (
<motion.div
className={className} 
      style={style}
        {...props}
      >
        <img
          src={icons[iconIndex]?.cursorHand}
          alt="Hand"
          style={{ width: size, height: "auto" }}
          className="select-none drop-shadow-lg"
        />
      </motion.div>
  );
};

export default CursorHand;
