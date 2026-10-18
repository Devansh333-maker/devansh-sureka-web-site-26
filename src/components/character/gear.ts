import * as THREE from 'three';
import type { Rig, Side } from './ik';
import type { Grip } from './life';

// Accessories for each outfit. Everything is built in the avatar's own space at rest
// pose (metres, character facing +Z), then attached to a bone so it follows the
// animation. Sizes are realistic for a 1.8 m person.

export type Outfit = 'guide' | 'workshop' | 'studio' | 'commons' | 'arena' | 'press' | 'notebook' | 'work';

type Anchor =
  | 'Head'
  | 'Neck'
  | 'Spine2'
  | 'Spine1'
  | 'Hips'
  | 'LeftHand'
  | 'RightHand'
  | 'LeftLeg'
  | 'RightLeg'
  | 'LeftFoot'
  | 'RightFoot'
  | 'LeftUpLeg'
  | 'RightUpLeg'
  | 'LeftArm'
  | 'RightArm'
  | 'LeftForeArm'
  | 'RightForeArm';
// held props ride on the torso; each frame `update` moves them and puts the hands on them
export type GearCtx = { rig: Rig; L: number };
export type GearPiece = {
  anchor: Anchor;
  object: THREE.Object3D;
  update?: (ctx: GearCtx, t: number) => void;
  hands?: Partial<Record<Side, Grip>>; // how each hand closes round it
  focus?: THREE.Object3D; // what I look at while I'm using it
};
export type Points = Record<Anchor, THREE.Vector3>;

const std = (color: string, rough = 0.6, metal = 0, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal, ...extra });

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number] = [0, 0, 0], r: [number, number, number] = [0, 0, 0]) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(...p);
  o.rotation.set(...r);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
};

function hardHat(head: THREE.Vector3) {
  const g = new THREE.Group();
  const shell = std('#f2b705', 0.35, 0, { clearcoat: 0.6, clearcoatRoughness: 0.25 });
  g.add(mesh(new THREE.SphereGeometry(0.125, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), shell));
  g.add(mesh(new THREE.CylinderGeometry(0.145, 0.15, 0.012, 40), shell, [0, 0.002, 0.012]));
  // front peak
  const peak = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 24, 1, false, -Math.PI / 2, Math.PI), shell, [0, 0.004, 0.13]);
  g.add(peak);
  // centre ridge
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 0.24), shell, [0, 0.118, 0]));
  g.position.set(head.x, head.y + 0.145, head.z + 0.005);
  return g;
}

function hiVis(chest: THREE.Vector3) {
  const g = new THREE.Group();
  const vest = std('#ff7a1a', 0.78, 0, { sheen: 0.5, sheenColor: new THREE.Color('#ffc69a'), side: THREE.DoubleSide });
  const band = std('#e4e9ee', 0.22, 0.65, { side: THREE.DoubleSide });
  // torso profile (radius, height relative to the chest bone): waist → chest → shoulders
  const profile = [
    [0.165, -0.34],
    [0.17, -0.24],
    [0.178, -0.12],
    [0.19, -0.02],
    [0.188, 0.07],
    [0.165, 0.14],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const gap = 0.16; // open down the front, like a zip vest
  const body = mesh(new THREE.LatheGeometry(profile, 48, gap, Math.PI * 2 - gap * 2), vest);
  body.scale.set(1.08, 1, 0.8);
  g.add(body);
  // two reflective bands that follow the same shape
  for (const [y0, y1] of [
    [-0.27, -0.24],
    [-0.12, -0.09],
  ]) {
    const r0 = 0.172 + (y0 + 0.27) * 0.05;
    const strip = mesh(new THREE.LatheGeometry([new THREE.Vector2(r0 + 0.004, y0), new THREE.Vector2(r0 + 0.006, y1)], 48, gap, Math.PI * 2 - gap * 2), band);
    strip.scale.set(1.08, 1, 0.8);
    g.add(strip);
  }
  // shoulder straps
  for (const side of [-1, 1]) {
    const strap = mesh(new THREE.TorusGeometry(0.09, 0.016, 6, 16, Math.PI), vest, [side * 0.1, 0.13, 0], [0, Math.PI / 2, 0]);
    strap.scale.set(1, 0.55, 1.35);
    g.add(strap);
  }
  g.position.copy(chest);
  return g;
}

function nssBadge(chest: THREE.Vector3) {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.fillStyle = '#8e1b2a';
  x.beginPath();
  x.arc(64, 64, 60, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#f2d16b';
  x.lineWidth = 8;
  x.stroke();
  x.fillStyle = '#f7efe0';
  x.font = 'bold 40px Georgia, serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('NSS', 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  g.add(mesh(new THREE.CircleGeometry(0.028, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.2 })));
  g.position.set(chest.x + 0.085, chest.y + 0.02, chest.z + 0.125);
  return g;
}

const _w = new THREE.Vector3();
const _w2 = new THREE.Vector3();
const _pole = new THREE.Vector3();
const ease = (t: number) => t * t * (3 - 2 * t);

// a world point for an elbow to bend toward: out to the side, down and back
function elbowPole(rig: Rig, side: number, chest: THREE.Vector3) {
  return rig.toWorld(chest.x + side * 0.55, chest.y - 0.55, chest.z - 0.35, _pole);
}

function marker(parent: THREE.Object3D, x: number, y: number, z: number) {
  const m = new THREE.Object3D();
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// a pen that stands up off a page; its tip is the group's origin
function pen() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.13, 10), std('#15171c', 0.35, 0.3), [0, 0, -0.065], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.ConeGeometry(0.0045, 0.012, 10), std('#c8a24a', 0.3, 0.8), [0, 0, -0.002], [-Math.PI / 2, 0, 0]));
  g.rotation.set(0.35, 0.25, 0); // leaning back, like a held pen
  return g;
}

// clipboard, notebook or magazine, held open in front of the chest at reading angle.
// The page faces back up at me (its -z side), so whoever is in front sees the cover.
function held(kind: 'clipboard' | 'notebook' | 'magazine', chest: THREE.Vector3, L: number) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  outer.add(g);
  const colour = kind === 'clipboard' ? '#a77a4a' : kind === 'notebook' ? '#1d2a3a' : '#c2402a';
  const spread = kind === 'magazine';
  const w = spread ? 0.42 : 0.21;
  const h = spread ? 0.29 : 0.28;
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.01), std(colour, 0.7)));
  const paper = std('#f4efe4', 0.92);
  if (spread) {
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(w / 2 - 0.012, h - 0.016, 0.004), paper, [(s * w) / 4, 0, -0.007], [0, s * 0.08, 0]));
  } else {
    g.add(mesh(new THREE.BoxGeometry(w - 0.02, h - 0.03, 0.003), paper, [0, -0.006, -0.007]));
    // ruled lines
    const rule = std('#9fb3c8', 0.9);
    for (let i = 0; i < 9; i++) g.add(mesh(new THREE.BoxGeometry(w - 0.05, 0.002, 0.001), rule, [0, 0.09 - i * 0.022, -0.0095]));
  }
  if (kind === 'clipboard') g.add(mesh(new THREE.BoxGeometry(0.07, 0.025, 0.02), std('#9aa0a6', 0.3, 0.8), [0, h / 2 - 0.012, -0.012]));
  // reading angle: top edge away from me, page tilted up toward my eyes
  g.rotation.set(0.95, spread ? 0 : -L * 0.18, 0);
  outer.position.set(chest.x + (spread ? 0 : L * 0.05), chest.y - 0.12, chest.z + 0.27);
  const gripA = marker(g, (L * w) / 2 - L * 0.01, -0.03, 0);
  const gripB = spread ? marker(g, (-L * w) / 2 + L * 0.01, -0.03, 0) : null;
  let tip: THREE.Object3D | null = null;
  let grip: THREE.Object3D | null = null;
  if (!spread) {
    const p = pen();
    p.position.set(0, 0, -0.011);
    g.add(p);
    tip = p;
    grip = marker(p, 0, 0, -0.085);
  }

  const update = ({ rig }: GearCtx, t: number) => {
    // a little life in the hold
    g.position.y = Math.sin(t * 0.9) * 0.006;
    const side = L > 0 ? 'Left' : 'Right';
    const other = L > 0 ? 'Right' : 'Left';
    rig.reach(side, gripA.getWorldPosition(_w), elbowPole(rig, L, chest));
    rig.handTo(side, rig.dirToWorld(-L * 0.4, 0.1, 1, _w2));
    if (gripB) {
      rig.reach(other, gripB.getWorldPosition(_w), elbowPole(rig, -L, chest));
      rig.handTo(other, rig.dirToWorld(L * 0.4, 0.1, 1, _w2));
    }
    if (tip && grip) {
      // write a line, pause and read it back, write the next
      const cycle = 6.5;
      const k = (t % cycle) / cycle;
      const line = Math.floor(t / cycle) % 5;
      const writing = k < 0.62;
      const x = writing ? -0.06 + (k / 0.62) * 0.12 : 0.06 - ease((k - 0.62) / 0.38) * 0.12;
      const lift = writing ? 0 : Math.sin(((k - 0.62) / 0.38) * Math.PI) * 0.025;
      tip.position.set(-L * x, 0.06 - line * 0.022 + (writing ? Math.sin(t * 38) * 0.003 : 0), -0.011 - lift);
      rig.reach(other, grip.getWorldPosition(_w), elbowPole(rig, -L, chest));
      rig.handTo(other, rig.dirToWorld(L * 0.25, -0.75, 0.6, _w2));
    }
  };
  const hold: Grip = { curl: 0.5, thumb: 0.55, index: 0.45 };
  const pinch: Grip = { curl: 0.82, thumb: 0.5, index: 0.42 };
  const a: Side = L > 0 ? 'Left' : 'Right';
  const b: Side = L > 0 ? 'Right' : 'Left';
  const hands: Partial<Record<Side, Grip>> = { [a]: hold, [b]: spread ? hold : pinch };
  return { object: outer, update, hands, focus: tip ?? g };
}

// coffee: held low, a sip every few seconds
function mug(chest: THREE.Vector3, head: THREE.Vector3, L: number) {
  const R = -L;
  const outer = new THREE.Group();
  const g = new THREE.Group();
  outer.add(g);
  // cream ceramic with a teal band: reads clearly against a dark room and a white shirt
  const ceramic = std('#efe7d8', 0.3, 0, { clearcoat: 0.7 });
  g.add(mesh(new THREE.CylinderGeometry(0.044, 0.04, 0.105, 28), ceramic));
  g.add(mesh(new THREE.CylinderGeometry(0.0445, 0.0435, 0.022, 28), std('#2b7383', 0.35), [0, 0.012, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.026, 0.008, 10, 20), ceramic, [R * 0.05, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.004, 24), std('#3b2416', 0.2), [0, 0.046, 0]));
  const hold = new THREE.Vector3(chest.x + R * 0.15, chest.y - 0.17, chest.z + 0.25);
  const sip = new THREE.Vector3(head.x + R * 0.02, head.y, head.z + 0.16);
  outer.position.copy(hold);
  const grip = marker(g, R * 0.07, -0.005, -0.01);
  const update = ({ rig }: GearCtx, t: number) => {
    const cycle = 8;
    const k = t % cycle;
    // hold, raise 0.9 s, sip 1.3 s, lower 0.9 s
    const up = k < 4.9 ? 0 : k < 5.8 ? ease((k - 4.9) / 0.9) : k < 7.1 ? 1 : 1 - ease((k - 7.1) / 0.9);
    g.position.subVectors(sip, hold).multiplyScalar(up);
    g.rotation.x = -0.55 * up;
    const side = R > 0 ? 'Left' : 'Right';
    rig.reach(side, grip.getWorldPosition(_w), elbowPole(rig, R, chest));
    rig.handTo(side, rig.dirToWorld(-R * 0.6, 0.2 + up * 0.5, 0.8, _w2));
  };
  const hands: Partial<Record<Side, Grip>> = { [R > 0 ? 'Left' : 'Right']: { curl: 0.88, thumb: 0.6, index: 0.8 } };
  return { object: outer, update, hands };
}

// a rolled drawing, held by my side
function roll(hips: THREE.Vector3, L: number) {
  const outer = new THREE.Group();
  const tube = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 18), std('#efe6d2', 0.9));
  tube.rotation.set(0.25, 0, L * 0.08);
  outer.add(tube);
  tube.add(mesh(new THREE.TorusGeometry(0.031, 0.004, 6, 18), std('#b5562a', 0.6), [0, -0.12, 0], [Math.PI / 2, 0, 0]));
  outer.position.set(hips.x + L * 0.25, hips.y - 0.12, hips.z + 0.1);
  const grip = marker(tube, 0, 0.05, 0);
  const update = ({ rig }: GearCtx) => {
    const side = L > 0 ? 'Left' : 'Right';
    rig.reach(side, grip.getWorldPosition(_w), rig.toWorld(hips.x + L * 0.5, hips.y + 0.2, hips.z - 0.4, _pole));
    rig.handTo(side, rig.dirToWorld(-L * 0.3, -0.6, 0.7, _w2));
  };
  const hands: Partial<Record<Side, Grip>> = { [L > 0 ? 'Left' : 'Right']: { curl: 0.92, thumb: 0.7 } };
  return { object: outer, update, hands };
}

// Univest ID on a lanyard
function lanyard(chest: THREE.Vector3, neck: THREE.Vector3) {
  const g = new THREE.Group();
  const cord = std('#1f6feb', 0.6);
  for (const s of [-1, 1]) {
    // two straps from behind the collar down to the card
    const strap = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), cord, [s * 0.045, neck.y - chest.y - 0.12, 0.13], [0.35, 0, -s * 0.25]);
    g.add(strap);
  }
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 180;
  const x = c.getContext('2d')!;
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, 128, 180);
  x.fillStyle = '#1f6feb';
  x.fillRect(0, 0, 128, 40);
  x.fillStyle = '#ffffff';
  x.font = 'bold 22px Arial, sans-serif';
  x.textAlign = 'center';
  x.fillText('UNIVEST', 64, 28);
  x.fillStyle = '#c9d3e0';
  x.fillRect(34, 54, 60, 60);
  x.fillStyle = '#14171c';
  x.font = 'bold 15px Arial, sans-serif';
  x.fillText('DEVANSH', 64, 138);
  x.font = '11px Arial, sans-serif';
  x.fillText('AI Automation', 64, 156);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const card = mesh(new THREE.PlaneGeometry(0.055, 0.078), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, side: THREE.DoubleSide }), [0, neck.y - chest.y - 0.27, 0.17], [-0.15, 0, 0]);
  g.add(card);
  g.position.copy(chest);
  return g;
}

// waxed-canvas printer's apron: ink on it, the magazine's stamp on the pocket
function apronCloth(withPocket: boolean) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#a9875c';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = `rgba(${Math.random() < 0.5 ? '60,40,20' : '255,240,210'},${Math.random() * 0.06})`;
    x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  x.strokeStyle = 'rgba(70,48,26,0.8)';
  x.setLineDash([5, 4]);
  x.lineWidth = 2;
  x.strokeRect(8, 8, 240, 240);
  if (withPocket) {
    x.strokeRect(70, 90, 116, 70);
    x.setLineDash([]);
    x.fillStyle = 'rgba(194,64,42,0.85)';
    x.font = 'bold 22px Georgia, serif';
    x.textAlign = 'center';
    x.fillText('L.I.T.E.', 128, 132);
  }
  x.setLineDash([]);
  // ink smudges and thumbprints
  for (const [px, py, r, a] of [
    [60, 200, 14, 0.55],
    [190, 60, 9, 0.4],
    [170, 210, 6, 0.6],
    [40, 70, 5, 0.35],
  ]) {
    x.fillStyle = `rgba(16,18,24,${a})`;
    x.beginPath();
    x.ellipse(px, py, r * 1.4, r, 0.6, 0, Math.PI * 2);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return std('#ffffff', 0.9, 0, { map: t, side: THREE.DoubleSide, sheen: 0.3, sheenColor: new THREE.Color('#e8d2ad') });
}

function apron(waist: THREE.Vector3) {
  const g = new THREE.Group();
  // the skirt hangs from the waist and falls away from the thighs, so a shifting
  // stance never pushes a knee through the canvas
  const skirt = mesh(new THREE.CylinderGeometry(0.19, 0.245, 0.58, 32, 1, true, -1.0, 2.0), apronCloth(true), [0, -0.21, 0.012]);
  skirt.scale.set(1.04, 1, 0.98);
  g.add(skirt);
  // leather waist strap
  const strap = mesh(new THREE.TorusGeometry(0.185, 0.008, 6, 48), std('#4a2e1a', 0.5), [0, 0.08, 0.012], [Math.PI / 2, 0, 0]);
  strap.scale.set(1.04, 0.98, 1);
  g.add(strap);
  g.position.copy(waist);
  return g;
}

function apronBib(chest: THREE.Vector3) {
  const g = new THREE.Group();
  const bib = mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.3, 24, 1, true, -0.62, 1.24), apronCloth(false), [0, -0.12, 0]);
  bib.scale.set(1.05, 1, 0.82);
  g.add(bib);
  g.position.copy(chest);
  return g;
}

function textPlane(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, cw = 256, ch = Math.round((256 * h) / w)) {
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  draw(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  return o;
}

function jersey(chest: THREE.Vector3, neck: THREE.Vector3) {
  const g = new THREE.Group();
  // yellow collar, sitting at the base of the neck
  const collar = mesh(new THREE.TorusGeometry(0.07, 0.012, 10, 32), std('#e5b73b', 0.5), [neck.x - chest.x, neck.y - chest.y - 0.035, neck.z - chest.z + 0.01], [Math.PI / 2 - 0.25, 0, 0]);
  collar.scale.set(1.15, 1, 1);
  g.add(collar);
  // the back: 5 with my name under it, like the real kit
  const back = textPlane(0.26, 0.3, (x) => {
    x.fillStyle = '#f3ead8';
    x.textAlign = 'center';
    x.font = 'bold 210px Anton, Impact, sans-serif';
    x.fillText('5', 128, 205);
    x.font = '600 36px "Arial Narrow", Arial, sans-serif';
    x.fillText('D E V A N S H', 128, 262);
  });
  back.position.set(0, 0.05, -0.178);
  back.rotation.set(0.12, Math.PI, 0);
  g.add(back);
  // the front: the team name across the chest
  const front = textPlane(0.2, 0.06, (x) => {
    x.fillStyle = '#f3ead8';
    x.textAlign = 'center';
    x.font = 'bold 44px Anton, Impact, sans-serif';
    x.fillText('BITS PILANI', 128, 50);
  }, 256, 64);
  front.position.set(0, 0.06, 0.16);
  front.rotation.set(-0.1, 0, 0);
  g.add(front);
  g.position.copy(chest);
  return g;
}

function kneePad(knee: THREE.Vector3) {
  const g = new THREE.Group();
  const pad = mesh(new THREE.SphereGeometry(0.066, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std('#16181c', 0.5), [0, 0, 0.06], [Math.PI / 2, 0, 0]);
  pad.scale.set(1, 0.75, 1.3);
  g.add(pad);
  const ring = mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20), std('#b6e23a', 0.4), [0, 0, 0.11]);
  g.add(ring);
  g.position.set(knee.x, knee.y - 0.02, knee.z);
  return g;
}

function quadSkate(foot: THREE.Vector3) {
  const g = new THREE.Group();
  const plate = std('#b6e23a', 0.35, 0.2);
  const truck = std('#9aa0a6', 0.3, 0.9);
  const wheel = std('#e8762e', 0.45, 0, { clearcoat: 0.4 });
  // plate under the shoe, running heel to toe
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.012, 0.24), plate, [0, -0.012, 0.05]));
  for (const z of [-0.04, 0.14]) {
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), truck, [0, -0.03, z]));
    for (const x of [-0.055, 0.055]) {
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.028, 20), wheel, [x, -0.05, z], [0, 0, Math.PI / 2]));
    }
  }
  // toe stop
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.03, 16), std('#e8762e', 0.7), [0, -0.03, 0.18], [0.5, 0, 0]));
  g.position.set(foot.x, foot.y - 0.075, foot.z);
  return g;
}

// ─── the match kit's bare limbs ───
// Avaturn shrinks the body wherever clothes cover it, so once the kit cuts the trousers
// to shorts and the sleeves short, there's nothing underneath. These rebuild what shows:
// thighs below the shorts, calves in stockings, forearms, each shaped and riding its bone.

const SKIN = '#a9765a';

// a limb segment from a → b, shaped by a radius profile [t 0..1, radius]
function limb(a: THREE.Vector3, b: THREE.Vector3, profile: [number, number][], material: THREE.Material) {
  const len = a.distanceTo(b);
  const pts = profile.map(([t, r]) => new THREE.Vector2(r, t * len));
  const geo = new THREE.LatheGeometry(pts, 28);
  const m = mesh(geo, material);
  const g = new THREE.Group();
  g.add(m);
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return g;
}

// the stocking: navy knit with a yellow band at the top
function sockMaterial() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#1f2739';
  x.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 3) {
    x.fillStyle = 'rgba(255,255,255,0.035)';
    x.fillRect(0, y, 64, 1);
  }
  // lathe v runs from the knee (top of the texture) down to the ankle
  // the band sits below the knee pad, where it shows
  x.fillStyle = '#e5b73b';
  x.fillRect(0, 70, 64, 14);
  x.fillStyle = '#f3ead8';
  x.fillRect(0, 86, 64, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  return std('#ffffff', 0.85, 0, { map: t, sheen: 0.4, sheenColor: new THREE.Color('#3b4a70') });
}

// navy shorts with a yellow stripe down the outside of each leg
function shortsMaterial() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = '#243052';
  x.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 256; i += 4) {
    x.fillStyle = 'rgba(255,255,255,0.03)';
    x.fillRect(i, 0, 1, 64);
  }
  // lathe u wraps around the leg; a quarter turn lands on the outside
  x.fillStyle = '#e5b73b';
  x.fillRect(58, 0, 10, 64);
  x.fillRect(186, 0, 10, 64);
  // hem band
  x.fillStyle = '#1a2340';
  x.fillRect(0, 54, 256, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return std('#ffffff', 0.8, 0, { map: t, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color('#4a5a88') });
}

function matchLimbs(p: Points): GearPiece[] {
  const skin = std(SKIN, 0.55, 0, { sheen: 0.25, sheenColor: new THREE.Color('#e8b59a'), clearcoat: 0.05 });
  const sock = sockMaterial();
  const shortsMat = shortsMaterial();
  const out: GearPiece[] = [];
  for (const side of ['Left', 'Right'] as const) {
    const hip = p[`${side}UpLeg`];
    const knee = p[`${side}Leg`];
    const ankle = p[`${side}Foot`];
    // thigh: from just inside the shorts down to the knee
    const thighTop = hip.clone().lerp(knee, 0.48);
    out.push({
      anchor: `${side}UpLeg`,
      object: limb(thighTop, knee, [
        [0, 0],
        [0.001, 0.074],
        [0.5, 0.066],
        [0.92, 0.054],
        [1, 0],
      ], skin),
    });
    // loose athletic shorts: a flared shell from the hip to just above the knee
    const hem = hip.clone().lerp(knee, 0.6);
    const shorts = limb(hip.clone().lerp(knee, -0.08), hem, [
      [0, 0.105],
      [0.5, 0.104],
      [0.97, 0.1],
      [1, 0.094],
    ], shortsMat);
    shorts.children[0].scale.set(1.05, 1, 1.12);
    out.push({ anchor: `${side}UpLeg`, object: shorts });
    // calf in a stocking: knee → ankle, with the calf's swell
    out.push({
      anchor: `${side}Leg`,
      object: limb(knee.clone().lerp(ankle, 0.04), ankle.clone().lerp(knee, -0.02), [
        [0, 0],
        [0.001, 0.05],
        [0.28, 0.058],
        [0.55, 0.05],
        [0.85, 0.036],
        [0.999, 0.033],
        [1, 0],
      ], sock),
    });
    // arm: from inside the short sleeve to the elbow, then the forearm to the wrist
    const shoulder = p[`${side}Arm`];
    const elbow = p[`${side}ForeArm`];
    const wrist = p[`${side}Hand`];
    out.push({
      anchor: `${side}Arm`,
      object: limb(shoulder.clone().lerp(elbow, 0.45), elbow, [
        [0, 0],
        [0.001, 0.047],
        [0.6, 0.044],
        [1, 0.04],
      ], skin),
    });
    const fore = limb(elbow, wrist.clone().lerp(elbow, 0.02), [
      [0, 0.041],
      [0.3, 0.043],
      [0.8, 0.031],
      [0.999, 0.027],
      [1, 0],
    ], skin);
    // a ball at the elbow so the joint never shows a gap
    const joint = mesh(new THREE.SphereGeometry(0.041, 18, 12), skin);
    joint.position.copy(elbow);
    const arm = new THREE.Group();
    arm.add(fore, joint);
    out.push({ anchor: `${side}ForeArm`, object: arm });
  }
  return out;
}

// Which accessories each outfit carries, and which bone they ride on
export function buildGear(outfit: Outfit, p: Points): GearPiece[] {
  const chest = p.Spine2.clone();
  const L = Math.sign(p.LeftHand.x - p.Hips.x) || 1; // which side is my left
  switch (outfit) {
    case 'workshop':
      return [
        { anchor: 'Head', object: hardHat(p.Head) },
        { anchor: 'Spine2', object: hiVis(chest) },
        { anchor: 'Hips', ...roll(p.Hips, L) },
      ];
    case 'studio':
      return [{ anchor: 'Spine2', ...mug(chest, p.Head, L) }];
    case 'commons':
      return [
        { anchor: 'Spine2', object: nssBadge(chest) },
        { anchor: 'Spine2', ...held('clipboard', chest, L) },
      ];
    case 'arena':
      return [
        { anchor: 'Spine2', object: jersey(chest, p.Neck) },
        { anchor: 'LeftLeg', object: kneePad(p.LeftLeg) },
        { anchor: 'RightLeg', object: kneePad(p.RightLeg) },
        { anchor: 'LeftFoot', object: quadSkate(p.LeftFoot) },
        { anchor: 'RightFoot', object: quadSkate(p.RightFoot) },
        ...matchLimbs(p),
      ];
    case 'press':
      return [
        { anchor: 'Hips', object: apron(p.Hips) },
        { anchor: 'Spine2', object: apronBib(chest) },
        { anchor: 'Spine2', ...held('magazine', chest, L) },
      ];
    case 'notebook':
      return [{ anchor: 'Spine2', ...held('notebook', chest, L) }];
    case 'work':
      return [{ anchor: 'Spine2', object: lanyard(chest, p.Neck) }];
    default:
      return [];
  }
}
