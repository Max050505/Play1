import * as THREE from "three";
import type { SplineSample, PointAtDistance, RawSplineData } from "../types";

const _tempPos = new THREE.Vector3();
const _tempTan = new THREE.Vector3();

export function offsetSpline(samples: SplineSample[], offset: [number, number, number]): SplineSample[] {
  const offsetVec = new THREE.Vector3(...offset);
  return samples.map(s => ({
    position: s.position.clone().add(offsetVec),
    tangent: s.tangent.clone(),
    distance: s.distance,
  }));
}

export function rotateSpline(samples: SplineSample[], angle: number): SplineSample[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return samples.map(s => {
    const pos = s.position.clone();
    const x = pos.x * cos - pos.z * sin;
    const z = pos.x * sin + pos.z * cos;
    pos.set(x, pos.y, z);
    
    const tan = s.tangent.clone();
    const tx = tan.x * cos - tan.z * sin;
    const tz = tan.x * sin + tan.z * cos;
    tan.set(tx, tan.y, tz);
    
    return { position: pos, tangent: tan, distance: s.distance };
  });
}

export function concatSplines(...splines: SplineSample[][]): SplineSample[] {
  if (splines.length === 0) return [];
  if (splines.length === 1) return splines[0];

  const result: SplineSample[] = [];
  let offsetDistance = 0;

  for (let s = 0; s < splines.length; s++) {
    const spline = splines[s];
    if (!spline || spline.length === 0) continue;

    for (let i = 0; i < spline.length; i++) {
      const sample = spline[i];
      result.push({
        position: sample.position.clone(),
        tangent: sample.tangent.clone(),
        distance: offsetDistance + sample.distance,
      });
    }

    offsetDistance = result[result.length - 1].distance;
  }

  return result;
}

export function parseSpline(raw: RawSplineData): SplineSample[] {
  if (!raw || !raw.samples) return [];
  let total = 0;
  const parsed: SplineSample[] = [];

  for (let i = 0; i < raw.samples.length; i++) {
    const s = raw.samples[i];
    const pos = new THREE.Vector3(s.p.x, s.p.y, s.p.z);
    const tan = new THREE.Vector3(s.t.x, s.t.y, s.t.z).normalize();

    if (i > 0) {
      total += parsed[i - 1].position.distanceTo(pos);
    }

    parsed.push({
      position: pos,
      tangent: tan,
      distance: total,
    });
  }
  return parsed;
}

export function getPointAtDistance(samples: SplineSample[], dist: number): PointAtDistance | null {
  if (samples.length < 2) return null;

  // Wrap negative distances to positive
  const total = samples[samples.length - 1]?.distance || 0;
  if (total > 0) {
    dist = ((dist % total) + total) % total;
  }

  if (dist <= 0)
    return { position: samples[0].position, tangent: samples[0].tangent };
  if (dist >= samples[samples.length - 1].distance) {
    return {
      position: samples[samples.length - 1].position,
      tangent: samples[samples.length - 1].tangent,
    };
  }

  for (let i = 1; i < samples.length; i++) {
    if (samples[i].distance >= dist) {
      const a = samples[i - 1];
      const b = samples[i];

      const segLen = b.distance - a.distance;
      const t = segLen > 0 ? (dist - a.distance) / segLen : 0;

      if (segLen > 0) {
        const t2 = t * t;
        const t3 = t2 * t;

        // Cubic Hermite interpolation: smoother than linear and uses source tangents.
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        _tempPos
          .copy(a.position)
          .multiplyScalar(h00)
          .addScaledVector(a.tangent, h10 * segLen)
          .addScaledVector(b.position, h01)
          .addScaledVector(b.tangent, h11 * segLen);

        // Derivative of Hermite for direction/tangent.
        const dh00 = 6 * t2 - 6 * t;
        const dh10 = 3 * t2 - 4 * t + 1;
        const dh01 = -6 * t2 + 6 * t;
        const dh11 = 3 * t2 - 2 * t;

        _tempTan
          .copy(a.position)
          .multiplyScalar(dh00)
          .addScaledVector(a.tangent, dh10 * segLen)
          .addScaledVector(b.position, dh01)
          .addScaledVector(b.tangent, dh11 * segLen)
          .normalize();
      } else {
        _tempPos.copy(a.position);
        _tempTan.copy(a.tangent).normalize();
      }

      return { position: _tempPos, tangent: _tempTan };
    }
  }
  return null;
}

const _tempVec = new THREE.Vector3();

export const findNearestDistance = (
  pos: [number, number, number],
  samples: SplineSample[],
): number => {
  if (!samples.length) return 0;

  _tempVec.set(pos[0], pos[1], pos[2]);
  let minDistSq = Infinity;
  let closestSplineDist = 0;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];

    const dSq = sample.position.distanceToSquared(_tempVec);

    if (dSq < minDistSq) {
      minDistSq = dSq;
      closestSplineDist = sample.distance;
    }
  }

  return closestSplineDist;
};

export const findNearestDistanceWithTangent = (
  pos: [number, number, number],
  tangent: [number, number, number],
  samples: SplineSample[],
): number => {
  if (!samples.length) return 0;

  _tempVec.set(pos[0], pos[1], pos[2]);
  const tangentVec = new THREE.Vector3(tangent[0], tangent[1], tangent[2]).normalize();
  let bestScore = Infinity;
  let bestDist = 0;
  let fallbackScore = Infinity;
  let fallbackDist = 0;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const dSq = sample.position.distanceToSquared(_tempVec);
    const dirDot = sample.tangent.dot(tangentVec); // [-1, 1]
    const directionPenalty = (1 - Math.max(-1, Math.min(1, dirDot))) * 40;
    const score = dSq + directionPenalty;

    // Prefer forward-ish direction match, fallback to global best otherwise.
    if (dirDot > 0.1 && score < bestScore) {
      bestScore = score;
      bestDist = sample.distance;
    }

    if (score < fallbackScore) {
      fallbackScore = score;
      fallbackDist = sample.distance;
    }
  }

  return bestScore < Infinity ? bestDist : fallbackDist;
};
