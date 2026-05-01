import { useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useTrainStore } from "../store/useTrainStore";
import { useStationsStore } from "../store/useStationStore";
import { useDecoreStore } from "../store/useDecorStore";
import { resourcesStore } from "../store/resourceStore";
import {
  useModelAssets,
  useGLTFModel,
  useGLTFModelGrass,
} from "../hooks/useModelAssets";
import StationInstance from "./Stations";
import { WORLD_BASE, WORLD_DECOR, STATIONS_CONFIG } from "../utils/constants";
import PlayerTrain from "./PlayerTrain";
import Loop from "../core/Loop";
import Passengers from "./Passengers";
import { DecorItem } from "./DecorItem";
import { StationGroundLabel } from "./htmlCanvas/StationGroundLabel";
import type { TrainViewHandle } from "./TrainView";
import modelUrl from "../assets/models/location_1.glb";
import MainTexture from "../assets/textures/Main_texture.png";
import { AnimatedBuildingParts } from "./animation/AnimatedBuildingParts";
import { EngineManager } from "../engines/EngineManager";
import { TrainPhysicsEngine } from "../engines/TrainPhysicsEngine";
import { WagonEngine } from "../engines/WagonEngine";
import { CameraEngine } from "../engines/CameraEngine";
import { PassengerManagerEngine } from "../engines/PassengerManagerEngine";
import { TrainStateEngine } from "../engines/TrainStateEngine";
import { passengerEngine } from "../engines/PassengerEngine";
const Plane = () => {
  const assets = useModelAssets();
  const assetsGLTF = useGLTFModel(modelUrl, MainTexture);
  const assetsGLTFGrass = useGLTFModelGrass(modelUrl);
  const { camera, scene, size } = useThree();

  const wagonsFromStore = useTrainStore((s) => s.wagons);
  const setRuntimeDistanceRef = useTrainStore((s) => s.setRuntimeDistanceRef);
  const wagonCount = wagonsFromStore.length;

  const unlockedDecor = useDecoreStore((s) => s.unlockedDecor);

  const trainViewRef = useRef<TrainViewHandle>(null);
  const sharedDistanceRef = useRef(0);
  const sharedSpeedRef = useRef(0);
  const isMovingRef = useRef(false);
  const pressTimeoutRef = useRef<number | null>(null);

  const canMoveTrain = useTrainStore((s) => s.canMoveTrain);
  const setIsUserPressing = useTrainStore((s) => s.setIsUserPressing);

  useEffect(() => {
    const handleDown = () => {
      if (!canMoveTrain) return;
      isMovingRef.current = true;
      pressTimeoutRef.current = window.setTimeout(() => {
        setIsUserPressing(true);
      }, 100);
    };

    const handleUp = () => {
      isMovingRef.current = false;
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
        pressTimeoutRef.current = null;
      }
      setIsUserPressing(false);
    };

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
      }
    };
  }, [canMoveTrain, setIsUserPressing]);

  useEffect(() => {
    const state = useTrainStore.getState();
    const samples = state.samples || [];
    const activeSplineIndex = state.activeSplineIndex || 0;
    const splineSamples = samples[activeSplineIndex] || [];
    const totalLength = splineSamples[splineSamples.length - 1]?.distance ?? 0;

    if (totalLength <= 0) return;

    // Ensure distanceRef is always positive
    if (sharedDistanceRef.current < 0) {
      sharedDistanceRef.current = ((sharedDistanceRef.current % totalLength) + totalLength) % totalLength;
    } else if (sharedDistanceRef.current === 0) {
      sharedDistanceRef.current = 0;
    }
  }, []);

  const getWagonPosRef = useRef<(idx: number, baseDistance?: number, splineIdx?: number) => THREE.Vector3 | null>(
    () => null,
  );
  const lastWagonCount = useRef(wagonCount);
  const pyramidRefs = useRef<Map<string, unknown>>(new Map());
  const partRefs = useRef<Map<string, Map<string, unknown>>>(new Map());
  const engineManagerRef = useRef<EngineManager | null>(null);

  useEffect(() => {
    setRuntimeDistanceRef(sharedDistanceRef);
    return () => setRuntimeDistanceRef(null);
  }, [setRuntimeDistanceRef]);

  useEffect(() => {
    if (wagonCount > lastWagonCount.current) {
      const newWagonIndex = wagonCount;
      trainViewRef.current?.spawnEffect?.(newWagonIndex);
    }
    lastWagonCount.current = wagonCount;
  }, [wagonCount]);

  const setWagonPosGetter = useCallback(
    (fn: (idx: number, baseDistance?: number, splineIdx?: number) => THREE.Vector3 | null) => {
      getWagonPosRef.current = fn;
    },
    [],
  );

  // Initialize engine system
  useEffect(() => {
    if (!assets || !assetsGLTF) return;

    const context = {
      getTrainStore: () => useTrainStore.getState(),
      setTrainStore: (partial: any) => useTrainStore.setState(partial),
      getStationsStore: () => useStationsStore.getState(),
      setStationsStore: (partial: any) => useStationsStore.setState(partial),
      getResourcesStore: () => resourcesStore.getState(),
      getDecorStore: () => useDecoreStore.getState(),
      distanceRef: sharedDistanceRef,
      currentSpeedRef: sharedSpeedRef,
      samples: useTrainStore.getState().samples || [],
      getEngine: (name: string) => engineManagerRef.current?.getEngine(name),
      camera,
      scene,
      size,
      trainViewRef,
      partRefs,
      getWagonPos: (idx: number, baseDistance?: number, splineIdx?: number) => {
        if (typeof getWagonPosRef.current !== "function") return null;
        return getWagonPosRef.current(idx, baseDistance, splineIdx);
      },
      isMovingRef,
    };

    const manager = new EngineManager(context);

    // Register engines in priority order
    manager.register(new TrainPhysicsEngine());
    manager.register(new WagonEngine());
    manager.register(new TrainStateEngine());
    manager.register(new PassengerManagerEngine());
    manager.register(passengerEngine);
    manager.register(new CameraEngine());

    engineManagerRef.current = manager;

    return () => {
      manager.dispose();
      engineManagerRef.current = null;
    };
  }, [assets, assetsGLTF, camera, scene]);

  const prebuiltStations = useMemo(() => {
    const map: Record<string, THREE.Group> = {};
    STATIONS_CONFIG.forEach((config) => {
      if (config.parts && assetsGLTF) {
        const group = new THREE.Group();
        config.parts.forEach((partName) => {
          const mesh = assetsGLTF.getMesh(partName);
          if (mesh) group.add(mesh.clone());
        });
        if (group.children.length > 0) map[config.id] = group;
      }
    });
    return map;
  }, [assetsGLTF]);

  if (!assets || !assetsGLTF) return null;

  return (
    <group>
      <Passengers />

      {assetsGLTFGrass && (
        <group position={[-4, 0, 7]}>
          <primitive
            object={assetsGLTFGrass.getMesh("Earth_001")}
            rotation={[0, Math.PI, 0]}
            position={[0, 0.2, 0]}
          />
        </group>
      )}

      {[...WORLD_BASE, ...WORLD_DECOR].map((item) => (
        <DecorItem
          key={item.id}
          item={item}
          ref={(el: unknown) => {
            if (el) pyramidRefs.current.set(item.id, el);
          }}
          assets={assetsGLTF}
          unlockedDecor={unlockedDecor}
          partRefs={partRefs}
        />
      ))}


      {/* RENDER - Simple O(1) lookup */}
      {STATIONS_CONFIG.map((s) => {
        const model = prebuiltStations[s.id];
        const isUnlocked = s.isDefault || unlockedDecor.includes(s.id);

        return (
          <group key={s.id}>
            {!isUnlocked && (
              <StationGroundLabel
                key={`label-${s.id}`}
                position={s.pos}
                rotation={s.rot}
                name={s.name || "STATION"}
              />
            )}

            {/* Render station model if unlocked */}
            {isUnlocked && model ? (
              <StationInstance
                data={{
                  id: s.id,
                  name: s.name,
                  pos: s.pos,
                  rot: s.rot,
                }}
                model={model.clone() as THREE.Group}
              />
            ) : null}
          </group>
        );
      })}

      {assets.trainModel && assets.wagonModel && (
        <>
          <Loop
            engineManagerRef={engineManagerRef}
          />
          <PlayerTrain
            ref={trainViewRef}
            distanceRef={sharedDistanceRef}
            currentSpeed={sharedSpeedRef}
            models={{
              locomotive: assets.trainModel as THREE.Group,
              wagon: assets.wagonModel as THREE.Group,
              tail: assets.trainModel.clone() as THREE.Group,
            }}
            onRegistryPosGetter={setWagonPosGetter}
          />
        </>
      )}
    </group>
  );
};

export default Plane;
