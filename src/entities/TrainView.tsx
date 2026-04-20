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

    const totalParts = wagonCount + 2;
    const wagonsRefs = useRef<(THREE.Group | null)[]>([]);
    const wagonHandles = useRef<(WagonHandle | null)[]>([]);
    const animTime = useRef(0);
    const samples = useTrainStore((s) => s.samples);
    const setLocomotiveRef = useTrainStore((s) => s.setLocomotiveRef);
    const isAnimating = useTrainStore((s) => s.isAnimating);
    const setAnimating = useTrainStore((s) => s.setAnimating);
    const speedLevel = useTrainStore((s) => s.speedLevel);

    const {
      WAGON_OFFSET,
      ANIMATION: { BOUNCE_HEIGHT, BOUNCE_SPEED, WIGGLE_ANGLE },
      PHYSICS: { MAX_SPEED },
    } = TRAIN_CONFIG;
    const lastProcessedLevel = useRef(speedLevel);
    const lastProcessedWagons = useRef(wagonCount);
    const animationId = useRef(0);
    const animationTimeoutRef = useRef<number | null>(null);

    // Track changes and start animation
    useEffect(() => {
      const isInitial = speedLevel === 1 && wagonCount === 0;

      const hasChanged =
        speedLevel !== lastProcessedLevel.current ||
        wagonCount !== lastProcessedWagons.current;

      console.log("TrainView useEffect:", { isInitial, hasChanged, speedLevel, wagonCount });

      if (isInitial || !hasChanged) {
        return;
      }

      lastProcessedLevel.current = speedLevel;
      lastProcessedWagons.current = wagonCount;

      // Start animation by setting isAnimating
      setAnimating(true);
      animationId.current += 1;
      
      console.log("Animation started, animationId:", animationId.current);
    }, [speedLevel, wagonCount]);

    // Separate effect to handle animation timeout - runs when isAnimating changes
    useEffect(() => {
      console.log("Animation effect:", { isAnimating, speedLevel, wagonCount });
      
      // Clear any existing timeout
      if (animationTimeoutRef.current !== null) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      if (!isAnimating) return;

      const totalParts = wagonCount + 2;
      const ANIMATION_STAGGER_MS = 50;
      const ANIMATION_UNLOCK_MS = 1000;
      const unlockTime = totalParts * ANIMATION_STAGGER_MS + ANIMATION_UNLOCK_MS;

      console.log("Starting animation timeout, unlockTime:", unlockTime);

      animationTimeoutRef.current = window.setTimeout(() => {
        console.log("Animation timeout fired, setting isAnimating: false");
        setAnimating(false);
        animationTimeoutRef.current = null;
      }, unlockTime);

      // Cleanup function
      return () => {
        console.log("Animation effect cleanup");
        if (animationTimeoutRef.current !== null) {
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }
      };
    }, [isAnimating, speedLevel, wagonCount, setAnimating]);

    // Експортуємо методи для зовнішнього використання

    useImperativeHandle(
      ref,
      () => ({
        triggerWagonPulse: (index: number) => {
          if (wagonHandles.current[index]) {
            wagonHandles.current[index]?.triggerPulse();
          }
        },
        spawnEffect: (index: number) => {
          const partDist = distanceRef.current - index * WAGON_OFFSET;
          const result = getPointAtDistance(samples, partDist);

          if (result) {
            const pos = result.position.clone();
            const id = Date.now();

            setActiveParticles((prev) => [...prev, { id, pos }]);

            setTimeout(() => {
              setActiveParticles((prev) => prev.filter((p) => p.id !== id));
            }, 1500);

            wagonHandles.current[index]?.triggerPulse();
          }
        },

        triggerFullTrainPulse: () => {
          for (let i = 0; i < totalParts; i++) {
            window.setTimeout(
              () => wagonHandles.current[i]?.triggerPulse(),
              i * 50,
            );
          }
        },
      }),
      [totalParts],
    );

    useFrame((_, dt) => {
      if (!samples.length) return;

      const currentDist = distanceRef.current;
      const speed = currentSpeed.current ?? 0;
      const velocityFactor = Math.min(Math.abs(speed) / MAX_SPEED, 1);

      if (velocityFactor > 0.1) {
        animTime.current += dt * BOUNCE_SPEED;
      }

      const totalParts = wagonCount + 2;
      const totalLength = samples[samples.length - 1].distance;

      for (let i = 0; i < totalParts; i++) {
        const groupRef = wagonsRefs.current[i];
        if (!groupRef) continue;

        let partDist = currentDist - i * WAGON_OFFSET;
        if (partDist < 0) partDist += totalLength;
        const result = getPointAtDistance(samples, partDist);
        if (!result) continue;

        groupRef.position.copy(result.position);
        _lookAtTarget.copy(result.position).add(result.tangent);
        groupRef.lookAt(_lookAtTarget);
        groupRef.updateMatrixWorld();
        // Анімація моделі всередині групи (перша дитина - це компонент Wagon)
        const visualModel = groupRef.children[0];
        if (visualModel && velocityFactor > 0.01) {
          const phase = Math.PI * i;
          const wave = Math.sin(animTime.current + phase);

          if (i === 0) {
            // Локомотив підстрибує
            const bounce = Math.abs(wave);
            visualModel.position.y = bounce * BOUNCE_HEIGHT * velocityFactor;
          } else {
            // Решта вагонів хитаються
            const angle =
              THREE.MathUtils.degToRad(WIGGLE_ANGLE) * wave * velocityFactor;
            visualModel.rotation.z = angle;
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

        {/* ВАГОНИ (Індекси від 1 до wagonCount) */}
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

        {/* ХВІСТ (Індекс wagonCount + 1) */}
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
          <TrainWheelDust
            currentSpeed={currentSpeed}
          />
        </group>
      </group>
    );
  },
);

TrainView.displayName = "TrainView";

export default TrainView;
