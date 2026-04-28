import type { Transition } from "../types";

export const TRANSITIONS: Transition[] = [
  // === SPLINE 0 (start) ===
  {
    fromSpline: 0,
    stopDistance: 286,
    atDistance: 282.5,
    toSpline: 2,
    entryDistance: 29,
    isManual: true,
    intent: "BACKWARD",
    newIntent:"BACKWARD"
  },
  {
    fromSpline: 0,
    stopDistance: 198,
    atDistance: 196,
    toSpline: 1,
    entryDistance: 2,
    intent: "BACKWARD",
    isManual: true,
    newIntent:"FORWARD",
  },
  {
    fromSpline: 0,
    stopDistance: 256,
    atDistance: 260,
    toSpline: 1,
    entryDistance: 282,
    intent: "FORWARD",
    isManual: true,
    newIntent:"BACKWARD"
  },
  {
    fromSpline: 0,
    stopDistance: 161,
    atDistance: 164,
    toSpline: 3,
    entryDistance: 1,
    intent: "FORWARD",
    isManual: true,
    newIntent:"FORWARD",
  },

  // === SPLINE 2 ===
  {
    fromSpline: 2,
    atDistance: 1,
    toSpline: 1,
    entryDistance: 271,
    intent: "BACKWARD",
    newIntent:"BACKWARD",
  },
  {
    fromSpline: 2,
    atDistance: 29,
    toSpline: 0,
    entryDistance: 285,
    intent: "FORWARD",
    newIntent:"BACKWARD",
  },

// === SPLINE 1 ===
  {
    fromSpline: 1,
    atDistance: 291,
    toSpline: 0,
    entryDistance: 260,
    intent: "FORWARD",
    newIntent:'BACKWARD'
  },
  {  
    fromSpline: 1,
    atDistance: 1,
    toSpline: 0,
    entryDistance: 197,
    intent: "BACKWARD",
    newIntent:"FORWARD"
  },
  {
    fromSpline: 1,
    stopDistance: 32,
    atDistance: 27,
    toSpline: 3,
    entryDistance: 30,
    intent: "BACKWARD",
    isManual: true,
    newIntent: "BACKWARD",
  },
  {
    fromSpline: 1,
    stopDistance: 265,
    atDistance: 271,
    toSpline: 2,
    entryDistance: 1,
    intent: "FORWARD",
    isManual: true,
    newIntent:"FORWARD"
  },

  // === SPLINE 3 ===
  {
    fromSpline: 3,
    atDistance: 1,
    toSpline: 0,
    entryDistance: 164,
    intent: "BACKWARD",
    newIntent: "BACKWARD",
  },
  {
    fromSpline: 3,
    atDistance: 29,
    toSpline: 1,
    entryDistance: 27,
    intent: "FORWARD",
    newIntent: "FORWARD",
  },
];