import { useFBX, useTexture, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import UpgradeStationTextureUrl from "../assets/textures/StationUpgrade.png";
import trainTextureUrl from "../assets/textures/Train_texture.png";
import MainTexture from "../assets/textures/Main_texture.png";
import GrassTextureUrl from "../assets/textures/Grass.png";
import modelsProp from "../assets/models/upgradeSign.fbx";
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

  const fbxProp = useFBX(modelsProp);
  const fbxTrain = useFBX(modelsTrain);

  const [mainTexture,UpgradeStationTexture, trainTexture] = useTexture([
    MainTexture,
    UpgradeStationTextureUrl,

    trainTextureUrl,
  ]);

  return useMemo(() => {
    if (!fbxProp || !fbxTrain || !mainTexture || !UpgradeStationTexture || !trainTexture) return null;

    UpgradeStationTexture.flipY = true;
    UpgradeStationTexture.colorSpace = THREE.SRGBColorSpace;


    trainTexture.colorSpace = THREE.SRGBColorSpace;

    const UpgradeStationMaterial = new THREE.MeshStandardMaterial({
      map: UpgradeStationTexture,
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



    return {
      Station_upgrade: setupModel(fbxProp, "Upgrade_1", UpgradeStationMaterial),

      trainModel: setupModel(fbxTrain, "Locomotive_EU", trainMaterial),
      wagonModel: setupModel(fbxTrain, "Carriage_EU", trainMaterial),
      UpgradeStationMaterial,
      mainTexture,
      trainTexture,
    };
  }, [fbxProp, fbxTrain, mainTexture, trainTexture]);
};

export const useGLTFModel = (modelUrl: string, textureUrl?: string) => {
  const { nodes, scene,  } = useGLTF(modelUrl) as any;
  const texture = textureUrl ? useTexture(textureUrl) : null;

  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
    }
  }, [texture]);

  const material = useMemo(() => {
    if (!texture) return null;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2,
    });
  }, [texture]);

  const getMesh = (name: string) => {
  const original = scene.getObjectByName(name);
  if (!original) return null;

  const clone = original.clone(true);

  clone.traverse((child: any) => {
    if (!child.isMesh) return;

    // material
    if (material) {
      child.material = material;
    }

    child.castShadow = true;
    child.receiveShadow = true;
  });

  return clone;
};

  return useMemo(() => {
    if (!nodes) return null;

    return {

      nodes,
      scene,
      material,
      getMesh,
      
    };
  }, [nodes, scene, material]);
};

export const useGLTFModelGrass = (modelUrl: string) => {
  const { nodes, scene, getAllMeshes } = useGLTF(modelUrl) as any;
  const texture = useTexture(GrassTextureUrl);

  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    
    }
  }, [texture]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2,
    });
  }, [texture]);

  const getMesh = (name: string) => {
    const node = nodes?.[name];
    if (!node) return null;

    const mesh = node.clone(true);
    mesh.traverse((child: any) => {
      if (child.isMesh) {
        if (material) child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return mesh;
  };

  return useMemo(() => {
    if (!nodes) return null;

    return {
      nodes,
      scene,
      material,
      getMesh,
      getAllMeshes
    };
  }, [nodes, scene, material]);
};