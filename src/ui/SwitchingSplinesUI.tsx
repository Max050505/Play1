import { useTrainStore } from "../store/useTrainStore";
import {
  findNearestDistanceWithTangent,
  getPointAtDistance,
} from "../utils/splineUtils";
import { TrackSwitch } from "./SwitchBetweenSplines";

const SwitchingSplinesUI = () => {
  const samples = useTrainStore((s) => s.samples);
  const activeSplineIndex = useTrainStore((s) => s.activeSplineIndex);
  const setActiveSpline = useTrainStore((s) => s.setActiveSpline);
  const showSwitchUI = useTrainStore((s) => s.showSwitchUI);
  const activeSwitch = useTrainStore((s) => s.activeSwitch);
  const rawDistanceRef = useTrainStore((s) => s.rawDistanceRef);
  const runtimeDistanceRef = useTrainStore((s) => s.runtimeDistanceRef);

  const handleSwitch = (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    if (!samples[index] || index === activeSplineIndex) return;
    
    const newSamples = samples[index];
    if (newSamples.length === 0) return;
    
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
          : (newSamples[newSamples.length - 1]?.distance ?? 0) * 0.5;

        if (runtimeDistanceRef) {
          runtimeDistanceRef.current = targetDist;
        }
        rawDistanceRef.current = targetDist;
      } else {
        const fallbackDist = runtimeDistanceRef?.current ?? rawDistanceRef.current;
        if (runtimeDistanceRef) {
          runtimeDistanceRef.current = fallbackDist;
        }
        rawDistanceRef.current = fallbackDist;
      }
    }
    
    setActiveSpline(index);
  };

  if (showSwitchUI && activeSwitch && activeSwitch.options.length >= 2) {
    const leftId = activeSwitch.options[0].toString();
    const rightId = activeSwitch.options[1].toString();
    
    return (
      <TrackSwitch
        isOpen={true}
        leftOption={{ id: leftId, label: `Track ${parseInt(leftId) + 1}`, color: "#0081cf" }}
        rightOption={{ id: rightId, label: `Track ${parseInt(rightId) + 1}`, color: "#e63946" }}
        onSelect={handleSwitch}
        title="Choose Track"
      />
    );
  }

  return null;
};

export default SwitchingSplinesUI;
