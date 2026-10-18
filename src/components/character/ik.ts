import * as THREE from 'three';

// A small procedural layer that runs after the motion-captured clip each frame.
// Two-bone IK puts a hand or foot exactly where a scene needs it (on a clipboard,
// on top of a dribbled ball, pushing off on a skate) and works in world space, so it
// doesn't care how each bone's local axes happen to be set up.

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _t = new THREE.Vector3();
const _e = new THREE.Vector3();
const _p = new THREE.Vector3();
const _d = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _fwd = new THREE.Vector3();
const _across = new THREE.Vector3();
const _palm = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _axis = new THREE.Vector3();
const KNUCKLE = [1.0, 1.45, 1.0];
const THUMB = [0.35, 0.4, 0.45];
const FINGERS = ['Index', 'Middle', 'Ring', 'Pinky'];
const FINGER_NAMES = {
  Left: FINGERS.map((f) => [1, 2, 3].map((j) => `LeftHand${f}${j}`)),
  Right: FINGERS.map((f) => [1, 2, 3].map((j) => `RightHand${f}${j}`)),
};
const THUMB_NAMES = { Left: [1, 2, 3].map((j) => `LeftHandThumb${j}`), Right: [1, 2, 3].map((j) => `RightHandThumb${j}`) };
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export type Side = 'Left' | 'Right';

// sign that makes cross(fingers, index→pinky) point out of each palm
const PALM: Record<Side, number> = { Left: -1, Right: 1 };

// rotate a bone so that world vector `from` turns into world vector `to`
function aim(bone: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, weight = 1) {
  if (from.lengthSq() < 1e-10 || to.lengthSq() < 1e-10) return;
  _q.setFromUnitVectors(_v1.copy(from).normalize(), _v2.copy(to).normalize());
  if (weight < 1) _q.slerp(_q2.identity(), 1 - weight);
  bone.getWorldQuaternion(_q2);
  _q2.premultiply(_q); // new world rotation
  setWorldQuaternion(bone, _q2);
}

function setWorldQuaternion(bone: THREE.Object3D, world: THREE.Quaternion) {
  const parent = bone.parent!;
  parent.getWorldQuaternion(_q);
  bone.quaternion.copy(_q.invert().multiply(world));
  bone.updateMatrixWorld(true);
}

export class Rig {
  readonly root: THREE.Object3D;
  private bones = new Map<string, THREE.Bone>();
  // each bone's rest rotation, relative to the character root (for keeping feet flat)
  private rest = new Map<string, THREE.Quaternion>();
  private hipsRest = new THREE.Vector3();
  private restAt = new Map<string, THREE.Vector3>();

  constructor(root: THREE.Object3D, skeleton: THREE.Skeleton) {
    this.root = root;
    skeleton.bones.forEach((b) => this.bones.set(b.name, b));
    // read rest rotations at bind pose
    const saved = skeleton.bones.map((b) => [b.position.clone(), b.quaternion.clone()] as const);
    skeleton.pose();
    root.updateWorldMatrix(true, true);
    const rootQ = root.getWorldQuaternion(new THREE.Quaternion()).invert();
    skeleton.bones.forEach((b) => this.rest.set(b.name, b.getWorldQuaternion(new THREE.Quaternion()).premultiply(rootQ)));
    skeleton.bones.forEach((b) => this.restAt.set(b.name, root.worldToLocal(b.getWorldPosition(new THREE.Vector3()))));
    this.hipsRest.copy(this.bones.get('Hips')?.position ?? new THREE.Vector3());
    skeleton.bones.forEach((b, i) => {
      b.position.copy(saved[i][0]);
      b.quaternion.copy(saved[i][1]);
    });
    root.updateWorldMatrix(true, true);
  }

  // where a bone sits at bind pose, in the character's own space
  restPos(name: string) {
    return this.restAt.get(name) ?? new THREE.Vector3();
  }

  bone(name: string) {
    return this.bones.get(name);
  }

  // how a bone has turned since bind pose, as a world rotation: carries anything fixed
  // to that bone (a point on the face, the way the head faces) along with it
  carry(name: string, out = new THREE.Quaternion()) {
    const b = this.bones.get(name);
    const r = this.rest.get(name);
    if (!b || !r) return this.root.getWorldQuaternion(out);
    return b.getWorldQuaternion(out).multiply(_q.copy(r).invert());
  }

  // which way a bone "faces" now (the character's forward, carried by that bone)
  facing(name: string, out = new THREE.Vector3()) {
    return out.set(0, 0, 1).applyQuaternion(this.carry(name, _q2));
  }

  // turn a bone so its facing moves toward a world direction, by `weight`, never more than `max` radians
  face(name: string, dir: THREE.Vector3, weight = 1, max = Math.PI) {
    const b = this.bones.get(name);
    if (!b || weight <= 0) return;
    const from = this.facing(name, _v1);
    const angle = from.angleTo(dir);
    if (angle < 1e-4) return;
    const k = Math.min(weight, max / angle);
    _q.setFromUnitVectors(from, _v2.copy(dir).normalize());
    _q.slerp(_q2.identity(), 1 - k);
    b.getWorldQuaternion(_q2);
    _q2.premultiply(_q);
    setWorldQuaternion(b, _q2);
  }

  // close a hand. `amount` 0 = open and relaxed-straight, 1 = a fist. `pinch` keeps the
  // index and thumb out for holding a pen; `point` keeps the index straight.
  curl(side: Side, amount: number, opts: { thumb?: number; index?: number } = {}) {
    const hand = this.bones.get(`${side}Hand`);
    const mid = this.bones.get(`${side}HandMiddle1`);
    const idx = this.bones.get(`${side}HandIndex1`);
    const pinky = this.bones.get(`${side}HandPinky1`);
    if (!hand || !mid || !idx || !pinky) return;
    // runs every frame for both hands, so it reuses scratch vectors and cached names
    hand.getWorldPosition(_a);
    mid.getWorldPosition(_b);
    const fwd = _fwd.subVectors(_b, _a).normalize();
    pinky.getWorldPosition(_c);
    idx.getWorldPosition(_t);
    const across = _across.subVectors(_c, _t).normalize();
    // out of the palm (mirrored hands flip the cross product)
    const palm = _palm.crossVectors(fwd, across).multiplyScalar(PALM[side]).normalize();
    const names = FINGER_NAMES[side];
    const amounts = [opts.index ?? amount, amount, amount * 1.05, amount * 1.1];
    for (let f = 0; f < 4; f++) {
      const chain = names[f];
      for (let j = 0; j < 3; j++) {
        const bone = this.bones.get(chain[j]);
        if (!bone) continue;
        bone.getWorldPosition(_a);
        if (j < 2) {
          const next = this.bones.get(chain[j + 1]);
          if (!next) continue;
          _dir.subVectors(next.getWorldPosition(_b), _a);
        } else {
          const prev = this.bones.get(chain[j - 1]);
          if (!prev) continue;
          _dir.subVectors(_a, prev.getWorldPosition(_b));
        }
        _axis.crossVectors(_dir.normalize(), palm).normalize();
        // first knuckle bends least, middle joint most
        this.turn(bone.name, _axis, amounts[f] * KNUCKLE[j]);
      }
    }
    // the thumb folds in across the palm
    const th = opts.thumb ?? amount * 0.6;
    const thumbs = THUMB_NAMES[side];
    for (let j = 0; j < 3; j++) {
      if (!this.bones.get(thumbs[j])) continue;
      this.turn(thumbs[j], fwd, (side === 'Left' ? -1 : 1) * PALM[side] * th * THUMB[j]);
    }
  }

  world(name: string, out = new THREE.Vector3()) {
    const b = this.bones.get(name);
    return b ? b.getWorldPosition(out) : out.set(0, 0, 0);
  }

  // a direction given in the character's own space → world
  dirToWorld(x: number, y: number, z: number, out = new THREE.Vector3()) {
    return out.set(x, y, z).normalize().applyQuaternion(this.root.getWorldQuaternion(_q));
  }

  // put the hips back where the skeleton keeps them (clips don't move them)
  resetHips() {
    const hips = this.bones.get('Hips');
    if (!hips) return;
    hips.position.copy(this.hipsRest);
    hips.updateMatrixWorld(true);
  }

  // a point given in the character's own space (metres, facing +z) → world
  toWorld(x: number, y: number, z: number, out = new THREE.Vector3()) {
    return this.root.localToWorld(out.set(x, y, z));
  }

  // two-bone IK: upper → lower → end reaches `target`, bending toward `pole`
  private chain(upper: string, lower: string, end: string, target: THREE.Vector3, pole: THREE.Vector3, weight: number) {
    const u = this.bones.get(upper);
    const l = this.bones.get(lower);
    const e = this.bones.get(end);
    if (!u || !l || !e || weight <= 0) return;
    u.getWorldPosition(_a);
    l.getWorldPosition(_b);
    e.getWorldPosition(_c);
    // blend the goal from where the animation put the hand/foot
    _t.copy(_c).lerp(target, Math.min(1, weight));
    const l1 = _a.distanceTo(_b);
    const l2 = _b.distanceTo(_c);
    _d.subVectors(_t, _a);
    const dist = THREE.MathUtils.clamp(_d.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
    _d.normalize();
    // bend plane from the pole
    _p.subVectors(pole, _a);
    _p.addScaledVector(_d, -_p.dot(_d));
    if (_p.lengthSq() < 1e-8) _p.set(0, -1, 0).addScaledVector(_d, -_d.y);
    _p.normalize();
    const cosA = THREE.MathUtils.clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    _e.copy(_a).addScaledVector(_d, l1 * cosA).addScaledVector(_p, l1 * sinA); // the elbow/knee
    // upper bone: point at the elbow
    aim(u, _v1.subVectors(_b, _a).clone(), _v2.subVectors(_e, _a).clone());
    // lower bone: point at the target
    l.getWorldPosition(_b);
    e.getWorldPosition(_c);
    _t.copy(_a).addScaledVector(_d, dist);
    aim(l, _v1.subVectors(_c, _b).clone(), _v2.subVectors(_t, _b).clone());
  }

  // put a hand on `target` (world). Elbow bends toward `pole` (world point).
  reach(side: Side, target: THREE.Vector3, pole: THREE.Vector3, weight = 1) {
    this.chain(`${side}Arm`, `${side}ForeArm`, `${side}Hand`, target, pole, weight);
  }

  // point the hand along a world direction (fingers toward `dir`)
  handTo(side: Side, dir: THREE.Vector3, weight = 1) {
    const h = this.bones.get(`${side}Hand`);
    const f = this.bones.get(`${side}HandMiddle1`);
    if (!h || !f) return;
    h.getWorldPosition(_a);
    f.getWorldPosition(_b);
    aim(h, _b.sub(_a).clone(), dir, weight);
  }

  // put a foot on `target`, knee toward `pole`, sole flat on the ground, toes yawed
  step(side: Side, target: THREE.Vector3, pole: THREE.Vector3, yaw = 0, pitch = 0, weight = 1) {
    this.chain(`${side}UpLeg`, `${side}Leg`, `${side}Foot`, target, pole, weight);
    const foot = this.bones.get(`${side}Foot`);
    const r = this.rest.get(`${side}Foot`);
    if (!foot || !r) return;
    this.root.getWorldQuaternion(_q2);
    const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    const world = _q2.clone().multiply(want).multiply(r);
    if (weight < 1) world.copy(foot.getWorldQuaternion(new THREE.Quaternion()).slerp(world, weight));
    setWorldQuaternion(foot, world);
  }

  // turn a bone about a world axis (e.g. lean the spine forward)
  turn(name: string, axis: THREE.Vector3, angle: number) {
    const b = this.bones.get(name);
    if (!b || !angle) return;
    b.getWorldQuaternion(_q2);
    _q.setFromAxisAngle(axis, angle);
    _q2.premultiply(_q);
    setWorldQuaternion(b, _q2);
  }

  // bend about the character's own side-to-side axis (positive = forward)
  pitch(name: string, angle: number) {
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(this.root.getWorldQuaternion(_q));
    this.turn(name, axis, angle);
  }

  // move the hips up/down in the character's own space (crouch for skating)
  drop(dy: number, dz = 0, dx = 0) {
    const hips = this.bones.get('Hips');
    if (!hips || !hips.parent) return;
    this.resetHips();
    hips.getWorldPosition(_a);
    this.root.localToWorld(_b.set(0, 0, 0));
    this.root.localToWorld(_c.set(dx, -dy, dz)).sub(_b); // world offset
    _a.add(_c);
    hips.parent.worldToLocal(_a);
    hips.position.copy(_a);
    hips.updateMatrixWorld(true);
  }
}
