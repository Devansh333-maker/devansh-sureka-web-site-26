'use client';

import * as THREE from 'three';
import type { ReactNode } from 'react';

// Small modelling kit: cached materials, seeded randomness and primitive shapes
// that every place on the island is assembled from.

export const palette = {
  stoneTop: '#e7dbc3',
  stoneLight: '#efe5d1',
  rock: '#7d6e5f',
  rockDark: '#5f5348',
  rockWarm: '#8f7a64',
  sandstone: '#d6a46c',
  sandstoneDeep: '#c18a52',
  sandstoneLight: '#e2bb88',
  timber: '#a8743f',
  timberDark: '#6e4a2a',
  timberLight: '#c49563',
  plaster: '#efe3cc',
  terracotta: '#c2593b',
  terracottaDark: '#a5472e',
  white: '#f7f2e8',
  grass: '#8d9663',
  grassDeep: '#6f7f45',
  leaf: '#7a8656',
  leafDark: '#58653e',
  leafLight: '#8f9a66',
  maple: '#a9452f',
  mapleLight: '#bf5b3a',
  mapleDeep: '#8f3324',
  neem: '#5b7040',
  water: '#6f9e98',
  iron: '#2e2b28',
  indigo: '#34465f',
  vermilion: '#c2402a',
  paper: '#f6f0e2',
  cushion: '#b5523b',
  tatami: '#d6cc98',
  clay: '#b8693f',
  glow: '#ffbf6b',
} as const;

const cache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(color: string, opts: { rough?: number; metal?: number; emissive?: string; emissiveIntensity?: number; opacity?: number } = {}) {
  const key = `${color}|${opts.rough ?? 0.85}|${opts.metal ?? 0}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? 0}|${opts.opacity ?? 1}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0,
      flatShading: true,
    });
    if (opts.emissive) {
      m.emissive = new THREE.Color(opts.emissive);
      m.emissiveIntensity = opts.emissiveIntensity ?? 1;
    }
    if (opts.opacity !== undefined && opts.opacity < 1) {
      m.transparent = true;
      m.opacity = opts.opacity;
      m.depthWrite = false;
    }
    cache.set(key, m);
  }
  return m;
}

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V3 = [number, number, number];

type BoxProps = { p?: V3; s: V3; c: string; r?: V3; m?: THREE.Material; shadow?: boolean };
export function B({ p = [0, 0, 0], s, c, r, m, shadow = true }: BoxProps) {
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow material={m ?? mat(c)}>
      <boxGeometry args={s} />
    </mesh>
  );
}

type CylProps = { p?: V3; rt: number; rb?: number; h: number; c: string; seg?: number; r?: V3; m?: THREE.Material };
export function Cyl({ p = [0, 0, 0], rt, rb, h, c, seg = 16, r, m }: CylProps) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow material={m ?? mat(c)}>
      <cylinderGeometry args={[rt, rb ?? rt, h, seg]} />
    </mesh>
  );
}

export function Ball({ p = [0, 0, 0], r, c, detail = 0, m, scale }: { p?: V3; r: number; c: string; detail?: number; m?: THREE.Material; scale?: V3 }) {
  return (
    <mesh position={p} scale={scale} castShadow receiveShadow material={m ?? mat(c)}>
      <icosahedronGeometry args={[r, detail]} />
    </mesh>
  );
}

// Legs + top. Used for tables, benches, desks.
export function Table({ p = [0, 0, 0], w, d, h, c, leg = 0.08, top = 0.1 }: { p?: V3; w: number; d: number; h: number; c: string; leg?: number; top?: number }) {
  const lx = w / 2 - leg;
  const lz = d / 2 - leg;
  return (
    <group position={p}>
      <B p={[0, h - top / 2, 0]} s={[w, top, d]} c={c} />
      {[
        [lx, lz],
        [-lx, lz],
        [lx, -lz],
        [-lx, -lz],
      ].map(([x, z], i) => (
        <B key={i} p={[x, (h - top) / 2, z]} s={[leg, h - top, leg]} c={c} />
      ))}
    </group>
  );
}

// Leafy tree built from clustered low-poly blobs.
export function Tree({
  p = [0, 0, 0],
  height = 2,
  spread = 1.2,
  colors = [palette.leaf, palette.leafDark, palette.leafLight],
  seed = 1,
  blobs = 6,
  trunk = palette.timberDark,
}: {
  p?: V3;
  height?: number;
  spread?: number;
  colors?: readonly string[];
  seed?: number;
  blobs?: number;
  trunk?: string;
}) {
  const rnd = seeded(seed);
  const items: { pos: V3; r: number; c: string }[] = [];
  for (let i = 0; i < blobs; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * spread * 0.75;
    items.push({
      pos: [Math.cos(a) * d, height + (rnd() - 0.3) * spread * 0.7, Math.sin(a) * d],
      r: spread * (0.45 + rnd() * 0.35),
      c: colors[i % colors.length],
    });
  }
  return (
    <group position={p}>
      <Cyl p={[0, height / 2, 0]} rt={0.07 * spread} rb={0.13 * spread} h={height} c={trunk} seg={6} />
      <Cyl p={[0.15 * spread, height * 0.75, 0]} rt={0.03 * spread} rb={0.06 * spread} h={height * 0.5} c={trunk} seg={5} r={[0, 0, -0.7]} />
      {items.map((it, i) => (
        <Ball key={i} p={it.pos} r={it.r} c={it.c} />
      ))}
    </group>
  );
}

// A clipped hedge: two or three soft, flattened pads, the way gardeners shape them
export function Shrub({ p = [0, 0, 0], size = 0.5, seed = 3, colors = [palette.leaf, palette.leafDark, palette.grass] }: { p?: V3; size?: number; seed?: number; colors?: readonly string[] }) {
  const rnd = seeded(seed);
  const n = 2 + Math.floor(rnd() * 2);
  return (
    <group position={p} rotation={[0, rnd() * Math.PI, 0]}>
      {Array.from({ length: n }).map((_, i) => (
        <Ball
          key={i}
          p={[(i - (n - 1) / 2) * size * 0.7, size * 0.36, (rnd() - 0.5) * size * 0.3]}
          r={size * (0.5 + rnd() * 0.12)}
          c={colors[i % colors.length]}
          detail={1}
          scale={[1, 0.62, 0.85]}
        />
      ))}
    </group>
  );
}

// Japanese cloud-pruned tree (niwaki): a leaning trunk, branches ending in flat pads of foliage
export function CloudTree({
  p = [0, 0, 0],
  height = 2.2,
  size = 1,
  seed = 1,
  colors = [palette.maple, palette.mapleLight, palette.mapleDeep],
  trunk = '#4a3426',
}: {
  p?: V3;
  height?: number;
  size?: number;
  seed?: number;
  colors?: readonly string[];
  trunk?: string;
}) {
  const rnd = seeded(seed);
  const pads: { at: V3; r: number }[] = [
    { at: [0.05, height, 0], r: 0.75 },
    { at: [-0.55, height * 0.72, 0.25], r: 0.55 },
    { at: [0.6, height * 0.6, -0.2], r: 0.5 },
    { at: [0.1, height * 0.42, 0.55], r: 0.42 },
  ];
  return (
    <group position={p} scale={size} rotation={[0, rnd() * Math.PI * 2, 0]}>
      <Cyl p={[0, height * 0.35, 0]} rt={0.06} rb={0.12} h={height * 0.7} c={trunk} seg={6} r={[0, 0, 0.12]} />
      <Cyl p={[0.02, height * 0.82, 0]} rt={0.04} rb={0.07} h={height * 0.4} c={trunk} seg={6} r={[0, 0, -0.18]} />
      {pads.slice(1).map((pd, i) => {
        // a thin branch from the trunk out to each pad
        const [x, y, z] = pd.at;
        const from = new THREE.Vector3(0, y - 0.35, 0);
        const to = new THREE.Vector3(x, y - 0.05, z);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        const dir = to.clone().sub(from);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={`b${i}`} position={mid} quaternion={q} castShadow material={mat(trunk)}>
            <cylinderGeometry args={[0.022, 0.04, dir.length(), 5]} />
          </mesh>
        );
      })}
      {pads.map((pd, i) => (
        <group key={i} position={pd.at}>
          <Ball r={pd.r} c={colors[i % colors.length]} detail={1} scale={[1, 0.42, 1]} />
          <Ball p={[pd.r * 0.25, pd.r * 0.16, -pd.r * 0.1]} r={pd.r * 0.62} c={colors[(i + 1) % colors.length]} detail={1} scale={[1, 0.45, 1]} />
        </group>
      ))}
    </group>
  );
}

// Ashoka (Polyalthia): the tall, narrow column of a tree that lines Rajasthani palace walks
export function ColumnTree({ p = [0, 0, 0], height = 3, seed = 2, colors = [palette.leafDark, palette.leaf, '#4c5a35'] }: { p?: V3; height?: number; seed?: number; colors?: readonly string[] }) {
  const rnd = seeded(seed);
  const tiers = 5;
  return (
    <group position={p}>
      <Cyl p={[0, 0.2, 0]} rt={0.05} rb={0.08} h={0.4} c="#4a3426" seg={6} />
      {Array.from({ length: tiers }).map((_, i) => {
        const t = i / (tiers - 1);
        const r = 0.42 * (1 - t * 0.7) + 0.08;
        return (
          <mesh key={i} position={[0, 0.45 + t * (height - 0.6), 0]} rotation={[0, rnd() * Math.PI, 0]} castShadow receiveShadow material={mat(colors[i % colors.length])}>
            <coneGeometry args={[r, (height / tiers) * 1.5, 7]} />
          </mesh>
        );
      })}
    </group>
  );
}

// Neem: a short, stout trunk under one wide, low umbrella of foliage
export function UmbrellaTree({
  p = [0, 0, 0],
  height = 2.4,
  spread = 2,
  seed = 7,
  colors = [palette.neem, palette.leafDark, palette.leaf],
}: {
  p?: V3;
  height?: number;
  spread?: number;
  seed?: number;
  colors?: readonly string[];
}) {
  const rnd = seeded(seed);
  const pads = Array.from({ length: 7 }).map((_, i) => {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.4;
    const d = i === 0 ? 0 : spread * (0.45 + rnd() * 0.2);
    return { pos: [Math.cos(a) * d, height + (i === 0 ? 0.35 : rnd() * 0.25), Math.sin(a) * d] as V3, r: i === 0 ? spread * 0.75 : spread * (0.42 + rnd() * 0.12) };
  });
  return (
    <group position={p}>
      <Cyl p={[0, height / 2, 0]} rt={0.14} rb={0.26} h={height} c="#4a3426" seg={7} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        return <Cyl key={i} p={[Math.cos(a) * 0.35, height * 0.85, Math.sin(a) * 0.35]} rt={0.05} rb={0.09} h={0.9} c="#4a3426" seg={5} r={[Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7]} />;
      })}
      {pads.map((pd, i) => (
        <Ball key={i} p={pd.pos} r={pd.r} c={colors[i % colors.length]} detail={1} scale={[1, 0.38, 1]} />
      ))}
    </group>
  );
}

export function Group({ children, p, r }: { children: ReactNode; p?: V3; r?: V3 }) {
  return (
    <group position={p} rotation={r}>
      {children}
    </group>
  );
}
