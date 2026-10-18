'use client';

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// The film's particles and light, all on the scene clock so slow motion slows them too.
type Clock = React.MutableRefObject<number>;
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let dot: THREE.CanvasTexture | null = null;
function dotTex() {
  if (dot) return dot;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.6)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c);
  return dot;
}

// a burst of sparks out of the net, back toward the court
export function Burst({ at, t0, clock, color, count = 90, life = 1.6 }: { at: THREE.Vector3; t0: number; clock: Clock; color: string; count?: number; life?: number }) {
  const ref = useRef<THREE.Points>(null);
  const vel = useMemo(() => {
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rnd(i + count) * Math.PI * 2;
      const sp = 2 + rnd(i * 3 + 1) * 5.5;
      v[i * 3] = -Math.abs(Math.cos(a)) * sp * 0.9;
      v[i * 3 + 1] = (0.4 + rnd(i * 7)) * sp * 0.8;
      v[i * 3 + 2] = Math.sin(a) * sp;
    }
    return v;
  }, [count]);
  const pos = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame(() => {
    const p = ref.current;
    if (!p) return;
    const t = clock.current - t0;
    p.visible = t > 0 && t < life;
    if (!p.visible) return;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = at.x + vel[i * 3] * t;
      pos[i * 3 + 1] = Math.max(0.02, at.y + vel[i * 3 + 1] * t - 4.9 * t * t);
      pos[i * 3 + 2] = at.z + vel[i * 3 + 2] * t;
    }
    p.geometry.attributes.position.needsUpdate = true;
    (p.material as THREE.PointsMaterial).opacity = 1 - t / life;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dotTex()} size={0.12} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
}

// the impact ring off the net
export function Ring({ at, t0, clock }: { at: THREE.Vector3; t0: number; clock: Clock }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = (clock.current - t0) / 0.25;
    m.visible = t > 0 && t < 1;
    if (!m.visible) return;
    m.scale.setScalar(0.2 + (1 - Math.pow(1 - t, 3)) * 2.8);
    (m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.95;
  });
  return (
    <mesh ref={ref} position={at} rotation={[0, Math.PI / 2, 0]}>
      <ringGeometry args={[0.4, 0.5, 64]} />
      <meshBasicMaterial color="#fff2c4" transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

// the ball's light trail: a ribbon along the arc while it flies
export function Trail({ arc, clock, from, to }: { arc: React.MutableRefObject<THREE.QuadraticBezierCurve3>; clock: Clock; from: number; to: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = clock.current;
    const k = (t - from) / (to - from);
    const tail = THREE.MathUtils.clamp((t - to) / 0.5, 0, 1);
    m.visible = k > 0.02 && tail < 1;
    if (!m.visible) return;
    const head = Math.min(1, k);
    const start = Math.max(0, head - 0.5, tail);
    const pts = Array.from({ length: 24 }, (_, i) => arc.current.getPoint(start + ((head - start) * i) / 23));
    m.geometry.dispose();
    m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.05, 8, false);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - tail);
  });
  return (
    <mesh ref={ref} frustumCulled={false}>
      <bufferGeometry />
      <meshBasicMaterial color="#ffd27a" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// sparks thrown off the wheels while he drives
export function WheelSparks({ feet, clock, until }: { feet: React.MutableRefObject<THREE.Vector3[]>; clock: Clock; until: number }) {
  const ref = useRef<THREE.Points>(null);
  const N = 160;
  const d = useMemo(() => ({ pos: new Float32Array(N * 3), born: new Float32Array(N).fill(-9), vel: new Float32Array(N * 3), o: new Float32Array(N * 3) }), []);
  const next = useRef(0);
  const last = useRef(0);
  useFrame(() => {
    const p = ref.current;
    if (!p) return;
    const t = clock.current;
    if (t < last.current) last.current = t;
    if (t > 0.05 && t < until && t - last.current > 0.025) {
      last.current = t;
      for (const f of feet.current) {
        const i = next.current++ % N;
        d.born[i] = t;
        d.o[i * 3] = f.x;
        d.o[i * 3 + 1] = 0.03;
        d.o[i * 3 + 2] = f.z;
        d.vel[i * 3] = (rnd(i + t) - 0.5) * 1.6;
        d.vel[i * 3 + 1] = 0.4 + rnd(i * 2 + t) * 0.8;
        d.vel[i * 3 + 2] = (rnd(i * 5 + t) - 0.5) * 1.6;
      }
    }
    for (let i = 0; i < N; i++) {
      const age = t - d.born[i];
      const alive = age >= 0 && age < 0.45;
      d.pos[i * 3] = alive ? d.o[i * 3] + d.vel[i * 3] * age : 0;
      d.pos[i * 3 + 1] = alive ? Math.max(0.01, d.o[i * 3 + 1] + d.vel[i * 3 + 1] * age - 4.9 * age * age) : -10;
      d.pos[i * 3 + 2] = alive ? d.o[i * 3 + 2] + d.vel[i * 3 + 2] * age : 0;
    }
    p.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[d.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dotTex()} size={0.06} color="#ffb070" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
}

// dust hanging in the spotlight; it drifts with the projector speed and stops in bullet time
export function Motes({ at, level, flow }: { at: React.MutableRefObject<THREE.Vector3>; level: React.MutableRefObject<number>; flow: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const N = 260;
  const base = useMemo(() => {
    const b = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const a = rnd(i) * Math.PI * 2;
      const rr = Math.sqrt(rnd(i + 99)) * 1.8;
      b.set([Math.cos(a) * rr, rnd(i + 7) * 6, Math.sin(a) * rr, rnd(i + 13)], i * 4);
    }
    return b;
  }, []);
  const pos = useMemo(() => new Float32Array(N * 3), []);
  useFrame(() => {
    const p = ref.current;
    if (!p) return;
    (p.material as THREE.PointsMaterial).opacity = level.current;
    p.visible = level.current > 0.01;
    if (!p.visible) return;
    const f = flow.current;
    for (let i = 0; i < N; i++) {
      const ph = base[i * 4 + 3];
      pos[i * 3] = at.current.x + base[i * 4] + Math.sin(f * 1.3 + ph * 20) * 0.12;
      pos[i * 3 + 1] = 0.1 + ((base[i * 4 + 1] + f * (0.25 + ph * 0.5)) % 6);
      pos[i * 3 + 2] = at.current.z + base[i * 4 + 2] + Math.cos(f * 1.1 + ph * 17) * 0.12;
    }
    p.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dotTex()} size={0.05} color="#ffdca0" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
}

// confetti and gold paper down from the roof once it's in
export function Confetti({ clock, t0 }: { clock: Clock; t0: number }) {
  const ref = useRef<THREE.Points>(null);
  const N = 340;
  const seed = useMemo(() => Float32Array.from({ length: N * 4 }, (_, i) => rnd(i + 3)), []);
  const pos = useMemo(() => new Float32Array(N * 3), []);
  const col = useMemo(() => {
    const c = new Float32Array(N * 3);
    const pal = ['#c6f24a', '#e2452a', '#3d5bd9', '#f3ebdd', '#ffd27a', '#ffd27a'].map((h) => new THREE.Color(h));
    for (let i = 0; i < N; i++) pal[Math.floor(rnd(i + 23) * pal.length)].toArray(c, i * 3);
    return c;
  }, []);
  useFrame(() => {
    const p = ref.current;
    if (!p) return;
    const t = clock.current - t0;
    p.visible = t > 0 && t < 3.2;
    if (!p.visible) return;
    for (let i = 0; i < N; i++) {
      const ph = seed[i * 4 + 3];
      pos[i * 3] = 2.5 + seed[i * 4] * 7.5 + Math.sin(t * 3 + ph * 30) * 0.25;
      pos[i * 3 + 1] = Math.max(0.02, 7.5 + seed[i * 4 + 2] * 2.5 - t * (1.6 + ph * 1.2));
      pos[i * 3 + 2] = (seed[i * 4 + 1] - 0.5) * 8 + Math.cos(t * 2.6 + ph * 21) * 0.25;
    }
    p.geometry.attributes.position.needsUpdate = true;
    (p.material as THREE.PointsMaterial).opacity = 1 - THREE.MathUtils.clamp((t - 2.6) / 0.6, 0, 1);
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dotTex()} size={0.1} vertexColors transparent depthWrite={false} toneMapped={false} />
    </points>
  );
}
