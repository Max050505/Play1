// import { useEffect, useRef } from "react";
// import { useTrainStore } from "../store/useTrainStore";

// export const useTrainController = (
//   isMovingRef: React.MutableRefObject<boolean>,
//   canMoveRef: React.MutableRefObject<boolean> // Додаємо реф-дозвіл
// ) => {
//   const setIsUserPressing = useTrainStore((state) => state.setIsUserPressing);
//   const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// useEffect(() => {
//     const handleDown = () => {
//       if (canMoveRef.current) {
//         isMovingRef.current = true;
//         pressTimeoutRef.current = setTimeout(() => {
//           setIsUserPressing(true);
//         }, 100);
// // Тиснемо
//       }
//     };

//     const handleUp = () => {
//       isMovingRef.current = false;
//       if (pressTimeoutRef.current) {
//         clearTimeout(pressTimeoutRef.current);
//         pressTimeoutRef.current = null;
//       }
//       setIsUserPressing(false); 
//     };

//     window.addEventListener("pointerdown", handleDown);
//     window.addEventListener("pointerup", handleUp);

//     return () => {
//       window.removeEventListener("pointerdown", handleDown);
//       window.removeEventListener("pointerup", handleUp);
//     };
//   }, [isMovingRef, canMoveRef, setIsUserPressing]);
// };
// ;