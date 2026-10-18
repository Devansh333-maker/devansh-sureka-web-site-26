'use client';

import * as THREE from 'three';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Avatar, type Gesture, type Outfit, type RigFn } from '../character/Avatar';
import { compileAll } from './compile';
import type { Rig } from '../character/ik';
import { motionOn } from '@/components/motion/motion';
// where I stand in each place (world coordinates), and which way I face
export type Spot = { pos: [number, number, number]; rotY: number };

// Me, as the game character, guiding people round the island.
// Picking a place makes me crouch, spring up into a column of light and drop down
// in that place's outfit, landing on bent knees, like a fast-travel in a game.
// Between trips I turn toward whichever place you're pointing at.

const SCALE = 1.2;
const CROUCH = 0.16; // seconds of wind-up before the jump
const OUT = 0.3; // seconds to rise and vanish
const IN = 0.42; // seconds to fall and land
const HOP = 0.55; // how high I rise into the beam, world units
const DROP = 0.8; // how high I fall from
const HOME_LIFE = { gestures: ['glasses', 'nod', 'chin', 'wave'] as Gesture[] };

const ease = (t: number) => t * t * (3 - 2 * t);
// wrap an angle into −π…π
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

// knees: hips dip by `dip`, feet stay planted where the stance puts them
const fv = new THREE.Vector3();
const fp = new THREE.Vector3();
function crouch(rig: Rig, dip: number) {
  if (dip < 0.002) return;
  const hips = rig.restPos('Hips');
  rig.drop(dip, -dip * 0.25);
  for (const side of ['Left', 'Right'] as const) {
    const f = rig.restPos(`${side}Foot`);
    const s = side === 'Left' ? 1 : -1;
    rig.step(side, rig.toWorld(f.x * 1.04, f.y, f.z + 0.02, fv), rig.toWorld(f.x * 0.8, hips.y * 0.5, 1, fp), s * 0.16);
  }
  // lean in a touch, as you do bending your knees
  rig.pitch('Spine', dip * 0.9);
}

function beamTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// a light column, a ground ring and a puff of sparks; `k` runs 0 → 1 over its life
function Burst({ at, color, onDone }: { at: [number, number, number]; color: string; onDone: () => void }) {
  const tex = useMemo(beamTexture, []);
  // R3F won't free a texture handed in as a prop, so do it when the burst goes
  useEffect(() => () => tex.dispose(), [tex]);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Points>(null);
  const life = useRef(0);
  const N = 40;
  const seeds = useMemo(() => {
    const v = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.random() * 0.3;
      const s = 0.6 + Math.random() * 1.2;
      v[i * 3] = Math.cos(a) * s;
      v[i * 3 + 1] = 1.2 + Math.random() * 2.4;
      v[i * 3 + 2] = Math.sin(a) * s;
    }
    return v;
  }, []);
  const pos = useMemo(() => new Float32Array(N * 3), []);

  useFrame((_, dt) => {
    life.current += dt / 0.9;
    const k = Math.min(1, life.current);
    const fade = 1 - k;
    if (beam.current) {
      beam.current.scale.set(1 - k * 0.7, 0.4 + k * 1.6, 1 - k * 0.7);
      (beam.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.85;
    }
    if (ring.current) {
      ring.current.scale.setScalar(0.3 + k * 2.2);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = fade;
    }
    if (sparks.current) {
      const e = 1 - Math.pow(1 - k, 2);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = seeds[i * 3] * e * 0.7;
        pos[i * 3 + 1] = seeds[i * 3 + 1] * e - k * k * 1.2 + 0.1;
        pos[i * 3 + 2] = seeds[i * 3 + 2] * e * 0.7;
      }
      sparks.current.geometry.attributes.position.needsUpdate = true;
      (sparks.current.material as THREE.PointsMaterial).opacity = fade;
    }
    if (k >= 1 && life.current < 99) {
      life.current = 99;
      onDone();
    }
  });

  return (
    <group position={at}>
      <mesh ref={beam} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 2.8, 24, 1, true]} />
        <meshBasicMaterial map={tex} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.44, 48]} />
        <meshBasicMaterial color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <points ref={sparks}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} />
      </points>
    </group>
  );
}

const ACCENT: Record<Outfit, string> = {
  guide: '#ffd9a0',
  workshop: '#ffb347',
  studio: '#9fd4ff',
  commons: '#ffcf6b',
  arena: '#c6f24a',
  press: '#ff9a7a',
  notebook: '#ff8fb0',
  work: '#9fc4ff',
};

// what I say when I land somewhere: one line, the way a game guide would
const LINES: Partial<Record<Outfit, string>> = {
  guide: 'Hi, I’m Devansh. Pick a place and I’ll meet you there.',
  workshop: 'These bricks are crop stubble and plastic. Best mix: 6.5 MPa.',
  studio: 'My articles were seen 11.38 million times on Google.',
  commons: 'Seven villages, two hundred volunteers. Pull up a charpai.',
  arena: 'Number five. We brought home InterBITS gold.',
  press: 'L.I.T.E. was gone for five years. Not any more.',
  notebook: 'It’s late. I’m writing things down.',
};

// the line types itself out, then the bubble lets go after a few seconds
function Say({ text, id }: { text: string; id: number }) {
  const [n, setN] = useState(0);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setN(0);
    setOpen(true);
    let i = 0;
    // with motion off the line appears whole instead of typing itself out
    if (!motionOn()) setN((i = text.length));
    const type = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(type);
    }, 26);
    const close = window.setTimeout(() => setOpen(false), 1400 + text.length * 26 + 3600);
    return () => {
      window.clearInterval(type);
      window.clearTimeout(close);
    };
  }, [text, id]);
  return (
    <div className={`guide-say ${open ? 'is-open' : ''}`} role="status">
      <span className="guide-say__who">Devansh</span>
      <span className="guide-say__text">
        {text.slice(0, n)}
        <i aria-hidden="true">{text.slice(n)}</i>
      </span>
    </div>
  );
}

// Mounted with the island but held back (`active` false) until the world is built: the
// model loads and its shaders compile while the opening plays, so the moment the homepage
// appears doesn't stall on it.
export function GuideAvatar({ outfit, spot, look = null, active = true }: { outfit: Outfit; spot: Spot; look?: [number, number, number] | null; active?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const live = useRef(active);
  live.current = active;
  const { gl, scene, camera } = useThree();
  // once the model is in, compile its shaders in the background while it's still hidden
  const onReady = useCallback(() => {
    compileAll(gl, scene, camera)?.catch(() => {});
  }, [gl, scene, camera]);
  const [shown, setShown] = useState({ outfit, spot });
  const [bursts, setBursts] = useState<{ key: number; at: [number, number, number]; color: string }[]>([]);
  const phase = useRef<'crouch' | 'out' | 'in' | 'idle'>('in');
  const k = useRef(0);
  const wind = useRef(0); // crouch wind-up, 0 → 1
  const landed = useRef(-1); // seconds since I last touched down (−1: not yet)
  const yaw = useRef(0); // extra turn toward what you're pointing at
  const dip = useRef(0);
  const onRig = useMemo<RigFn>(() => (rig) => crouch(rig, dip.current), []);
  const nextKey = useRef(0);
  // on landing: a wave at the gate, a nod everywhere else
  const [cue, setCue] = useState<{ name: Gesture; key: number }>({ name: 'wave', key: 1 });
  const [say, setSay] = useState<{ text: string; id: number } | null>(null);
  // the first hello, once I've landed at the gate
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setSay({ text: LINES.guide!, id: 1 }), 900);
    return () => window.clearTimeout(t);
  }, [active]);
  const hello = () => {
    setCue({ name: 'wave', key: performance.now() });
    setSay({ text: shown.outfit === 'guide' ? LINES.guide! : LINES[shown.outfit] ?? LINES.guide!, id: performance.now() });
  };

  const burst = (at: [number, number, number], color: string) =>
    setBursts((b) => [...b, { key: nextKey.current++, at, color }]);

  useEffect(() => {
    if (outfit === shown.outfit && spot === shown.spot) return;
    if (phase.current === 'idle') {
      phase.current = 'crouch';
      wind.current = 0;
    } else phase.current = 'out';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit, spot]);

  // first landing at the gate
  useEffect(() => {
    if (!active) return;
    burst(spot.pos, ACCENT[outfit]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // if I'm unmounted while hovered, pointer-out never fires, so let the cursor go here
  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);


  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    dt = Math.min(dt, 1 / 20);
    if (!live.current) {
      // waiting in the wings until the world is built
      k.current = 0;
      phase.current = 'in';
      g.visible = false;
      return;
    }
    let lift = 0;
    if (phase.current === 'crouch') {
      // wind up: knees bend before the spring
      wind.current = Math.min(1, wind.current + dt / CROUCH);
      if (wind.current === 1) {
        phase.current = 'out';
        burst(shown.spot.pos, ACCENT[shown.outfit]);
      }
    } else if (phase.current === 'out') {
      k.current = Math.max(0, k.current - dt / OUT);
      // spring up and away, fading into the beam
      lift = HOP * ease(1 - k.current);
      if (k.current === 0) {
        setShown({ outfit, spot });
        setCue({ name: outfit === 'guide' ? 'wave' : 'nod', key: performance.now() });
        const line = LINES[outfit];
        window.setTimeout(() => line && setSay({ text: line, id: performance.now() }), 500);
        burst(spot.pos, ACCENT[outfit]);
        yaw.current = 0;
        phase.current = 'in';
      }
    } else if (phase.current === 'in') {
      k.current = Math.min(1, k.current + dt / IN);
      // falling: slow at the top, quick at the end
      lift = DROP * (1 - k.current * k.current);
      if (k.current === 1) {
        phase.current = 'idle';
        landed.current = 0;
      }
    }
    if (landed.current >= 0) landed.current += dt;

    // knees: the wind-up before a jump, and the give on landing
    const l = landed.current;
    const land = l >= 0 && l < 1.2 ? 0.14 * (l < 0.07 ? l / 0.07 : Math.exp(-(l - 0.07) * 6)) : 0;
    const windUp = phase.current === 'crouch' ? 0.1 * ease(wind.current) : phase.current === 'out' ? 0.1 * Math.max(0, 1 - (1 - k.current) * 4) : 0;
    dip.current = Math.max(land, windUp);

    // turn toward the place you're pointing at, then settle back to face you
    const at = shown.spot.pos;
    let want = 0;
    if (look && phase.current === 'idle') {
      const dx = look[0] - at[0];
      const dz = look[2] - at[2];
      if (dx * dx + dz * dz > 0.5) want = THREE.MathUtils.clamp(wrap(Math.atan2(dx, dz) - shown.spot.rotY), -1.1, 1.1);
    }
    yaw.current += (want - yaw.current) * (1 - Math.exp(-dt * 3.5));
    g.rotation.set(0, shown.spot.rotY + yaw.current, 0);

    g.position.set(at[0], at[1] + lift, at[2]);
    // shrink into the light on the way up, grow out of it on the way down (never stretched)
    const t = k.current;
    const s = phase.current === 'out' ? Math.pow(t, 0.6) : phase.current === 'in' ? 1 - Math.pow(1 - Math.min(1, t * 1.4), 3) : 1;
    g.scale.setScalar(SCALE * Math.max(0.0001, s));
    g.visible = s > 0.02;
  });

  return (
    <>
      <group
        ref={root}
        onClick={(e) => {
          e.stopPropagation();
          hello();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <Suspense fallback={null}>
          <Avatar outfit={shown.outfit} move="idle" fade={0.3} cue={cue} life={HOME_LIFE} onRig={onRig} onReady={onReady} />
        </Suspense>
      </group>
      {say && (
        <Html position={[shown.spot.pos[0], shown.spot.pos[1] + 2.15, shown.spot.pos[2]]} zIndexRange={[16777300, 16777290]} style={{ pointerEvents: 'none' }}>
          <Say text={say.text} id={say.id} />
        </Html>
      )}
      {bursts.map((b) => (
        <Burst key={b.key} at={b.at} color={b.color} onDone={() => setBursts((all) => all.filter((x) => x.key !== b.key))} />
      ))}
    </>
  );
}
