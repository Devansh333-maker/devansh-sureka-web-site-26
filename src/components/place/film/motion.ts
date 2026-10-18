import { LEG, type Joint, type Skater } from './skater';

// The skater's animation, posed key by key like a 2D key animator would: strong, held
// silhouettes and quick eased breaks between them, on the film's scene clock.
//   ready     the opening: crouched, ball at the hip, head bowed, then the eyes come up
//   drive     a deep speed-skater stroke, the free arm swinging, the ball dribbled
//   gather    the gap opens: both feet down, the ball in two hands
//   cock      coiled: shoulders turned away, ball cocked behind the head, the free arm aimed
//   strike    a jump shot: knee drives up, the arm whips over the top, the body uncoils
//   land      absorb low
//   airplane  glide on one skate, arms wide, the other leg out behind
//   captain   stand tall, a fist to the roof
// All angles are local Euler rotations. Limbs hang down at rest; for legs and arms a
// negative x swings forward, for the spine a positive x leans forward.

type Rot = [number, number, number];
type Pose = Partial<Record<Joint, Rot>>;
type Full = Record<Joint, Rot>;
const JOINTS: Joint[] = ['hips', 'spine', 'chest', 'neck', 'head', 'armL', 'foreL', 'handL', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR'];

const c01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => t * t * (3 - 2 * t);
const inCubic = (t: number) => t * t * t;
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));

function full(p: Pose): Full {
  const f = {} as Full;
  for (const j of JOINTS) f[j] = p[j] ? [...p[j]!] : [0, 0, 0];
  return f;
}
// always a fresh pose: the held poses below are constants and must never be edited
function mix(a: Full, b: Full, t: number): Full {
  t = c01(t);
  const f = {} as Full;
  for (const j of JOINTS) f[j] = [mixN(a[j][0], b[j][0], t), mixN(a[j][1], b[j][1], t), mixN(a[j][2], b[j][2], t)];
  return f;
}

// ── the held poses ──
const READY = full({
  thighL: [-0.55, 0, 0.14],
  shinL: [0.95, 0, 0],
  thighR: [0.12, 0, -0.2],
  shinR: [0.75, 0, 0],
  spine: [0.3, 0, 0],
  chest: [0.15, 0.3, 0],
  neck: [-0.25, -0.15, 0],
  head: [-0.3, 0, 0],
  armR: [-0.3, 0, -0.18],
  foreR: [-1.25, 0, 0],
  armL: [0.15, 0, 0.32],
  foreL: [-0.35, 0, 0],
});
const GATHER = full({
  thighL: [-0.68, 0, 0.08],
  shinL: [1.2, 0, 0],
  thighR: [0.3, 0, -0.2],
  shinR: [0.8, 0, 0],
  spine: [0.35, 0, 0],
  chest: [0.2, 0, 0],
  neck: [-0.3, 0, 0],
  head: [-0.15, 0, 0],
  armR: [-1.05, 0, -0.08],
  foreR: [-0.9, 0, 0],
  armL: [-1.05, 0, 0.08],
  foreL: [-0.9, 0, 0],
});
const COCK = full({
  thighL: [-0.8, 0, 0.1],
  shinL: [1.35, 0, 0],
  thighR: [0.35, 0, -0.22],
  shinR: [0.9, 0, 0],
  spine: [0.15, -0.25, 0],
  chest: [0.05, -0.6, 0],
  neck: [-0.1, 0.4, 0],
  head: [-0.05, 0.45, 0],
  armR: [-3.1, 0, -0.35],
  foreR: [-1.6, 0, 0],
  armL: [-1.5, 0, 0.8],
  foreL: [-0.08, 0, 0],
});
const RELEASE = full({
  thighL: [-1.45, 0, 0.05],
  shinL: [1.9, 0, 0],
  thighR: [0.4, 0, -0.08],
  shinR: [0.9, 0, 0],
  spine: [0.15, 0, 0],
  chest: [0.05, 0.2, 0],
  neck: [-0.1, -0.1, 0],
  head: [-0.05, -0.1, 0],
  armR: [-2.0, 0, -0.12],
  foreR: [-0.35, 0, 0],
  armL: [0.25, 0, 0.45],
  foreL: [-0.9, 0, 0],
});
const FOLLOW = full({
  thighL: [-1.2, 0, 0.05],
  shinL: [1.6, 0, 0],
  thighR: [0.3, 0, -0.08],
  shinR: [1.0, 0, 0],
  spine: [0.5, 0, 0],
  chest: [0.3, 0.55, 0],
  neck: [-0.45, -0.3, 0],
  head: [-0.25, -0.25, 0],
  armR: [-0.3, 0, 0.35],
  foreR: [-0.25, 0, 0],
  armL: [0.45, 0, 0.5],
  foreL: [-0.8, 0, 0],
});
const LAND = full({
  thighL: [-0.95, 0, 0.12],
  shinL: [1.55, 0, 0],
  thighR: [-0.4, 0, -0.14],
  shinR: [1.2, 0, 0],
  spine: [0.45, 0, 0],
  chest: [0.2, 0.2, 0],
  neck: [-0.35, 0, 0],
  head: [-0.2, 0, 0],
  armR: [-0.4, 0, -0.6],
  foreR: [-0.4, 0, 0],
  armL: [-0.4, 0, 0.6],
  foreL: [-0.4, 0, 0],
});
const AIRPLANE = full({
  thighR: [-0.2, 0, -0.04],
  shinR: [0.35, 0, 0],
  thighL: [1.25, 0, 0.06],
  shinL: [0.15, 0, 0],
  spine: [0.7, 0, 0],
  chest: [0.35, 0, 0],
  neck: [-0.55, 0, 0],
  head: [-0.45, 0, 0],
  armL: [0.1, 0, 1.45],
  foreL: [-0.05, 0, 0],
  armR: [0.1, 0, -1.45],
  foreR: [-0.05, 0, 0],
});
const CAPTAIN = full({
  thighL: [-0.1, 0, 0.13],
  shinL: [0.2, 0, 0],
  thighR: [-0.05, 0, -0.13],
  shinR: [0.18, 0, 0],
  spine: [-0.08, 0, 0],
  chest: [-0.14, 0.15, 0],
  neck: [-0.2, 0, 0],
  head: [-0.3, -0.1, 0],
  armR: [-2.95, 0, -0.15],
  foreR: [-0.15, 0, 0],
  armL: [0.15, 0, 0.35],
  foreL: [-1.7, 0, 0],
});

// ── the stroke: glide under the body, push out and back, tuck and recover ──
function stroke(u: number, side: number, hx: number): [Rot, Rot] {
  const [t, sh] = strokeWorld(u, side);
  return [[t[0] - hx, t[1], t[2]], sh];
}
function strokeWorld(u: number, side: number): [Rot, Rot] {
  u = ((u % 1) + 1) % 1;
  if (u < 0.5) {
    const k = u / 0.5;
    return [[-0.62 + 0.15 * k, 0, side * 0.06], [1.05 - 0.05 * k, 0, 0]];
  }
  if (u < 0.8) {
    const k = ease((u - 0.5) / 0.3);
    return [[mixN(-0.47, 0.28, k), 0, side * mixN(0.06, 0.42, k)], [mixN(1.0, 0.12, k), 0, 0]];
  }
  const k = ease((u - 0.8) / 0.2);
  return [[mixN(0.28, -0.62, k), 0, side * mixN(0.42, 0.06, k)], [mixN(0.12, 1.05, k) + Math.sin(Math.PI * k) * 0.9, 0, 0]];
}

function drive(s: number, r: number): Full {
  const STROKE = 0.8;
  const ph = s / STROKE;
  const sw = Math.sin(ph * Math.PI * 2);
  const HX = 0.38; // the pelvis tips forward into the crouch
  const [tL, sL] = stroke(ph, 1, HX);
  const [tR, sR] = stroke(ph + 0.5, -1, HX);
  // the dribble: the hand pushes down as the ball leaves it
  const f = (s / 0.475) % 1;
  const top = Math.max(0, Math.cos(f * Math.PI * 2));
  return full({
    hips: [HX, sw * 0.1, 0],
    thighL: tL,
    shinL: sL,
    thighR: tR,
    shinR: sR,
    spine: [0.32, -sw * 0.05, 0],
    chest: [0.18, sw * 0.16, 0],
    neck: [-0.5, 0, 0],
    head: [-0.38, 0, 0],
    armL: [-0.1 - 0.9 * sw, 0, 0.2],
    foreL: [-0.7, 0, 0],
    armR: [-0.6 + 0.12 * top, 0, -0.25],
    foreR: [-0.8 + 0.45 * top, 0, 0],
    // a breath on top of it all
    handR: [0.2 * Math.sin(r * 3), 0, 0],
  });
}

export const TAKEOFF = 0.12;
export const AIR = 0.6;
export function jumpAt(s: number, shotT: number) {
  const k = c01((s - (shotT - TAKEOFF)) / AIR);
  return k > 0 && k < 1 ? 0.55 * Math.sin(Math.PI * k) : 0;
}

export type MotionIn = {
  s: number; // scene seconds
  r: number; // real seconds
  gapT: number;
  shotT: number;
  hitT: number;
  title: number; // real time the head comes up
  drive: number; // real time the drive starts
  gaze: number; // yaw from where he faces to the goal (radians)
  speed: number; // projector speed (for the hair and the headband)
};
export type MotionOut = { hold: number; cock: number; ready: number; released: boolean };

// pose the skater for this instant; returns how the ball is held
export function animate(sk: Skater, m: MotionIn): MotionOut {
  const { s, r, gapT, shotT, hitT } = m;
  const j = s - shotT;
  const since = s - hitT;
  const wReady = 1 - ease(c01((r - m.drive + 0.15) / 0.25));
  const wGather = ease(c01((s - (gapT - 0.12)) / 0.28));
  const wCock = ease(c01((s - (gapT + 0.15)) / 0.4));
  const wJump = ease(c01((j + TAKEOFF) / 0.05));
  const wLand = ease(c01((j - (AIR - TAKEOFF) + 0.03) / 0.07));
  const wAir = ease(c01((since - 0.08) / 0.3));
  const wCap = ease(c01((since - 1.5) / 0.45));

  let P = drive(s, r);
  P = mix(P, READY, wReady);
  P = mix(P, GATHER, wGather);
  P = mix(P, COCK, wCock);
  // the strike: cock → release (accelerating) → follow-through (decelerating)
  const k = c01((j + TAKEOFF) / (TAKEOFF + 0.33));
  const k0 = TAKEOFF / (TAKEOFF + 0.33);
  const strike = k < k0 ? mix(COCK, RELEASE, inCubic(k / k0)) : mix(RELEASE, FOLLOW, outCubic((k - k0) / (1 - k0)));
  P = mix(P, strike, wJump);
  P = mix(P, LAND, wLand);
  P = mix(P, AIRPLANE, wAir);
  P = mix(P, CAPTAIN, wCap);

  // life on the held poses: a pumping fist, breathing, the head bowed in the dark
  P.armR[0] += Math.sin(since * 8) * 0.12 * wCap;
  P.chest[0] += Math.sin(r * 2.2) * 0.02;
  P.head[0] += 0.55 * (1 - ease(c01((r - m.title - 0.05) / 0.35))) * wReady;
  // eyes on the goal from the gap until it's in
  const look = c01(wGather * (1 - wAir));
  const turned = P.spine[1] + P.chest[1] + P.neck[1] + P.head[1];
  const want = Math.max(-1.2, Math.min(1.2, m.gaze - turned));
  P.neck[1] += want * 0.4 * look;
  P.head[1] += want * 0.6 * look;

  // apply, keeping the skates flat on the floor
  for (const name of JOINTS) {
    const [x, y, z] = P[name];
    sk.J[name].rotation.set(x, y, z);
  }
  for (const side of ['L', 'R'] as const) {
    const t = P[`thigh${side}`];
    const sh = P[`shin${side}`];
    sk.J[`foot${side}`].rotation.set(-(P.hips[0] + t[0] + sh[0]) + 0.6 * wJump * (side === 'R' ? 1 : 0) * (1 - wLand), 0, -t[2]);
  }
  const ext = (side: 'L' | 'R') => {
    const t = P[`thigh${side}`];
    const sh = P[`shin${side}`];
    const a = P.hips[0] + t[0];
    return LEG.hip * Math.cos(P.hips[0]) + (LEG.thigh * Math.cos(a) + LEG.shin * Math.cos(a + sh[0])) * Math.cos(t[2]) + LEG.skate;
  };
  // the lower foot carries the weight; in the air, the jump lifts him
  const planted = Math.max(ext('L'), ext('R'));
  sk.J.hips.position.y = wJump > 0 && wLand < 1 ? mixN(planted, ext('R'), wJump * (1 - wLand)) : planted;

  // the headband tails and the eyes
  const wind = 0.5 + Math.min(1.4, m.speed) * 0.6 + wJump * (1 - wLand) * 0.6;
  sk.tails.forEach((t, i) => {
    t.rotation.x = -0.35 - wind * 0.7 + Math.sin(r * (11 + i * 2.3) + i) * 0.12 * wind;
    t.rotation.z = (i ? 1 : -1) * (0.15 + Math.sin(r * 7 + i * 2) * 0.08);
  });
  sk.eyes.color.setScalar(1 + 5 * bump(r, m.title - 0.05, m.title + 0.45) + 2.5 * bump(s, shotT - 0.15, shotT + 0.1));

  return { hold: c01(wGather * 4) * (j < 0 ? 1 : 0), cock: wCock, ready: wReady, released: j >= 0 };
}
