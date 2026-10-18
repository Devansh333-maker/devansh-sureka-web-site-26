// The cut, in real seconds, and the speed ramp that drives the scene's own clock.
// The original replay runs on "scene seconds" (drive → the gap at 2.75 → shot 3.55 →
// goal 4.25). Here the projector speed changes under it: frozen for the opening, a hard
// drive, a drop into bullet time as the gap opens, a snap to fast for the strike, a stall
// on the hit, then a slow drift out.

export const DUR = 11;
export const SCENE = { gap: 2.75, shot: 3.55, hit: 4.25 };

// [real time, projector speed]: speed is linear between these points
const SPEED: [number, number][] = [
  [0, 0],
  [1.8, 0],
  [2.2, 1.15],
  [4.1, 1.15],
  [4.6, 0.18],
  [6.3, 0.18],
  [6.5, 1.6],
  [7.1, 1.6],
  [7.25, 0.35],
  [8.6, 0.9],
  [11, 0.9],
];

export function speedAt(r: number) {
  for (let i = 0; i < SPEED.length - 1; i++) {
    const [r0, v0] = SPEED[i];
    const [r1, v1] = SPEED[i + 1];
    if (r <= r1) return v0 + (v1 - v0) * ((r - r0) / (r1 - r0 || 1));
  }
  return SPEED[SPEED.length - 1][1];
}

// scene time for every real millisecond, integrated once
const STEP = 0.001;
const TABLE = (() => {
  const n = Math.ceil(DUR / STEP) + 1;
  const t = new Float32Array(n);
  for (let i = 1; i < n; i++) t[i] = t[i - 1] + speedAt((i - 0.5) * STEP) * STEP;
  return t;
})();
export function sceneAt(r: number) {
  const i = Math.min(TABLE.length - 1, Math.max(0, Math.round(r / STEP)));
  return TABLE[i];
}
export function realAt(s: number) {
  for (let i = 0; i < TABLE.length; i++) if (TABLE[i] >= s) return i * STEP;
  return DUR;
}

// when things happen, in real seconds
export const R = {
  open: 0,
  lightOn: 0.35,
  title: 0.8,
  drive: 1.85,
  whip: 3.25, // the cut from the floor-level track to the crane
  gap: realAt(SCENE.gap) - 0.15,
  shot: realAt(SCENE.shot),
  hit: realAt(SCENE.hit),
  outro: 9.2,
};
