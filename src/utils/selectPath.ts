import type { Transition } from "../types";

export const TRANSITIONS: Transition[] = [
  // === SPLINE 0 (start) ===
  {
    fromSpline: 0,
    stopDistance: 289,
    atDistance: 286.3,
    toSpline: 2,
    entryDistance: 29.4,
    isManual: true,
    intent: "BACKWARD",
    newIntent:"BACKWARD"
  },
  {
    fromSpline: 0,
    stopDistance: 198,
    atDistance: 192,
    toSpline: 1,
    entryDistance: 0,
    intent: "BACKWARD",
    isManual: true,
    newIntent:"FORWARD",
  },
  {
    fromSpline: 0,
    stopDistance: 272,
    atDistance: 269.5,
    toSpline: 1,
    entryDistance: 294.6,
    intent: "FORWARD",
    isManual: true,
    newIntent:"BACKWARD"
  },
  {
    fromSpline: 0,
    stopDistance: 164,
    atDistance: 168,
    toSpline: 3,
    entryDistance: 0,
    intent: "FORWARD",
    isManual: true,
    newIntent:"FORWARD",
  },

  // === SPLINE 2 ===
  {
    fromSpline: 2,
    atDistance: 0.6,
    toSpline: 1,
    entryDistance: 271.1,
    intent: "BACKWARD",
    newIntent:"BACKWARD",
  },
  {
    fromSpline: 2,
    atDistance: 30,
    toSpline: 0,
    entryDistance: 286.5,
    intent: "FORWARD",
    newIntent:"BACKWARD",
  },

// === SPLINE 1 ===
  {
    fromSpline: 1,
    atDistance: 294.6,
    toSpline: 0,
    entryDistance: 269.5,
    intent: "FORWARD",
    newIntent:'BACKWARD'
  },
  {  
    fromSpline: 1,
    atDistance: 1,
    toSpline: 0,
    entryDistance: 191.9,
    intent: "BACKWARD",
    newIntent:"FORWARD"
  },
  {
    fromSpline: 1,
    stopDistance: 32,
    atDistance: 29.5,
    toSpline: 3,
    entryDistance: 30,
    intent: "BACKWARD",
    isManual: true,
    newIntent: "BACKWARD",
  },
  {
    fromSpline: 1,
    stopDistance: 263,
    atDistance: 265,
    toSpline: 2,
    entryDistance: 0,
    intent: "FORWARD",
    isManual: true,
    newIntent:"FORWARD"
  },

  // === SPLINE 3 ===
  {
    fromSpline: 3,
    atDistance: 0,
    toSpline: 0,
    entryDistance: 168.4,
    intent: "BACKWARD",
    newIntent: "BACKWARD",
  },
  {
    fromSpline: 3,
    atDistance: 30,
    toSpline: 1,
    entryDistance: 23.4,
    intent: "FORWARD",
    newIntent: "FORWARD",
  },
];