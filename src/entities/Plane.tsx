import { useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useDecoreStore } from "../store/useDecorStore";
import { useTrainStore } from "../store/useTrainStore";
import { usePassenger } from "../hooks/usePassengers";
import { useModelAssets, useGLTFModel, useGLTFModelGrass } from "../hooks/useModelAssets";
import StationInstance from "./Stations";
import {
  WORLD_BASE,
  WORLD_DECOR,
  STATIONS_MAP,
  STATIONS_DATA,
} from "../utils/constants";
import PlayerTrain from "./PlayerTrain";
import Loop from "../core/Loop";
import Passengers from "./Passengers";
import PassengersManager from "../hooks/usePassengersManager";
import { DecorItem } from "./DecorItem";
import { StationGroundLabel } from "./htmlCanvas/StationGroundLabel";
import type { TrainViewHandle } from "./TrainView";
import modelUrl from "../assets/models/location_1.glb";
import MainTexture from "../assets/textures/Main_texture.png";
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
  const getWagonPosRef = useRef<(idx: number) => THREE.Vector3>(
    () => new THREE.Vector3(0, 0, 0),
  );
  const lastWagonCount = useRef(wagonCount);
  const pyramidRefs = useRef<Map<string, unknown>>(new Map());

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
    (fn: (idx: number) => THREE.Vector3) => {
      getWagonPosRef.current = fn;
    },
    [],
  );

  const stableGetWagonPos = useCallback((idx: number) => {
    if (typeof getWagonPosRef.current !== "function")
      return new THREE.Vector3(0, 0, 0);
    return getWagonPosRef.current(idx);
  }, []);

  const handleTriggerPulse = useCallback((idx: number) => {
    trainViewRef.current?.triggerWagonPulse(idx);
  }, []);

  const triggerPyramidPulse = useCallback((id?: string) => {
    if (!id) return;
    const pyramid = pyramidRefs.current.get(id);
    if (pyramid) {
      (pyramid as { triggerPulsePyramid: () => void }).triggerPulsePyramid();
    }
  }, []);

  if (!assets || !assetsGLTF) return null;


  return (
    <group>
      <PassengersManager
        system={passengerSystem}
        getWagonPos={stableGetWagonPos}
        wagonCount={wagonCount}
        onTriggerWagonPulse={handleTriggerPulse}
        triggerPyramidPulse={triggerPyramidPulse}
      />
      <Passengers system={passengerSystem} />


            {assetsGLTFGrass && <primitive object={assetsGLTFGrass.getMesh("Earth_001")} rotation={[0, Math.PI, 0]} position={[0, 0, 0]} />}

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

      {STATIONS_MAP.map((s) => {
        const model = assets[s.asset as keyof typeof assets];
        const data =
          s.dataIndex !== undefined ? STATIONS_DATA[s.dataIndex] : null;
        const isUnlocked = s.isDefault || unlockedDecor.includes(s.id);

        return (
          <group key={s.id}>
            {!isUnlocked && data && (
              <StationGroundLabel
                key={`label-${s.id}`}
                position={s.pos}
                rotation={s.rot}
                name={data.name || "STATION"}
              />
            )}

            {isUnlocked && model && data ? (
              <StationInstance
                data={{
                  ...data,
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
            system={passengerSystem}
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

