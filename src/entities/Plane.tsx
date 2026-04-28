import { useRef, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useDecoreStore } from "../store/useDecorStore";
import { useTrainStore } from "../store/useTrainStore";
import { usePassenger } from "../hooks/usePassengers";
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
import PassengersManager from "../hooks/usePassengersManager";
import { DecorItem } from "./DecorItem";
import { StationGroundLabel } from "./htmlCanvas/StationGroundLabel";
import type { TrainViewHandle } from "./TrainView";
import modelUrl from "../assets/models/location_1.glb";
import MainTexture from "../assets/textures/Main_texture.png";
import { AnimatedBuildingParts } from "./animation/AnimatedBuildingParts";
const Plane = () => {
  const assets = useModelAssets();
  const assetsGLTF = useGLTFModel(modelUrl, MainTexture);
  const assetsGLTFGrass = useGLTFModelGrass(modelUrl);

  const passengerSystem = usePassenger();
  const wagonsFromStore = useTrainStore((s) => s.wagons);
  const setRuntimeDistanceRef = useTrainStore((s) => s.setRuntimeDistanceRef);
  const wagonCount = wagonsFromStore.length;

  const unlockedDecor = useDecoreStore((s) => s.unlockedDecor);

  const trainViewRef = useRef<TrainViewHandle>(null);
  const sharedDistanceRef = useRef(0);
  const sharedSpeedRef = useRef(0);
  const getWagonPosRef = useRef<(idx: number, baseDistance?: number, splineIdx?: number) => THREE.Vector3 | null>(
    () => null,
  );
  const lastWagonCount = useRef(wagonCount);
  const pyramidRefs = useRef<Map<string, unknown>>(new Map());
  const partRefs = useRef<Map<string, Map<string, unknown>>>(new Map());

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

  const stableGetWagonPos = useCallback((idx: number, baseDistance?: number, splineIdx?: number) => {
    if (typeof getWagonPosRef.current !== "function") return null;
    return getWagonPosRef.current(idx, baseDistance, splineIdx);
  }, []);

const handleTriggerPulse = useCallback((idx: number) => {
    trainViewRef.current?.triggerWagonPulse(idx);
  }, []);

  const triggerPyramidPulse = useCallback((partName?: string) => {
    if (!partName) return;

    for (const [, partsMap] of partRefs.current) {
      const partRef = partsMap.get(partName);
      if (partRef) {
        (partRef as { triggerPulsePyramid: () => void }).triggerPulsePyramid();
        return;
      }
    }
  }, []);

    if (!assets || !assetsGLTF) return null;

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

  // Get railwayBuilt state
  const railwayBuilt = useDecoreStore((s) => s.railwayBuilt);

  return (
    <group>
      <PassengersManager
        system={passengerSystem}
        getWagonPos={stableGetWagonPos}
        wagonCount={wagonCount}
        onTriggerWagonPulse={handleTriggerPulse}
        triggerPyramidPulse={triggerPyramidPulse}
        distanceRef={sharedDistanceRef}
      />
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
        />
      ))}

      {/* Animated buildings with animatedParts */}
      {[...WORLD_BASE, ...WORLD_DECOR].filter(item => (item as any).animatedParts).map((item) => {
        const building = item as any;
        const isUnlocked = building.isDefault || unlockedDecor.includes(building.id);
        return (
          <AnimatedBuildingParts
            key={building.id}
            parts={building.animatedParts}
            assets={assetsGLTF}
            partRefs={partRefs}
            position={building.animatedPos || building.pos}
            rotation={building.animatedRot || [0, 0, 0]}
            buildingId={building.id}
            isUnlocked={isUnlocked}
          />
        );
      })}

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
            distanceRef={sharedDistanceRef}
            currentSpeedRef={sharedSpeedRef}
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
