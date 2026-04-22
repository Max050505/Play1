export const getDirection = (speed: number, fallback = 1) => {
  if (Math.abs(speed) < 0.01) return fallback;
  return Math.sign(speed);
};

export const isForward = (speed: number, fallback = 1) =>
  getDirection(speed, fallback) === 1;

export const isBackward = (speed: number, fallback = 1) =>
  getDirection(speed, fallback) === -1;