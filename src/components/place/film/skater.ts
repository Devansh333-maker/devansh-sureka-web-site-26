import * as THREE from 'three';

// An anime skater, built for this film: a jointed figure (hips → spine → chest → neck →
// head, two arms, two legs on quad skates), toon-shaded in three flat steps with an ink
// outline around every part. Spiky hair, a headband whose tails trail in the wind, two
// thin bright eyes. Nobody in particular.

export type Joint =
  | 'hips'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | 'armL'
  | 'foreL'
  | 'handL'
  | 'armR'
  | 'foreR'
  | 'handR'
  | 'thighL'
  | 'shinL'
  | 'footL'
  | 'thighR'
  | 'shinR'
  | 'footR';

export const LEG = { hip: 0.04, thigh: 0.44, shin: 0.42, skate: 0.14 };
export const STAND = LEG.hip + LEG.thigh + LEG.shin + LEG.skate; // hip height, legs straight

let ramp: THREE.DataTexture | null = null;
function toonRamp() {
  if (ramp) return ramp;
  const d = new Uint8Array([70, 70, 70, 255, 165, 165, 165, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}
const toon = (color: string, extra: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...extra });

// the ink line: the same shape, pushed out along its normals, back faces only
export const INK = new THREE.ShaderMaterial({
  uniforms: { thick: { value: 0.011 }, color: { value: new THREE.Color('#0b0908') } },
  vertexShader: `uniform float thick; void main(){ vec3 p = position + normal * thick; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
  fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }`,
  side: THREE.BackSide,
});

export type Skater = {
  root: THREE.Group;
  J: Record<Joint, THREE.Object3D>;
  wheels: THREE.Mesh[];
  tails: THREE.Object3D[];
  eyes: THREE.MeshBasicMaterial;
  mats: THREE.MeshToonMaterial[];
};

export function buildSkater(): Skater {
  const root = new THREE.Group();
  const J = {} as Record<Joint, THREE.Object3D>;
  const mats: THREE.MeshToonMaterial[] = [];
  const joint = (name: Joint, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    J[name] = o;
    return o;
  };
  const part = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
    ink = true,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.scale.set(...scale);
    m.castShadow = true;
    parent.add(m);
    if (ink) m.add(new THREE.Mesh(geo, INK));
    if (mat instanceof THREE.MeshToonMaterial) mats.push(mat);
    return m;
  };
  const limb = (r0: number, r1: number, len: number) => new THREE.CylinderGeometry(r0, r1, len, 14, 1);

  const jersey = toon('#e2452a');
  const jerseyDark = toon('#a8301d');
  const tights = toon('#181b26');
  const skin = toon('#e0b08a');
  const hair = toon('#141724');
  const lime = toon('#c6f24a');
  const boot = toon('#23262d');
  const pad = toon('#2c313b');
  const wheelMat = toon('#ff7a2e', { emissive: new THREE.Color('#ff5a1a'), emissiveIntensity: 0.35 });
  const eyes = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });

  // ── the body ──
  const hips = joint('hips', root, 0, STAND, 0);
  part(new THREE.CapsuleGeometry(0.15, 0.06, 6, 16), tights, hips, [0, -0.02, 0], [0, 0, Math.PI / 2], [0.9, 1.15, 0.75]);
  const spine = joint('spine', hips, 0, 0.1, 0);
  part(new THREE.CapsuleGeometry(0.13, 0.08, 6, 16), jersey, spine, [0, 0.04, 0], [0, 0, 0], [1.1, 1, 0.72]);
  const chest = joint('chest', spine, 0, 0.18, 0);
  part(new THREE.CapsuleGeometry(0.165, 0.12, 6, 18), jersey, chest, [0, 0.07, 0], [0, 0, 0], [1.18, 1, 0.7]);
  // side panels, darker, give the torso a shape in flat light
  for (const sx of [-1, 1]) part(new THREE.BoxGeometry(0.03, 0.32, 0.17), jerseyDark, chest, [sx * 0.175, 0.03, 0], [0, 0, sx * 0.12], [1, 1, 1], false);
  const neck = joint('neck', chest, 0, 0.21, 0);
  part(limb(0.048, 0.052, 0.1), skin, neck, [0, 0.03, 0]);
  const head = joint('head', neck, 0, 0.09, 0);
  part(new THREE.SphereGeometry(0.105, 24, 18), skin, head, [0, 0.1, 0.005], [0, 0, 0], [0.9, 1.08, 1]);
  // jaw, a little pointed, the anime way
  part(new THREE.ConeGeometry(0.07, 0.08, 16), skin, head, [0, 0.025, 0.03], [Math.PI, 0, 0], [1, 1, 0.9]);
  // eyes: two thin slanted lights, and brows over them
  for (const sx of [-1, 1]) {
    // a dark almond with a bright glint in it
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), INK);
    e.scale.set(1.05, 0.55, 0.35);
    e.position.set(sx * 0.037, 0.098, 0.093);
    e.rotation.z = sx * -0.2;
    head.add(e);
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.0065, 10), eyes);
    glint.position.set(sx * 0.037 + 0.006, 0.102, 0.1);
    head.add(glint);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.006), INK);
    brow.position.set(sx * 0.038, 0.125, 0.096);
    brow.rotation.z = sx * -0.35;
    head.add(brow);
  }
  // hair: a cap and a crown of spikes swept back
  part(new THREE.SphereGeometry(0.113, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, head, [0, 0.115, -0.008], [-0.25, 0, 0], [0.95, 1.05, 1.05]);
  const spikes: [number, number, number, number, number, number][] = [
    // x, y, z, rotX, rotZ, length
    [0, 0.2, 0.06, -0.5, 0, 0.12],
    [0.05, 0.19, 0.05, -0.4, -0.45, 0.11],
    [-0.05, 0.19, 0.05, -0.4, 0.45, 0.11],
    [0.085, 0.15, 0.02, -0.7, -1.0, 0.1],
    [-0.085, 0.15, 0.02, -0.7, 1.0, 0.1],
    [0, 0.2, -0.04, -1.2, 0, 0.15],
    [0.06, 0.18, -0.05, -1.3, -0.5, 0.14],
    [-0.06, 0.18, -0.05, -1.3, 0.5, 0.14],
    [0.03, 0.13, -0.1, -2.0, -0.3, 0.13],
    [-0.03, 0.13, -0.1, -2.0, 0.3, 0.13],
    [0, 0.08, -0.11, -2.4, 0, 0.11],
    [0.075, 0.1, -0.08, -2.1, -0.8, 0.1],
    [-0.075, 0.1, -0.08, -2.1, 0.8, 0.1],
    // fringe over the forehead
    [0.03, 0.17, 0.095, 0.5, -0.3, 0.07],
    [-0.035, 0.165, 0.095, 0.55, 0.35, 0.065],
  ];
  for (const [x, y, z, rx, rz, l] of spikes) part(new THREE.ConeGeometry(0.032, l, 8), hair, head, [x, y, z], [rx, 0, rz]);
  // the headband, and its tails
  part(new THREE.TorusGeometry(0.104, 0.013, 8, 32), lime, head, [0, 0.135, 0.004], [Math.PI / 2 - 0.18, 0, 0], [0.92, 1.05, 1]);
  const tails: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const t = new THREE.Object3D();
    t.position.set(sx * 0.02, 0.12, -0.1);
    head.add(t);
    const strip = new THREE.PlaneGeometry(0.026, 0.24);
    strip.translate(0, -0.12, 0);
    part(strip, toon('#c6f24a', { side: THREE.DoubleSide }), t, [0, 0, 0], [0, 0, sx * 0.12], [1, 1, 1], false);
    tails.push(t);
  }

  // ── arms ──
  for (const [side, sx] of [
    ['L', 1],
    ['R', -1],
  ] as const) {
    const arm = joint(`arm${side}`, chest, sx * 0.205, 0.17, 0);
    part(new THREE.SphereGeometry(0.07, 16, 12), jersey, arm, [0, -0.01, 0]);
    part(limb(0.066, 0.06, 0.13), jersey, arm, [0, -0.07, 0]);
    part(limb(0.05, 0.043, 0.28), skin, arm, [0, -0.15, 0]);
    const fore = joint(`fore${side}`, arm, 0, -0.29, 0);
    part(new THREE.SphereGeometry(0.044, 12, 10), skin, fore, [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    part(limb(0.043, 0.036, 0.25), skin, fore, [0, -0.125, 0]);
    part(limb(0.041, 0.041, 0.05), lime, fore, [0, -0.215, 0]);
    const hand = joint(`hand${side}`, fore, 0, -0.26, 0);
    part(new THREE.SphereGeometry(0.046, 14, 12), skin, hand, [0, -0.035, 0.005], [0, 0, 0], [0.85, 1.1, 0.75]);
  }

  // ── legs, on quad skates ──
  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.032, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [side, sx] of [
    ['L', 1],
    ['R', -1],
  ] as const) {
    const thigh = joint(`thigh${side}`, hips, sx * 0.1, -LEG.hip, 0);
    part(limb(0.088, 0.066, LEG.thigh), tights, thigh, [0, -LEG.thigh / 2, 0]);
    const shin = joint(`shin${side}`, thigh, 0, -LEG.thigh, 0);
    part(new THREE.SphereGeometry(0.075, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), pad, shin, [0, -0.02, 0.025], [Math.PI / 2, 0, 0], [0.9, 0.9, 0.75]);
    part(limb(0.06, 0.044, LEG.shin), tights, shin, [0, -LEG.shin / 2, 0]);
    const foot = joint(`foot${side}`, shin, 0, -LEG.shin, 0);
    part(new THREE.BoxGeometry(0.1, 0.12, 0.25), boot, foot, [0, -0.02, 0.045]);
    part(new THREE.BoxGeometry(0.085, 0.016, 0.27), lime, foot, [0, -0.086, 0.045], [0, 0, 0], [1, 1, 1], false);
    for (const z of [-0.045, 0.135])
      for (const x of [-0.05, 0.05]) {
        const w = part(wheelGeo, wheelMat, foot, [x, -LEG.skate + 0.036, z], [0, 0, 0], [1, 1, 1], false);
        wheels.push(w);
      }
  }

  return { root, J, wheels, tails, eyes, mats };
}
