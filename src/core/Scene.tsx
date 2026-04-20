import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import Plane from "../entities/Plane";
import { Suspense, useEffect } from "react";
import { useTrainStore } from "../store/useTrainStore";
import { parseSpline } from "../utils/splineUtils";
import splineData from "../assets/data/spline.json";
import * as THREE from "three"
import {FollowLight} from "./LightAndShadow";
import { useTexture } from "@react-three/drei";
import starImg from "../assets/textures/fx_star_yellow.png";
import { useResponsiveStore } from "../store/useResponsiveStore";

const Scene = () => {
useTexture.preload(starImg);
  const setSamples = useTrainStore((s) => s.setSamples);

  useEffect(() => {
    const data = parseSpline(splineData);
    setSamples(data);
  }, []);

  const { isMobile, isTablet } = useResponsiveStore();
  const fov = isMobile ? 50 : isTablet ? 45 : 40;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{position:[50, 40, 20], fov: fov, near: 0.1, far: 1000 }}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <FollowLight/>
        <Preload all />
        <Plane />
      </Suspense>
    </Canvas>
  );
};

export default Scene;
