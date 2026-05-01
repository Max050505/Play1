import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import Plane from "../entities/Plane";
import { Suspense, useEffect } from "react";
import { useTrainStore } from "../store/useTrainStore";

import spline1 from "../assets/data/TrackSpline_1.json";
import spline2 from "../assets/data/TrackSpline_2.json";
import spline3 from "../assets/data/TrackSpline_3.json";
import spline4 from "../assets/data/TrackSpline_4.json";

import * as THREE from "three"
import {FollowLight} from "./LightAndShadow";
import { useTexture } from "@react-three/drei";
import starImg from "../assets/textures/fx_star_yellow.png";
import { useResponsiveStore } from "../store/useResponsiveStore";
import { parseSpline, offsetSpline} from "../utils/splineUtils";

const Scene = () => {
useTexture.preload(starImg);
  const setSamples = useTrainStore((s) => s.setSamples);

  useEffect(() => {
    const data = [
      offsetSpline(parseSpline(spline1), [0, 0, 0]),
      offsetSpline(parseSpline(spline2), [0, 0, 0]),
      offsetSpline(parseSpline(spline3), [0, 0, 0]),
      offsetSpline(parseSpline(spline4), [0, 0, 0]),
    ];
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
