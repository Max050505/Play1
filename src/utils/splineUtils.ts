import * as THREE from "three";
import type { SplineSample, PointAtDistance, RawSplineData } from "../types";

const _tempPos = new THREE.Vector3();
const _tempTan = new THREE.Vector3();

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

      _tempPos.lerpVectors(a.position, b.position, t);
      _tempTan.lerpVectors(a.tangent, b.tangent, t).normalize();

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
