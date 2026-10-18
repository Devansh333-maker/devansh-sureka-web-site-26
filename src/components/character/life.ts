import * as THREE from 'three';
import type { Rig, Side } from './ik';

// What makes the character feel alive between the big moves. Runs every frame on top
// of the motion-captured idle:
//   stance   feet planted at a natural width, knees soft, weight drifting leg to leg
//   breath   chest and shoulders rising and falling
//   arms     free hands hang relaxed by the thighs instead of the clip's stiff A-pose
//   gaze     the head finds you (the camera), glances away now and then, and looks down
//            at whatever I'm working on
//   gestures small habits: pushing my glasses up, a hand to the chin, a nod
//   fingers  curled and relaxed, or wrapped round whatever I'm holding

export type Gesture = 'glasses' | 'chin' | 'nod' | 'wave' | 'present';
export type Grip = { curl: number; thumb?: number; index?: number };
export type LifeOpts = {
  stance?: boolean;
  arms?: boolean;
  look?: boolean;
  gestures?: Gesture[];
};

const ease = (t: number) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};
// 0 → 1 → 0 over a gesture: rise for `a` of it, hold, fall for `c`
const envelope = (k: number, a = 0.3, c = 0.35) => (k < a ? ease(k / a) : k > 1 - c ? ease((1 - k) / c) : 1);

const DUR: Record<Gesture, number> = { glasses: 2.3, chin: 3.6, nod: 1.2, wave: 2.6, present: 3 };
const NEEDS: Record<Gesture, Side[]> = { glasses: [], chin: ['Right', 'Left'], nod: [], wave: ['Right'], present: ['Left'] };

const RELAXED: Required<Grip> = { curl: 0.32, thumb: 0.22, index: 0.26 };

// scratch objects reused every frame (no garbage in the hot path)
const s1 = new THREE.Vector3();
const s2 = new THREE.Vector3();
const s3 = new THREE.Vector3();
const sq = new THREE.Quaternion();
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const pole = new THREE.Vector3();

export class Life {
  private rng: () => number;
  private gaze = new THREE.Vector3(); // smoothed world point the head looks at
  private gazeInit = false;
  private glance: { until: number; offset: THREE.Vector3 } | null = null;
  private nextGlance = 2.5;
  private gesture: { name: Gesture; start: number; hand: Side } | null = null;
  private nextGesture = 3.5;
  // a gesture asked for while another is still playing waits for it, and the one
  // playing hurries to its end, so a hand never jumps from one pose to the next
  private queued: Gesture | null = null;
  private lastT = 0;
  private wantCurl: Record<Side, Grip | null> = { Left: null, Right: null };
  private shown: Record<Side, Required<Grip>> = { Left: { ...RELAXED }, Right: { ...RELAXED } };
  private bridge: THREE.Vector3; // glasses bridge, relative to the head bone at bind pose (character space)

  constructor(
    private rig: Rig,
    bridge: THREE.Vector3,
    seed = 7,
  ) {
    this.bridge = bridge.clone().sub(rig.restPos('Head'));
    let s = seed;
    this.rng = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  trigger(name: Gesture, t: number) {
    if (this.gesture && t - this.gesture.start < DUR[this.gesture.name]) this.queued = name;
    else this.gesture = { name, start: t, hand: 'Right' };
  }

  // a point fixed to my face (like the glasses), in world space, wherever the head is now
  private onFace(offset: THREE.Vector3, out: THREE.Vector3) {
    const head = this.rig.bone('Head');
    if (!head) return out;
    const off = offset.clone(); // `out` may be the same vector as `offset`
    const q = this.rig.carry('Head', sq);
    const scale = this.rig.root.getWorldScale(s3).x;
    return head.getWorldPosition(out).add(off.multiplyScalar(scale).applyQuaternion(q));
  }

  // reach along an arc rather than a straight line: real arms swing the hand forward
  // on the way up, so the elbow never ends up above a dangling hand
  private arcReach(side: Side, target: THREE.Vector3, polePt: THREE.Vector3, w: number, bulge = 0.22) {
    const rig = this.rig;
    if (w <= 0) return;
    const from = rig.world(side === 'Left' ? 'LeftHand' : 'RightHand', s1);
    const e = ease(w);
    const p = from.lerp(target, e).add(rig.dirToWorld(0, 0.15, 1, s2).multiplyScalar(bulge * Math.sin(Math.PI * e)));
    rig.reach(side, p, polePt, 1);
  }

  // 1. body: stance, breath and relaxed arms, before props and scene motion
  body(t: number, opts: LifeOpts, claimed: Set<Side>) {
    const rig = this.rig;
    const hips = rig.restPos('Hips');
    const chest = rig.restPos('Spine2');
    const breath = Math.sin((t / 4.2) * Math.PI * 2);
    const shift = Math.sin((t / 7.5) * Math.PI * 2) + 0.35 * Math.sin((t / 3.1) * Math.PI * 2);

    if (opts.stance !== false) {
      // weight drifts from leg to leg; knees never quite locked
      rig.drop(0.02 + Math.abs(shift) * 0.006, 0, shift * 0.024);
      const lf = rig.restPos('LeftFoot');
      const rf = rig.restPos('RightFoot');
      rig.step('Left', rig.toWorld(lf.x * 1.04, lf.y, lf.z + 0.03, v1), rig.toWorld(lf.x * 0.8, hips.y * 0.5, 1, pole), 0.16);
      rig.step('Right', rig.toWorld(rf.x * 1.04, rf.y, rf.z - 0.035, v1), rig.toWorld(rf.x * 0.8, hips.y * 0.5, 1, pole), -0.16);
      // the upper body counters the hips
      rig.turn('Spine', rig.dirToWorld(0, 0, 1, v1), -shift * 0.025);
    }

    // breathing, in the chest and the shoulders
    rig.pitch('Spine2', -0.018 * breath);
    for (const side of ['Left', 'Right'] as const) {
      const sh = rig.bone(`${side}Shoulder`);
      if (sh) rig.turn(sh.name, rig.dirToWorld(0, 0, 1, v1), (side === 'Left' ? 1 : -1) * 0.02 * (breath * 0.5 + 0.5));
    }

    if (opts.arms !== false) {
      for (const side of ['Left', 'Right'] as const) {
        if (claimed.has(side)) continue;
        const sx = side === 'Left' ? 1 : -1;
        const sway = Math.sin((t / 4.2) * Math.PI * 2 + (sx > 0 ? 0 : 1.3)) * 0.012;
        rig.reach(side, rig.toWorld(sx * 0.235, hips.y - 0.15, 0.05 + sway, v1), rig.toWorld(sx * 0.4, chest.y - 0.25, -0.55, pole), 0.85);
        rig.handTo(side, rig.dirToWorld(sx * 0.12, -1, 0.12, v2), 0.7);
      }
    }
  }

  // 2. habits, on whichever hands are free
  gestures(t: number, opts: LifeOpts, claimed: Set<Side>) {
    const rig = this.rig;
    const bothBusy = claimed.has('Left') && claimed.has('Right');
    const allowed = (opts.gestures ?? ['glasses', 'chin', 'nod']).filter((g) => NEEDS[g].every((s) => !claimed.has(s)) && !(g === 'glasses' && bothBusy));
    const dt = Math.max(0, t - this.lastT);
    this.lastT = t;
    // something is waiting: play the rest of this one at three times the speed
    if (this.gesture && this.queued) this.gesture.start -= dt * 2;
    if (!this.gesture && this.queued) {
      this.gesture = { name: this.queued, start: t, hand: claimed.has('Right') ? 'Left' : 'Right' };
      this.queued = null;
    }
    if (!this.gesture && t > this.nextGesture && allowed.length) {
      const name = allowed[Math.floor(this.rng() * allowed.length)];
      this.gesture = { name, start: t, hand: claimed.has('Right') ? 'Left' : 'Right' };
    }
    const g = this.gesture;
    if (!g) return;
    const k = (t - g.start) / DUR[g.name];
    if (k >= 1) {
      this.gesture = null;
      this.nextGesture = t + 5 + this.rng() * 6;
      return;
    }
    if (NEEDS[g.name].some((s) => claimed.has(s))) return;
    const chest = rig.restPos('Spine2');
    const w = envelope(k, g.name === 'glasses' ? 0.32 : 0.25, 0.32);

    if (g.name === 'glasses') {
      // index finger to the bridge, a little push up, hand back down (whichever hand is free)
      const h = g.hand;
      const sx = h === 'Right' ? -1 : 1;
      const push = k > 0.35 && k < 0.6 ? Math.sin(((k - 0.35) / 0.25) * Math.PI) * 0.012 : 0;
      // the fingertip goes to the bridge, so the wrist sits one finger-length below it
      const dir = rig.dirToWorld(-sx * 0.3, 0.88, 0.3, v2);
      const at = this.onFace(v1.set(this.bridge.x, this.bridge.y - 0.005 + push, this.bridge.z + 0.012), v1).addScaledVector(dir, -0.165);
      this.arcReach(h, at, rig.toWorld(sx * 0.55, chest.y - 0.6, -0.05, pole), w, 0.18);
      rig.handTo(h, dir, w);
      this.wantCurl[h] = { curl: 0.75 * w + 0.35 * (1 - w), index: 0.05, thumb: 0.45 };
    }
    if (g.name === 'wave') {
      // a hello: hand up beside the head, the forearm swinging from the elbow
      const swing = Math.sin((t - g.start) * 8.5) * envelope(k, 0.2, 0.3);
      this.arcReach('Right', rig.toWorld(-0.4 + swing * 0.06, chest.y + 0.42, 0.12, v1), rig.toWorld(-0.75, chest.y - 0.55, -0.2, pole), w, 0.25);
      rig.handTo('Right', rig.dirToWorld(-0.15 + swing * 0.35, 1, 0.2, v2), w);
      this.wantCurl.Right = { curl: 0.08, thumb: 0.12, index: 0.05 };
    }
    if (g.name === 'present') {
      // an open hand toward what's behind me: "it's all up there"
      this.arcReach('Left', rig.toWorld(0.56, chest.y - 0.12, 0.26, v1), rig.toWorld(0.75, chest.y - 0.6, -0.3, pole), w, 0.12);
      rig.handTo('Left', rig.dirToWorld(1, 0.3, 0.45, v2), w);
      this.wantCurl.Left = { curl: 0.12, thumb: 0.15, index: 0.08 };
    }
    if (g.name === 'chin') {
      // thinking: right hand at the chin, the left arm folded under the elbow
      // knuckles under the chin: the wrist sits a hand-length below and in front
      const dir = rig.dirToWorld(0.2, 0.85, -0.35, v2);
      const at = this.onFace(v1.set(this.bridge.x - 0.01, this.bridge.y - 0.125, this.bridge.z - 0.01), v1).addScaledVector(dir, -0.1);
      this.arcReach('Right', at, rig.toWorld(-0.25, chest.y - 0.55, 0.2, pole), w, 0.15);
      rig.handTo('Right', dir, w);
      this.arcReach('Left', rig.toWorld(-0.1, chest.y - 0.3, 0.2, v2), rig.toWorld(0.45, chest.y - 0.45, -0.1, pole), w, 0.1);
      rig.handTo('Left', rig.dirToWorld(-1, 0.1, 0.1, v2), w);
      this.wantCurl.Right = { curl: 0.6, index: 0.35, thumb: 0.3 };
      this.wantCurl.Left = { curl: 0.5, thumb: 0.3 };
    }
  }

  // 3. gaze and head, after everything else has moved the body
  head(t: number, dt: number, opts: LifeOpts, camera: THREE.Camera | null, focus: THREE.Vector3 | null) {
    const rig = this.rig;
    const head = rig.bone('Head');
    if (!head) return;
    const g = this.gesture;
    const gk = g ? (t - g.start) / DUR[g.name] : 0;

    if (opts.look !== false && camera) {
      const eye = head.getWorldPosition(v1);
      // where to look: you, or my work, with glances away now and then
      const want = v2;
      const working = !!focus;
      if (working) want.copy(focus);
      else want.copy(camera.position);
      if (t > this.nextGlance && !this.glance) {
        const away = this.rng();
        const side = this.rng() < 0.5 ? -1 : 1;
        const off = working
          ? camera.position.clone().sub(focus!) // look up from the work, at you
          : rig.dirToWorld(side * (0.6 + away * 0.6), -0.25 + this.rng() * 0.35, 0.4, new THREE.Vector3()).multiplyScalar(3);
        this.glance = { until: t + 0.9 + this.rng() * 1.1, offset: off };
      }
      if (this.glance) {
        want.add(this.glance.offset);
        if (t > this.glance.until) {
          this.glance = null;
          this.nextGlance = t + (working ? 2.5 : 3) + this.rng() * 4;
        }
      }
      if (g?.name === 'present' && gk > 0.1 && gk < 0.75) want.copy(rig.toWorld(1.6, 1.9, -2.2, new THREE.Vector3()));
      if (g?.name === 'chin') want.copy(eye).add(rig.dirToWorld(-0.6, 0.35, 1, v3).multiplyScalar(3)); // thinking, eyes up and away
      if (!this.gazeInit) {
        this.gaze.copy(want);
        this.gazeInit = true;
      }
      // heads turn quickly but not instantly
      this.gaze.lerp(want, 1 - Math.exp(-dt * 5));

      const dir = v3.copy(this.gaze).sub(eye).normalize();
      // keep it human: limit how far the head turns from where the chest faces
      const chest = rig.facing('Spine2', s1);
      const yawC = Math.atan2(chest.x, chest.z);
      let yaw = Math.atan2(dir.x, dir.z) - yawC;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      yaw = THREE.MathUtils.clamp(yaw, -1.0, 1.0);
      const pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)), -0.55, 0.3);
      const clamped = s2.set(Math.sin(yawC + yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yawC + yaw) * Math.cos(pitch));
      rig.face('Neck', clamped, 0.4);
      rig.face('Head', clamped, 1);
    }

    // a nod: two easy dips of the head
    if (g?.name === 'nod' && gk < 1) {
      rig.pitch('Head', Math.max(0, Math.sin(gk * Math.PI * 4)) * 0.16 * envelope(gk, 0.15, 0.2));
    }
    if (g?.name === 'glasses' && gk < 1) rig.pitch('Head', 0.07 * envelope(gk, 0.3, 0.3));
    if (g?.name === 'wave' && gk < 1) rig.turn('Head', rig.dirToWorld(0, 0, 1, v3), 0.07 * envelope(gk, 0.2, 0.3));
    if (g?.name === 'chin' && gk < 1) rig.turn('Head', rig.dirToWorld(0, 0, 1, v3), -0.08 * envelope(gk, 0.25, 0.3));
  }

  // 4. fingers, last of all: a prop's grip wins, then a gesture's, else relaxed
  fingers(dt: number, grips: Partial<Record<Side, Grip>>) {
    const k = 1 - Math.exp(-dt * 12);
    for (const side of ['Left', 'Right'] as const) {
      const want = grips[side] ?? this.wantCurl[side] ?? RELAXED;
      const s = this.shown[side];
      s.curl += (want.curl - s.curl) * k;
      s.thumb! += ((want.thumb ?? want.curl * 0.6) - s.thumb!) * k;
      s.index! += ((want.index ?? want.curl) - s.index!) * k;
      this.rig.curl(side, s.curl, { thumb: s.thumb, index: s.index });
      this.wantCurl[side] = null;
    }
  }
}
