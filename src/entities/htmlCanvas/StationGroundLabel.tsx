import { useRef } from "react";
import { Text, Plane } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";


const BOARD_WIDTH = 15;
const BOARD_HEIGHT = 5;
const CORNER_LENGTH = 2.5;
const CORNER_THICKNESS = 0.25;
const ANIM_SPEED = 2.5;
const ANIM_DISTANCE = 0.4; 

export const StationGroundLabel = ({
  position,
  rotation,
  name = "Станція 3",
}: any) => {

  const tlRef = useRef<THREE.Group>(null!);
  const trRef = useRef<THREE.Group>(null!);
  const blRef = useRef<THREE.Group>(null!);
  const brRef = useRef<THREE.Group>(null!);

  const baseOffset = {
    x: BOARD_WIDTH / 2 + 0.1,
    y: BOARD_HEIGHT / 2 + 0.1,
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    const offset = Math.sin(time * ANIM_SPEED) * ANIM_DISTANCE;


    tlRef.current.position.set(-baseOffset.x - offset, baseOffset.y + offset, 0);

    trRef.current.position.set(baseOffset.x + offset, baseOffset.y + offset, 0);

    blRef.current.position.set(-baseOffset.x - offset, -baseOffset.y - offset, 0);

    brRef.current.position.set(baseOffset.x + offset, -baseOffset.y - offset, 0);
  });

  if (!position) return null;

  return (
    <group position={position} rotation={rotation}>
      <group rotation={[-Math.PI / 2, 0, Math.PI ]} position={[0, 0.05, 0]}>
        
        <Text
          fontSize={2.8}
          color="#eceee9"
          font="/fonts/LilitaOne-Regular.ttf"
          anchorX="center"
          anchorY="middle"
        >
          {name.toUpperCase()}
        </Text>

        <Plane args={[BOARD_WIDTH, BOARD_HEIGHT]} position={[0, 0, -0.01]}>
          <meshBasicMaterial color="#8c9085" transparent opacity={0.3} depthWrite={false} />
        </Plane>

        {/* Кути з рефами */}
        <CornerBracket ref={tlRef} rotation={[0, 0, 0]} />
        <CornerBracket ref={trRef} rotation={[0, 0, -Math.PI / 2]} />
        <CornerBracket ref={blRef} rotation={[0, 0, Math.PI / 2]} />
        <CornerBracket ref={brRef} rotation={[0, 0, Math.PI]} />
      </group>
    </group>
  );
};


import { forwardRef } from "react";

const CornerBracket = forwardRef<THREE.Group, { rotation: [number, number, number] }>(
  ({ rotation }, ref) => (
    <group ref={ref} rotation={rotation}>
      <Plane 
        args={[CORNER_LENGTH, CORNER_THICKNESS]} 
        position={[CORNER_LENGTH / 2 - CORNER_THICKNESS / 2, 0, 0.01]}
      >
        <meshBasicMaterial color="white" />
      </Plane>
      <Plane 
        args={[CORNER_THICKNESS, CORNER_LENGTH]} 
        position={[0, -CORNER_LENGTH / 2 + CORNER_THICKNESS / 2, 0.01]}
      >
        <meshBasicMaterial color="white" />
      </Plane>
    </group>
  )
);