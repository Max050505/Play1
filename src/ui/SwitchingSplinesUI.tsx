import { useTrainStore } from "../store/useTrainStore";
import {
  findNearestDistanceWithTangent,
  getPointAtDistance,
} from "../utils/splineUtils";
import type { TrackSwitchOption } from "../types";
import { TrackSwitch } from "./SwitchBetweenSplines";

const SwitchingSplinesUI = () => {
  const samples = useTrainStore((s) => s.samples);
  const activeSplineIndex = useTrainStore((s) => s.activeSplineIndex);
  const setActiveSpline = useTrainStore((s) => s.setActiveSpline);
  const setMoveIntent = useTrainStore((s) => s.setMoveIntent);
  const showSwitchUI = useTrainStore((s) => s.showSwitchUI);
  const activeSwitch = useTrainStore((s) => s.activeSwitch);
  const rawDistanceRef = useTrainStore((s) => s.rawDistanceRef);
  const runtimeDistanceRef = useTrainStore((s) => s.runtimeDistanceRef);

  const handleSwitch = (optionIndex: number) => {
    if (!activeSwitch || optionIndex < 0 || optionIndex >= activeSwitch.options.length) return;

    const selected: TrackSwitchOption = activeSwitch.options[optionIndex];
    const targetSpline = selected.targetSpline;

    if (!samples[targetSpline] || targetSpline === activeSplineIndex) return;

    const newSamples = samples[targetSpline];
    if (newSamples.length === 0) return;

    setMoveIntent(selected.intent);

    const currentSamples = samples[activeSplineIndex];
    if (currentSamples && currentSamples.length > 0) {
      const currentDist = runtimeDistanceRef?.current ?? rawDistanceRef.current;
      const point = getPointAtDistance(currentSamples, currentDist);
      if (point) {
        const nearestDist = findNearestDistanceWithTangent(
          [point.position.x, point.position.y, point.position.z],
          [point.tangent.x, point.tangent.y, point.tangent.z],
          newSamples
        );

        const targetDist = Number.isFinite(nearestDist)
          ? nearestDist
          : selected.entryDistance;

        if (runtimeDistanceRef) {
          runtimeDistanceRef.current = targetDist;
        }
        rawDistanceRef.current = targetDist;
      } else {
        if (runtimeDistanceRef) {
          runtimeDistanceRef.current = selected.entryDistance;
        }
        rawDistanceRef.current = selected.entryDistance;
      }
    }

    setActiveSpline(targetSpline);
  };

  if (showSwitchUI && activeSwitch && activeSwitch.options.length >= 2) {
    const leftOption = activeSwitch.options[0];
    const rightOption = activeSwitch.options[1];

    return (
      <TrackSwitch
        isOpen={true}
        leftOption={{ id: "0", label: `Track ${leftOption.targetSpline + 1} ${leftOption.intent === "BACKWARD" ? "↓" : "→"}`, color: "#0081cf" }}
        rightOption={{ id: "1", label: `Track ${rightOption.targetSpline + 1} ${rightOption.intent === "BACKWARD" ? "↓" : "→"}`, color: "#e63946" }}
        onSelect={handleSwitch}
        title="Choose Track"
      />
    );
  }

  return null;
};

export default SwitchingSplinesUI;
