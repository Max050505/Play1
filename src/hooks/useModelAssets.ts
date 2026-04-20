import { useFBX, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import mainTextureUrl from "../assets/textures/Main_texture.png";
import sandTextureUrl from "../assets/textures/Sand.jpg";
import trainTextureUrl from "../assets/textures/Train_texture.png";
import modelsPath from "../assets/models/desert_map.fbx";
import modelsProp from "../assets/models/desert_prop.fbx";
import modelsTrain from "../assets/models/models.fbx";

const setupModel = (
  source: THREE.Group,
  name: string,
  material: THREE.Material,
  shadow = true,
): THREE.Object3D | null => {
  const original = source.getObjectByName(name);
  if (!original) return null;

  const obj = original.clone();
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = material;
      child.castShadow = shadow;
      child.receiveShadow = shadow;
    }
  });

  return obj;
};

export const useModelAssets = () => {
  const fbx = useFBX(modelsPath);
  const fbxProp = useFBX(modelsProp);
  const fbxTrain = useFBX(modelsTrain);

  const [mainTexture, sandTexture, trainTexture] = useTexture([
    mainTextureUrl,
    sandTextureUrl,
    trainTextureUrl,
  ]);

  return useMemo(() => {
    if (!fbx || !fbxProp || !fbxTrain || !mainTexture) return null;

    mainTexture.flipY = true;
    mainTexture.colorSpace = THREE.SRGBColorSpace;

    sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(10, 10);

    trainTexture.colorSpace = THREE.SRGBColorSpace;

    const mainMaterial = new THREE.MeshStandardMaterial({
      map: mainTexture,
      side: THREE.DoubleSide,
    });

    const trainMaterial = new THREE.MeshStandardMaterial({
      map: trainTexture,
      roughness: 0.2,
      metalness: 0.8,
      emissiveMap: trainTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.1,
    });

    const stationV2 = setupModel(fbx, "DLine1_V2_1", mainMaterial);
    const stationV1 = setupModel(fbx, "DLine1_V1", mainMaterial);

    return {
      Station_1: stationV2,
      Station_2: stationV2,
      Station_3: stationV1,
      Station_4: stationV1,
      Station_upgrade: setupModel(fbxProp, "Upgrade_1", mainMaterial),
      loopA: setupModel(fbx, "Loop_A", mainMaterial),
      Pyramid_1: setupModel(fbx, "Pyramid_2_2", mainMaterial),
      Pyramid_2: setupModel(fbx, "Pyramid_2_2_1", mainMaterial),
      Pyramid_3: setupModel(fbx, "Pyramid_3_1", mainMaterial),
      Pyramid_4: setupModel(fbx, "Pyramid_3_2", mainMaterial),
      Foundation_7: setupModel(fbx, "Foundation_7", mainMaterial),
      Foundation_8: setupModel(fbx, "Foundation_8", mainMaterial),
      Foundation_9: setupModel(fbx, "Foundation_9", mainMaterial),
      Foundation_10: setupModel(fbx, "Foundation_10", mainMaterial),
      trainModel: setupModel(fbxTrain, "Locomotive_EU", trainMaterial),
      wagonModel: setupModel(fbxTrain, "Carriage_EU", trainMaterial),
      mainTexture,
      sandTexture,
      trainTexture,
    };
  }, [fbx, fbxProp, fbxTrain, mainTexture, sandTexture, trainTexture]);
};
