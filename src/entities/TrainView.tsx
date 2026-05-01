import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getPointAtDistance } from "../utils/splineUtils";
import { useTrainStore } from "../store/useTrainStore";
import { TRAIN_CONFIG } from "../utils/config";
import Wagon from "./Wagon";
import type { WagonHandle } from "./Wagon";
import { SpawnParticles } from "./animation/SpawnParticles";
import { TrainWaveEffect } from "./animation/TrainWaveEffect";
import { TrainWheelDust } from "./animation/TrainMoveSmoke";

const _lookAtTarget = new THREE.Vector3();

const wrapDistance = (value: number, total: number) =>
  ((value % total) + total) % total;

export interface TrainViewHandle {
  triggerFullTrainPulse: () => void;
  triggerWagonPulse: (index: number) => void;
  spawnEffect: (index: number) => void;
}

interface TrainViewProps {
  distanceRef: React.RefObject<number>;
  models: { locomotive: THREE.Group; wagon: THREE.Group; tail: THREE.Group };
  wagonCount: number;
  currentSpeed: React.RefObject<number>;
}

const TrainView = forwardRef<TrainViewHandle, TrainViewProps>(
  ({ distanceRef, models, wagonCount, currentSpeed }, ref) => {
    const [activeParticles, setActiveParticles] = useState<
      { id: number; pos: THREE.Vector3 }[]
    >([]);

    const [, forceUpdate] = useState(0);
    const samplesArray = useTrainStore((s) => s.samples);
    const activeSplineIndex = useTrainStore((s) => s.activeSplineIndex);
    // const samples = samplesArray[activeSplineIndex] || [];
// const _headSamples = samplesArray[activeSplineIndex];

    useEffect(() => {
      if (samplesArray.length > 0) {
        forceUpdate((n) => n + 1);
      }
    }, [samplesArray]);

    const totalParts = wagonCount + 2;
    const wagonsRefs = useRef<(THREE.Group | null)[]>([]);
    const wagonHandles = useRef<(WagonHandle | null)[]>([]);
    const animTime = useRef(0);
    const partDistancesRef = useRef<number[]>([]);
    const setLocomotiveRef = useTrainStore((s) => s.setLocomotiveRef);
    const isAnimating = useTrainStore((s) => s.isAnimating);
    const moveIntent = useTrainStore((s) => s.moveIntent);
    const setAnimating = useTrainStore((s) => s.setAnimating);
    const speedLevel = useTrainStore((s) => s.speedLevel);

    const {
      WAGON_OFFSET,
      ANIMATION: { BOUNCE_HEIGHT, BOUNCE_SPEED, WIGGLE_ANGLE },
      PHYSICS: { MAX_SPEED },
    } = TRAIN_CONFIG;

    const lastProcessedLevel = useRef(speedLevel);
    const lastProcessedWagons = useRef(wagonCount);
    const animationTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
      const isInitial = speedLevel === 1 && wagonCount === 0;
      const hasChanged =
        speedLevel !== lastProcessedLevel.current ||
        wagonCount !== lastProcessedWagons.current;

      if (isInitial || !hasChanged) return;

      lastProcessedLevel.current = speedLevel;
      lastProcessedWagons.current = wagonCount;
      setAnimating(true);
    }, [speedLevel, wagonCount, setAnimating]);

    useEffect(() => {
      if (animationTimeoutRef.current !== null) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      if (!isAnimating) return;

      const ANIMATION_STAGGER_MS = 50;
      const ANIMATION_UNLOCK_MS = 1000;
      const unlockTime = totalParts * ANIMATION_STAGGER_MS + ANIMATION_UNLOCK_MS;

      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimating(false);
        animationTimeoutRef.current = null;
      }, unlockTime);

      return () => {
        if (animationTimeoutRef.current !== null) {
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }
      };
    }, [isAnimating, totalParts, setAnimating]);

    useEffect(() => {
      partDistancesRef.current = [];
    }, [activeSplineIndex, wagonCount,samplesArray]);

    useImperativeHandle(
      ref,
      () => ({
        triggerWagonPulse: (index: number) => {
          wagonHandles.current[index]?.triggerPulse();
        },
spawnEffect: (index: number) => {
  let splineIndex;
  const trainState = useTrainStore.getState();
  const tailIndex = trainState.wagons.length + 1;
  const part =
    index === tailIndex
      ? trainState.tail
      : index > 0
        ? trainState.wagons[index - 1]
        : undefined;
  const wagon = part;

  if (index === 0) {
    splineIndex = activeSplineIndex; // 🚂
  } else {
    splineIndex = wagon?.splineId ?? activeSplineIndex; // 🚃
  }

  const currentSamples = samplesArray[splineIndex];
  if (!currentSamples || currentSamples.length < 2) return;

  const totalLength =
    currentSamples[currentSamples.length - 1].distance;

  const partDist =
    part && typeof part.distance === "number"
      ? wrapDistance(part.distance, totalLength)
      : wrapDistance(distanceRef.current - index * WAGON_OFFSET, totalLength);

  const result = getPointAtDistance(currentSamples, partDist);
  if (!result) return;

  const id = Date.now();

  setActiveParticles((prev) => [
    ...prev,
    { id, pos: result.position.clone() },
  ]);

  setTimeout(() => {
    setActiveParticles((prev) =>
      prev.filter((p) => p.id !== id)
    );
  }, 1500);

  wagonHandles.current[index]?.triggerPulse();
},
        triggerFullTrainPulse: () => {
          for (let i = 0; i < totalParts; i++) {
            window.setTimeout(() => wagonHandles.current[i]?.triggerPulse(), i * 50);
          }
        },
      }),
      [
  totalParts,
  samplesArray,
  activeSplineIndex,
  distanceRef,
  WAGON_OFFSET,
  moveIntent,
  isAnimating,
]
    );

useFrame((_, dt) => {
  if (!samplesArray.length) return;

  const LOOK_AHEAD_DISTANCE = 2;
  const trainState = useTrainStore.getState();
  const liveWagons = trainState.wagons;
  const liveTail = trainState.tail;
  const tailIndex = liveWagons.length + 1;
  const speed = currentSpeed.current ?? 0;
  const intentDirection = moveIntent === "BACKWARD" ? -1 : 1;
  const direction = Math.abs(speed) > 0.05 ? Math.sign(speed) : intentDirection;
  const velocityFactor = Math.min(Math.abs(speed) / MAX_SPEED, 1);

  if (velocityFactor > 0.1) {
    animTime.current += dt * BOUNCE_SPEED;
  }

  for (let i = 0; i < totalParts; i++) {
    const groupRef = wagonsRefs.current[i];
    if (!groupRef) continue;


    let splineIndex;

    if (i === 0) {
      splineIndex = activeSplineIndex; 
    } else {
      const wagon = i === tailIndex ? liveTail : liveWagons[i - 1];
      splineIndex = wagon?.splineId ?? activeSplineIndex; 
    }

    const currentSamples = samplesArray[splineIndex];
    if (!currentSamples || currentSamples.length < 2) continue;

    const totalLength =
      currentSamples[currentSamples.length - 1].distance;

    const wagon = i > 0 ? (i === tailIndex ? liveTail : liveWagons[i - 1]) : undefined;
    const targetDist =
      wagon && typeof wagon.distance === "number"
        ? wrapDistance(wagon.distance, totalLength)
        : wrapDistance(
            distanceRef.current - i * WAGON_OFFSET * direction,
            totalLength
          );

    const result = getPointAtDistance(currentSamples, targetDist);
    if (!result) continue;


    groupRef.position.copy(result.position);


    _lookAtTarget
      .copy(result.position)
      .addScaledVector(result.tangent, LOOK_AHEAD_DISTANCE * direction);

    groupRef.up.set(0, 1, 0);
    groupRef.lookAt(_lookAtTarget);

    // 🎞️ АНІМАЦІЯ
    const visualModel = groupRef.children[0];

    if (visualModel && velocityFactor > 0.01) {
      const phase = Math.PI * i;
      const wave = Math.sin(animTime.current + phase);

      if (i === 0) {
        visualModel.position.y =
          Math.abs(wave) * BOUNCE_HEIGHT * velocityFactor;
      } else {
        visualModel.rotation.z =
          THREE.MathUtils.degToRad(WIGGLE_ANGLE) *
          wave *
          velocityFactor;
      }
    } else if (visualModel) {
      visualModel.position.set(0, 0, 0);
      visualModel.rotation.set(0, 0, 0);
    }
  }
});
    return (
      <group>
        {activeParticles.map((p) => (
          <SpawnParticles key={p.id} position={p.pos} />
        ))}
        <TrainWaveEffect
          wagonPositions={wagonsRefs.current as THREE.Group[]}
          count={wagonCount + 2}
        />

        <group
          ref={(el) => {
            wagonsRefs.current[0] = el;
            if (el) {
              setLocomotiveRef({ current: el });
            }
          }}
        >
          <Wagon
            ref={(el) => {
              wagonHandles.current[0] = el;
            }}
            model={models.locomotive}
          />
        </group>

        {Array.from({ length: wagonCount }).map((_, i) => (
          <group
            key={i}
            ref={(el) => {
              wagonsRefs.current[i + 1] = el;
            }}
          >
            <Wagon
              ref={(el) => {
                wagonHandles.current[i + 1] = el;
              }}
              model={models.wagon}
            />
          </group>
        ))}

        <group
          ref={(el) => {
            wagonsRefs.current[wagonCount + 1] = el;
          }}
        >
          <Wagon
            ref={(el) => {
              wagonHandles.current[wagonCount + 1] = el;
            }}
            model={models.tail}
            isTail
          />
          <TrainWheelDust currentSpeed={currentSpeed} />
        </group>
      </group>
    );
  },
);

TrainView.displayName = "TrainView";

export default TrainView;
