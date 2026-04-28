import { useTrainStore } from "../store/useTrainStore";
import { TrackSwitch } from "./SwitchBetweenSplines";

const SwitchingSplinesUI = () => {

  const showSwitchUI = useTrainStore((s) => s.showSwitchUI);
  const pendingTransition = useTrainStore((s) => s.pendingTransition);

  if (!pendingTransition) return;

  // Показуємо меню тільки якщо є активний запит (pendingTransition)
    const trainStore = useTrainStore.getState();
  if (showSwitchUI && pendingTransition) {
    return (
     <TrackSwitch
  isOpen={trainStore.showSwitchUI}
  title={`Розвилка ${pendingTransition.fromSpline} → ?`}
  leftOption={{
    id: "switch",
    label: `На ${pendingTransition.toSpline}`,   // 👈 динамічно
    color: "#00c853"
  }}
  rightOption={{
    id: "stay",
    label: `Залишитись (${pendingTransition.fromSpline})`,
    color: "#555"
  }}
  onSelect={(index) => {
  if (index === 0) {

    trainStore.setConfirmedTransition(pendingTransition);
  } else {

    trainStore.setConfirmedTransition(null);
  }

  trainStore.setPendingTransition(null);
  trainStore.setShowSwitchUI(false); 
}}
/>
    );
  }

  return null;
};

export default SwitchingSplinesUI;
