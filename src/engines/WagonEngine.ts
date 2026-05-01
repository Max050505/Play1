import { BaseEngine, type EngineUpdateContext } from "./BaseEngine";
import { TRANSITIONS } from "../utils/selectPath";

export class WagonEngine extends BaseEngine {
  readonly name = "WagonEngine";
  priority = 20;

update(context: EngineUpdateContext): void {
  const { dt } = context;
  const trainStore = this.context!.getTrainStore() as any;

  const speed = this.context!.currentSpeedRef.current ?? 0;
  if (Math.abs(speed) < 0.001) return;

  const direction = speed > 0 ? 1 : -1;
  // Визначаємо локальний напрямок руху вагона
  const localIntent = direction > 0 ? "FORWARD" : "BACKWARD"; 
  
  const deltaDistance = speed * dt;
  const samplesArray = trainStore.samples || [];

  const getUpdatedPart = (part: any, leaderSplineId: number): { splineId: number; distance: number } => {
    const samples = samplesArray[part.splineId] || [];
    const totalLength = samples[samples.length - 1]?.distance || 0;
    if (totalLength === 0) return { splineId: part.splineId, distance: part.distance };

    let nextDist = part.distance + deltaDistance;

    for (const tr of TRANSITIONS) {
      if (tr.fromSpline !== part.splineId) continue;
      
      // ВАЖЛИВО: Вагон має перевіряти перехід лише за напрямком свого руху (localIntent),
      // ігноруючи глобальний trainStore.moveIntent, який міг уже змінитися для голови.
      const isCorrectDirection = tr.intent === localIntent;
      if (!isCorrectDirection) continue;

      const crossed = this.crossedDistance(
        part.distance, 
        nextDist, 
        tr.atDistance, 
        direction, 
        totalLength
      );

      if (crossed) {
        const shouldSwitch = !tr.isManual || leaderSplineId === tr.toSpline;
        if (shouldSwitch) {
          const overshoot = nextDist - tr.atDistance;
          return { splineId: tr.toSpline, distance: tr.entryDistance + overshoot };
        }
      }
    }

    const newDistance = ((nextDist % totalLength) + totalLength) % totalLength;
    return { splineId: part.splineId, distance: newDistance };
  };



    // Оновлюємо кожен вагон незалежно
  const wagons = trainStore.wagons || [];
  const updatedWagons: any[] = [];
  
  // Для першого вагона лідером є голова (head)[cite: 1].
  let currentLeaderSpline = trainStore.head.splineId;

  for (const w of wagons) {
    const updated = getUpdatedPart(w, currentLeaderSpline);
    updatedWagons.push({ ...w, ...updated });
    // Наступний вагон тепер буде дивитися на цей оновлений сплайн
    currentLeaderSpline = updated.splineId; 
  }
  
  // Оновлюємо стан усіх вагонів[cite: 1].
  trainStore.setWagons?.(() => updatedWagons);

  // Хвіст оновлюється останнім, орієнтуючись на останній вагон або голову[cite: 1, 4].
  if (trainStore.tail) {
    const tailUpdate = getUpdatedPart(trainStore.tail, currentLeaderSpline);
    trainStore.setTail?.(tailUpdate);
  }
    
  }

  // Логіка перетину тригера (залишається вашою, вона хороша)
  private crossedDistance(from: number, to: number, target: number, direction: number, total: number): boolean {
    if (direction > 0) {
      if (total > 0 && to < from) return target >= from || target <= to;
      return from <= target && to >= target;
    }
    if (direction < 0) {
      if (total > 0 && to > from) return target <= from || target >= to;
      return from >= target && to <= target;
    }
    return false;
  }
}