import type { Transition } from "../types";

export const TRANSITIONS: Transition[] = [
  {
    fromSpline: 0,
    stopDistance: 282,
    atDistance: 283,
    toSpline: 2,
    entryDistance: 29,
    intent: "BACKWARD",
    isManual: true,
  },

  {
    fromSpline: 0,
    stopDistance: 195,
    atDistance: 197,
    toSpline: 2,
    entryDistance: 29,
    intent: "FORWARD",
    isManual: true,
  },
  {
    fromSpline: 0,
    stopDistance: 258,
    atDistance: 260,
    toSpline: 2,
    entryDistance: 275,
    intent: "BACKWARD",
    isManual: true,
  },
  {
    fromSpline: 0,
    stopDistance: 161,
    atDistance: 164,
    toSpline: 3,
    entryDistance: 275,
    intent: "BACKWARD",
    isManual: true,
  },

  {
    fromSpline: 2,
    atDistance: 1,
    toSpline: 1,
    entryDistance: 271,
    intent: "BACKWARD",
  },

  {
    fromSpline: 1,
    atDistance: 1,
    toSpline: 0,
    entryDistance: 193,
    intent: "FORWARD",
  },
  {
    fromSpline: 1,
    stopDistance: 32,
    atDistance: 30,
    toSpline: 3,
    entryDistance: 0,
    intent: "FORWARD",
    isManual: true,
  },
];
