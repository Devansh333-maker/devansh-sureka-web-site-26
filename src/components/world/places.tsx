'use client';

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Rise } from './build';
import { B, Ball, Cyl, Shrub, Table, Tree, UmbrellaTree, mat, palette as P, seeded } from './kit';

// ─────────────────────────────────────────────────────────────
// 01 · THE WORKSHOP: a Jaipur sandstone haveli, cut open on two sides
// ─────────────────────────────────────────────────────────────
function Chhatri({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <B p={[0, 0.06, 0]} s={[1.2, 0.12, 1.2]} c={P.sandstoneDeep} />
      {[
        [0.45, 0.45],
        [-0.45, 0.45],
        [0.45, -0.45],
        [-0.45, -0.45],
      ].map(([x, z], i) => (
        <Cyl key={i} p={[x, 0.55, z]} rt={0.06} h={0.9} c={P.sandstoneLight} seg={8} />
      ))}
      <B p={[0, 1.04, 0]} s={[1.25, 0.1, 1.25]} c={P.sandstoneDeep} />
      <mesh position={[0, 1.09, 0]} castShadow material={mat(P.sandstoneLight)}>
        <sphereGeometry args={[0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Cyl p={[0, 1.72, 0]} rt={0.02} rb={0.06} h={0.25} c={P.sandstoneDeep} seg={6} />
    </group>
  );
}

function ArchPanel({ p, w = 0.8, h = 1.5 }: { p: [number, number, number]; w?: number; h?: number }) {
  return (
    <group position={p}>
      <B p={[0, h / 2, 0]} s={[w, h, 0.05]} c={P.sandstoneDeep} shadow={false} />
      <mesh position={[0, h, 0]} material={mat(P.sandstoneDeep)}>
        <cylinderGeometry args={[w / 2, w / 2, 0.05, 16, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
    </group>
  );
}

function ModelBridge({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      {[-0.18, 0.18].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} castShadow material={mat(P.timberLight)}>
          <torusGeometry args={[0.6, 0.035, 6, 18, Math.PI]} />
        </mesh>
      ))}
      <B p={[0, 0.42, 0]} s={[1.5, 0.04, 0.46]} c={P.timberLight} />
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
        <B key={i} p={[x, 0.42 - (0.6 - Math.sqrt(Math.max(0, 0.36 - x * x))) / 2 - 0.05, 0]} s={[0.025, 0.6 - Math.sqrt(Math.max(0, 0.36 - x * x)) + 0.02, 0.4]} c={P.timberLight} />
      ))}
    </group>
  );
}

export function Workshop({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  const W = 5.2;
  const D = 4.2;
  const H = 3;
  return (
    <group position={p}>
      <Rise delay={t} mode="rise" distance={1.2}>
        <B p={[0, 0.2, 0]} s={[W + 0.4, 0.4, D + 0.4]} c={P.sandstoneDeep} />
        <B p={[0, 0.42, 0]} s={[W, 0.05, D]} c={P.stoneLight} />
      </Rise>
      <Rise delay={t + 0.15} mode="grow">
        {/* back + left wall: front and right are cut away so you can see inside */}
        <B p={[0, 0.4 + H / 2, -D / 2 + 0.17]} s={[W, H, 0.34]} c={P.sandstone} />
        <B p={[-W / 2 + 0.17, 0.4 + H / 2, 0]} s={[0.34, H, D]} c={P.sandstone} />
        {/* plinth band and cornice */}
        <B p={[0, 0.4 + H, -D / 2 + 0.17]} s={[W + 0.15, 0.14, 0.5]} c={P.sandstoneDeep} />
        <B p={[-W / 2 + 0.17, 0.4 + H, 0]} s={[0.5, 0.14, D + 0.15]} c={P.sandstoneDeep} />
        {[-1.6, 0, 1.6].map((x, i) => (
          <ArchPanel key={i} p={[x, 0.75, -D / 2 + 0.36]} />
        ))}
        {/* crenellations */}
        {Array.from({ length: 9 }).map((_, i) => (
          <B key={`c${i}`} p={[-W / 2 + 0.3 + i * 0.58, 0.4 + H + 0.22, -D / 2 + 0.17]} s={[0.3, 0.3, 0.34]} c={P.sandstoneLight} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <B key={`d${i}`} p={[-W / 2 + 0.17, 0.4 + H + 0.22, -D / 2 + 0.9 + i * 0.58]} s={[0.34, 0.3, 0.3]} c={P.sandstoneLight} />
        ))}
        {/* drawings pinned on the back wall */}
        {[
          [-1.6, 2.55, 0.9, 0.62],
          [0.0, 2.6, 0.75, 0.55],
          [1.55, 2.5, 0.95, 0.68],
        ].map(([x, y, w, h], i) => (
          <group key={`dr${i}`} position={[x, y, -D / 2 + 0.36]}>
            <B s={[w, h, 0.02]} c={P.paper} shadow={false} />
            <B p={[0, -h * 0.1, 0.012]} s={[w * 0.7, 0.012, 0.005]} c={P.iron} shadow={false} />
            <B p={[-w * 0.1, h * 0.12, 0.012]} s={[w * 0.5, 0.012, 0.005]} c={P.iron} shadow={false} />
          </group>
        ))}
      </Rise>
      <Rise delay={t + 0.75} mode="drop" distance={2.5} position={[-W / 2 + 0.9, 0.4 + H + 0.08, -D / 2 + 0.9]}>
        <Chhatri p={[0, 0, 0]} />
      </Rise>
      {/* the work table with a model arch bridge on it */}
      <Rise delay={t + 0.9} mode="pop" position={[0.4, 0.45, 0.1]}>
        <Table w={2.6} d={1.2} h={0.85} c={P.timberLight} />
        <B p={[0, 0.86, 0]} s={[2.4, 0.02, 1.05]} c={P.white} />
        <ModelBridge p={[-0.35, 0.88, 0]} />
        <B p={[0.85, 0.93, 0.15]} s={[0.4, 0.12, 0.25]} c={P.paper} />
      </Rise>
      {/* eco-composite bricks, stacked */}
      <Rise delay={t + 1.05} mode="drop" distance={2} position={[-1.6, 0.45, 1.2]}>
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <B key={`${row}-${col}`} p={[col * 0.42 + (row % 2) * 0.2, 0.09 + row * 0.18, 0]} s={[0.4, 0.17, 0.2]} c={row === 2 ? P.grassDeep : col ? P.clay : '#9b8a72'} />
          )),
        )}
      </Rise>
      {/* stool + pendant lamp */}
      <Rise delay={t + 1.1} mode="pop" position={[1.0, 0.45, 1.1]}>
        <Cyl p={[0, 0.3, 0]} rt={0.2} h={0.06} c={P.timberDark} />
        <Cyl p={[0, 0.14, 0]} rt={0.04} h={0.28} c={P.timberDark} seg={6} />
      </Rise>
      <Rise delay={t + 1.2} mode="drop" distance={1.5} position={[0.4, 0.4 + H - 0.1, 0.1]}>
        <B p={[0, -0.35, 0]} s={[0.015, 0.7, 0.015]} c={P.iron} shadow={false} />
        <mesh position={[0, -0.8, 0]} material={mat(P.terracotta)}>
          <coneGeometry args={[0.28, 0.25, 14, 1, true]} />
        </mesh>
        <Ball p={[0, -0.86, 0]} r={0.07} c={P.glow} m={mat(P.glow, { emissive: P.glow, emissiveIntensity: 2.5 })} />
      </Rise>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 02 · THE SYSTEMS STUDIO: a timber pavilion under a wave roof
// ─────────────────────────────────────────────────────────────
function WaveRoof() {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const xs = 40;
    const L = 7.4;
    const f = (x: number) => 0.42 * Math.sin(x * 0.85 + 0.6);
    s.moveTo(-L / 2, f(-L / 2));
    for (let i = 1; i <= xs; i++) {
      const x = -L / 2 + (L * i) / xs;
      s.lineTo(x, f(x));
    }
    for (let i = xs; i >= 0; i--) {
      const x = -L / 2 + (L * i) / xs;
      s.lineTo(x, f(x) - 0.14);
    }
    // Only the back two-thirds is roofed: the front is cut away so the desk stays visible.
    const g = new THREE.ExtrudeGeometry(s, { depth: 3.1, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -2.5);
    return g;
  }, []);
  return <mesh geometry={geo} castShadow receiveShadow material={mat(P.plaster, { rough: 0.9 })} />;
}

function SystemBoard({ p }: { p: [number, number, number] }) {
  // A pin-board of nodes and links: the pipeline as I sketch it
  const nodes: [number, number][] = [
    [-0.6, 0.25],
    [-0.2, -0.1],
    [0.15, 0.3],
    [0.55, 0.0],
    [0.2, -0.32],
    [-0.55, -0.3],
  ];
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [1, 4],
    [4, 3],
    [5, 1],
  ];
  return (
    <group position={p}>
      <B s={[1.7, 1.05, 0.05]} c={P.timberDark} />
      <B p={[0, 0, 0.03]} s={[1.6, 0.95, 0.02]} c={P.stoneLight} shadow={false} />
      {links.map(([a, b], i) => {
        const [x1, y1] = nodes[a];
        const [x2, y2] = nodes[b];
        const len = Math.hypot(x2 - x1, y2 - y1);
        return <B key={`l${i}`} p={[(x1 + x2) / 2, (y1 + y2) / 2, 0.05]} r={[0, 0, Math.atan2(y2 - y1, x2 - x1)]} s={[len, 0.015, 0.005]} c={P.iron} shadow={false} />;
      })}
      {nodes.map(([x, y], i) => (
        <Ball key={`n${i}`} p={[x, y, 0.06]} r={0.05} c={i === 3 ? P.vermilion : P.indigo} />
      ))}
    </group>
  );
}

export function Studio({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  return (
    <group position={p}>
      <Rise delay={t} mode="rise" distance={1.2}>
        <B p={[0, 0.18, 0]} s={[6.4, 0.36, 4.6]} c={P.stoneLight} />
        <B p={[0.3, 0.39, 0.1]} s={[5.4, 0.06, 3.8]} c={P.timberLight} />
        {/* rug */}
        <B p={[0.5, 0.43, 0.3]} s={[2.8, 0.02, 2]} c="#d9c4a2" shadow={false} />
      </Rise>
      <Rise delay={t + 0.2} mode="grow">
        {/* posts */}
        {[
          [-2.6, -1.9],
          [3.1, -1.9],
          [-2.6, 2.0],
          [3.1, 2.0],
        ].map(([x, z], i) => (
          <B key={i} p={[x, 2.0, z]} s={[0.16, 3.2, 0.16]} c={P.timber} />
        ))}
        {/* slatted timber screen at the back */}
        {Array.from({ length: 16 }).map((_, i) => (
          <B key={`s${i}`} p={[-2.4 + i * 0.3, 1.9, -1.9]} s={[0.08, 3.0, 0.1]} c={i % 3 ? P.timber : P.timberLight} />
        ))}
        {/* glass wall on the left */}
        <B p={[-2.6, 1.9, 0]} s={[0.04, 3.0, 3.8]} c="#cfe0e3" m={mat('#cfe0e3', { opacity: 0.28, rough: 0.1 })} shadow={false} />
      </Rise>
      <Rise delay={t + 0.8} mode="drop" distance={3} position={[0.25, 3.5, 0]}>
        <WaveRoof />
      </Rise>
      <Rise delay={t + 1.0} mode="pop" position={[0.3, 0.42, -0.9]}>
        <Table w={2.2} d={0.9} h={0.8} c={P.timberDark} />
        {/* monitor */}
        <B p={[-0.3, 1.15, -0.2]} s={[0.75, 0.45, 0.04]} c={P.iron} />
        <B p={[-0.3, 1.15, -0.175]} s={[0.68, 0.38, 0.01]} c="#7fb0c4" m={mat('#7fb0c4', { emissive: '#7fb0c4', emissiveIntensity: 0.9 })} shadow={false} />
        <B p={[-0.3, 0.88, -0.2]} s={[0.05, 0.16, 0.05]} c={P.iron} />
        {/* notebook + coffee */}
        <B p={[0.55, 0.81, 0.05]} s={[0.38, 0.03, 0.28]} c={P.paper} />
        <Cyl p={[0.85, 0.86, -0.1]} rt={0.06} rb={0.05} h={0.13} c={P.white} seg={10} />
      </Rise>
      <Rise delay={t + 1.15} mode="pop" position={[0.3, 0.42, 0.0]}>
        {/* chair */}
        <B p={[0, 0.45, 0]} s={[0.5, 0.06, 0.5]} c={P.white} />
        <B p={[0, 0.75, 0.24]} s={[0.5, 0.55, 0.05]} c={P.white} />
        <Cyl p={[0, 0.22, 0]} rt={0.04} h={0.45} c={P.iron} seg={6} />
        <Cyl p={[0, 0.03, 0]} rt={0.25} h={0.04} c={P.iron} seg={5} />
      </Rise>
      <Rise delay={t + 1.25} mode="pop" position={[2.4, 1.85, -1.75]}>
        <SystemBoard p={[0, 0, 0]} />
      </Rise>
      <Rise delay={t + 1.3} mode="pop" position={[-2.0, 0.42, -1.3]}>
        {/* shelf with books */}
        <B p={[0, 0.9, 0]} s={[0.9, 1.8, 0.35]} c={P.timber} />
        {[0.35, 0.95, 1.5].map((y, i) => (
          <group key={i}>
            {[0, 1, 2, 3, 4].map((k) => (
              <B key={k} p={[-0.3 + k * 0.15, y, 0.12]} s={[0.1, 0.32 - (k % 2) * 0.06, 0.24]} c={[P.vermilion, P.indigo, P.paper, P.grassDeep, P.clay][k % 5]} />
            ))}
          </group>
        ))}
      </Rise>
      <Rise delay={t + 1.35} mode="pop" position={[2.6, 0.42, 1.5]}>
        <Cyl p={[0, 0.25, 0]} rt={0.25} rb={0.18} h={0.5} c={P.clay} seg={10} />
        <Shrub p={[0, 0.4, 0]} size={0.6} seed={21} />
      </Rise>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 03 · THE CHAUPAL: a village platform under a neem tree
// ─────────────────────────────────────────────────────────────
function Charpai({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <B p={[0, 0.42, 0]} s={[1.5, 0.06, 0.75]} c={P.tatami} />
      <B p={[0, 0.42, 0.36]} s={[1.6, 0.08, 0.06]} c={P.timberDark} />
      <B p={[0, 0.42, -0.36]} s={[1.6, 0.08, 0.06]} c={P.timberDark} />
      {[
        [0.72, 0.33],
        [-0.72, 0.33],
        [0.72, -0.33],
        [-0.72, -0.33],
      ].map(([x, z], i) => (
        <Cyl key={i} p={[x, 0.2, z]} rt={0.05} h={0.42} c={P.timberDark} seg={6} />
      ))}
    </group>
  );
}

function Matka({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Ball p={[0, 0.22, 0]} r={0.22} c={P.clay} detail={1} />
      <Cyl p={[0, 0.45, 0]} rt={0.09} rb={0.07} h={0.1} c={P.terracottaDark} seg={10} />
    </group>
  );
}

export function Chaupal({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  return (
    <group position={p}>
      <Rise delay={t} mode="rise" distance={1}>
        <Cyl p={[0, 0.25, 0]} rt={2.6} h={0.5} c={P.sandstoneLight} seg={28} />
        <Cyl p={[0, 0.52, 0]} rt={2.45} h={0.05} c={P.stoneLight} seg={28} />
        <Cyl p={[0, 0.7, 0]} rt={0.9} h={0.35} c={P.sandstone} seg={20} />
      </Rise>
      <Rise delay={t + 0.5} mode="grow" position={[0, 0.85, 0]}>
        <UmbrellaTree height={2.2} spread={1.7} seed={7} />
      </Rise>
      <Rise delay={t + 0.9} mode="pop" position={[1.3, 0.55, 1.2]}>
        <Charpai p={[0, 0, 0]} r={0.7} />
      </Rise>
      <Rise delay={t + 1.0} mode="pop" position={[-1.4, 0.55, 1.0]}>
        <Charpai p={[0, 0, 0]} r={-0.5} />
      </Rise>
      <Rise delay={t + 1.1} mode="pop" position={[1.6, 0.55, -1.0]}>
        <Matka p={[0, 0, 0]} />
        <Matka p={[0.4, 0, 0.25]} s={0.8} />
        <Matka p={[0.15, 0, -0.38]} s={0.7} />
      </Rise>
      {/* diyas around the tree base */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <Rise key={i} delay={t + 1.4 + i * 0.04} mode="pop" position={[Math.cos(a) * 0.95, 0.9, Math.sin(a) * 0.95]}>
            <Cyl p={[0, 0, 0]} rt={0.08} rb={0.05} h={0.06} c={P.clay} seg={8} />
            <Ball p={[0, 0.07, 0]} r={0.035} c={P.glow} m={mat(P.glow, { emissive: '#ff9a3c', emissiveIntensity: 3 })} />
          </Rise>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 04 · THE ARENA: a roll ball court
// ─────────────────────────────────────────────────────────────
function Skate({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <B p={[0, 0.16, 0]} s={[0.36, 0.22, 0.16]} c={P.white} />
      <B p={[-0.06, 0.32, 0]} s={[0.2, 0.18, 0.15]} c={P.white} />
      <B p={[0.05, 0.08, 0]} s={[0.36, 0.04, 0.12]} c={P.iron} />
      {[-0.13, -0.04, 0.05, 0.14].map((x, i) => (
        <Cyl key={i} p={[x, 0.04, 0]} rt={0.04} h={0.05} c={P.vermilion} r={[Math.PI / 2, 0, 0]} seg={10} />
      ))}
    </group>
  );
}

function Goal({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <B p={[0, 0.5, -0.5]} s={[0.05, 1, 0.05]} c={P.white} />
      <B p={[0, 0.5, 0.5]} s={[0.05, 1, 0.05]} c={P.white} />
      <B p={[0, 1, 0]} s={[0.05, 0.05, 1.05]} c={P.white} />
      <mesh position={[-0.25, 0.5, 0]} rotation={[0, Math.PI / 2, 0]} material={mat('#ffffff', { opacity: 0.35 })}>
        <planeGeometry args={[1, 1, 6, 6]} />
      </mesh>
    </group>
  );
}

function RollBall({ start }: { start: [number, number, number] }) {
  // The ball keeps rolling between the two D's once the world is built
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const k = clock.elapsedTime * 0.5;
    ref.current.position.x = start[0] + Math.sin(k) * 1.6;
    ref.current.position.z = start[2] + Math.sin(k * 1.7) * 0.6;
    ref.current.rotation.z = -Math.sin(k) * 6;
  });
  return (
    <mesh ref={ref} position={start} castShadow material={mat('#e2622f', { rough: 0.5 })}>
      <sphereGeometry args={[0.13, 14, 10]} />
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('#2f4fa0')}>
        <torusGeometry args={[0.131, 0.02, 6, 20]} />
      </mesh>
    </mesh>
  );
}

export function Arena({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  const L = 7.2;
  const Wd = 4.4;
  const line = P.white;
  return (
    <group position={p}>
      <Rise delay={t} mode="rise" distance={1}>
        <B p={[0, 0.15, 0]} s={[L + 0.8, 0.3, Wd + 0.8]} c={P.stoneLight} />
        <B p={[0, 0.32, 0]} s={[L, 0.05, Wd]} c={P.terracotta} m={mat(P.terracotta, { rough: 0.95 })} />
      </Rise>
      <Rise delay={t + 0.35} mode="pop" position={[0, 0.35, 0]}>
        {/* boundary + halfway line */}
        <B p={[0, 0, Wd / 2 - 0.08]} s={[L - 0.15, 0.01, 0.04]} c={line} shadow={false} />
        <B p={[0, 0, -Wd / 2 + 0.08]} s={[L - 0.15, 0.01, 0.04]} c={line} shadow={false} />
        <B p={[L / 2 - 0.08, 0, 0]} s={[0.04, 0.01, Wd - 0.15]} c={line} shadow={false} />
        <B p={[-L / 2 + 0.08, 0, 0]} s={[0.04, 0.01, Wd - 0.15]} c={line} shadow={false} />
        <B p={[0, 0, 0]} s={[0.04, 0.01, Wd - 0.15]} c={line} shadow={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={mat(line)}>
          <ringGeometry args={[0.85, 0.89, 40]} />
        </mesh>
        {/* goal D's */}
        <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[L / 2 - 0.08, 0.006, 0]} material={mat(line)}>
          <ringGeometry args={[1.25, 1.29, 30, 1, 0, Math.PI]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-L / 2 + 0.08, 0.006, 0]} material={mat(line)}>
          <ringGeometry args={[1.25, 1.29, 30, 1, 0, Math.PI]} />
        </mesh>
      </Rise>
      <Rise delay={t + 0.6} mode="drop" distance={2} position={[L / 2 - 0.1, 0.34, 0]}>
        <Goal p={[0, 0, 0]} />
      </Rise>
      <Rise delay={t + 0.7} mode="drop" distance={2} position={[-L / 2 + 0.1, 0.34, 0]}>
        <Goal p={[0, 0, 0]} r={Math.PI} />
      </Rise>
      <Rise delay={t + 1.0} mode="drop" distance={3} position={[0, 0.34, 0]}>
        <RollBall start={[0.4, 0.13, 0.3]} />
      </Rise>
      {/* bench with skates and a towel */}
      <Rise delay={t + 0.9} mode="pop" position={[1.4, 0.3, -Wd / 2 - 0.15]}>
        <B p={[0, 0.3, 0]} s={[2.0, 0.6, 0.45]} c={P.stoneLight} />
        <B p={[-0.5, 0.62, 0]} s={[0.55, 0.04, 0.42]} c={P.white} />
        <Skate p={[0.35, 0.6, 0.02]} r={0.3} />
        <Skate p={[0.7, 0.6, -0.05]} r={-0.1} />
        <Cyl p={[-0.85, 0.75, 0]} rt={0.06} h={0.28} c="#d8e6e6" seg={8} />
      </Rise>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 05 · THE PRESS: a letterpress shop with the L.I.T.E. cover on an easel
// ─────────────────────────────────────────────────────────────
function useCoverTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 340;
    const g = c.getContext('2d')!;
    g.fillStyle = '#c2402a';
    g.fillRect(0, 0, 256, 340);
    g.fillStyle = '#f6f0e2';
    g.font = 'bold 62px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('L.I.T.E.', 128, 120);
    g.font = '18px monospace';
    g.fillText('CIVIL · BITS PILANI', 128, 160);
    g.fillRect(48, 200, 160, 4);
    g.font = 'italic 22px Georgia, serif';
    g.fillText('revived, vol. 1', 128, 300);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

export function Press({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  const cover = useCoverTexture();
  return (
    <group position={p}>
      <Rise delay={t} mode="rise" distance={1}>
        <B p={[0, 0.2, 0]} s={[4.6, 0.4, 3.8]} c={P.stoneLight} />
        <B p={[0, 0.42, 0]} s={[4.2, 0.04, 3.4]} c="#cdb48e" />
      </Rise>
      <Rise delay={t + 0.15} mode="grow">
        <B p={[0, 1.7, -1.55]} s={[4.2, 2.6, 0.25]} c={P.plaster} />
        <B p={[-1.98, 1.7, 0]} s={[0.25, 2.6, 3.4]} c={P.plaster} />
        {/* timber frame */}
        <B p={[0, 3.05, -1.55]} s={[4.4, 0.16, 0.35]} c={P.timberDark} />
        <B p={[-1.98, 3.05, 0]} s={[0.35, 0.16, 3.6]} c={P.timberDark} />
        <B p={[1.95, 1.7, -1.55]} s={[0.18, 2.7, 0.3]} c={P.timberDark} />
        {/* type case on the wall */}
        <B p={[-0.6, 2.1, -1.38]} s={[1.6, 0.9, 0.12]} c={P.timber} />
        {Array.from({ length: 12 }).map((_, i) => (
          <B key={i} p={[-1.25 + (i % 6) * 0.26, 2.32 - Math.floor(i / 6) * 0.42, -1.31]} s={[0.2, 0.32, 0.02]} c={P.timberDark} shadow={false} />
        ))}
      </Rise>
      {/* awning in printer's ink blue */}
      <Rise delay={t + 0.7} mode="drop" distance={2} position={[0, 3.0, -0.7]}>
        <B p={[0, 0, 0]} r={[0.35, 0, 0]} s={[4.3, 0.06, 1.8]} c={P.indigo} />
      </Rise>
      {/* letterpress machine */}
      <Rise delay={t + 0.9} mode="pop" position={[-0.7, 0.44, -0.4]}>
        <B p={[0, 0.35, 0]} s={[1.1, 0.7, 0.7]} c={P.iron} m={mat(P.iron, { rough: 0.5, metal: 0.4 })} />
        <Cyl p={[0, 0.85, 0]} rt={0.28} h={0.75} c={P.iron} r={[Math.PI / 2, 0, 0]} m={mat('#3c3833', { rough: 0.4, metal: 0.5 })} />
        <mesh position={[0.62, 0.7, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={mat(P.vermilion, { rough: 0.5, metal: 0.3 })}>
          <torusGeometry args={[0.35, 0.04, 6, 20]} />
        </mesh>
      </Rise>
      {/* paper stacks */}
      <Rise delay={t + 1.0} mode="drop" distance={1.5} position={[0.9, 0.44, -0.9]}>
        {[0, 1, 2, 3].map((i) => (
          <B key={i} p={[i * 0.03, 0.06 + i * 0.12, 0]} s={[0.6, 0.11, 0.45]} c={i % 2 ? P.paper : P.white} />
        ))}
      </Rise>
      {/* the L.I.T.E. cover on an easel */}
      <Rise delay={t + 1.15} mode="pop" position={[1.2, 0.44, 0.9]}>
        <B p={[0, 0.6, -0.15]} r={[-0.25, 0, 0]} s={[0.05, 1.3, 0.05]} c={P.timberDark} />
        <B p={[-0.35, 0.55, 0.1]} r={[0.15, 0, 0.12]} s={[0.05, 1.15, 0.05]} c={P.timberDark} />
        <B p={[0.35, 0.55, 0.1]} r={[0.15, 0, -0.12]} s={[0.05, 1.15, 0.05]} c={P.timberDark} />
        <mesh position={[0, 0.82, 0.08]} rotation={[-0.15, -0.5, 0]} castShadow>
          <boxGeometry args={[0.75, 1.0, 0.03]} />
          <meshStandardMaterial attach="material-0" color={P.vermilion} />
          <meshStandardMaterial attach="material-1" color={P.vermilion} />
          <meshStandardMaterial attach="material-2" color={P.vermilion} />
          <meshStandardMaterial attach="material-3" color={P.vermilion} />
          <meshStandardMaterial attach="material-4" map={cover ?? undefined} color={cover ? '#ffffff' : P.vermilion} />
          <meshStandardMaterial attach="material-5" color={P.vermilion} />
        </mesh>
      </Rise>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 06 · THE NOTEBOOK: a Japanese engawa by a pond, under a maple
// ─────────────────────────────────────────────────────────────
function Koi({ center, radius, speed, phase, color }: { center: [number, number, number]; radius: number; speed: number; phase: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = clock.elapsedTime * speed + phase;
    ref.current.position.set(center[0] + Math.cos(a) * radius, center[1], center[2] + Math.sin(a) * radius * 0.6);
    ref.current.rotation.y = -a - Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <Ball r={0.09} c={color} scale={[1, 0.4, 2]} />
    </group>
  );
}

export function Pond({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  const rnd = seeded(42);
  const stones = Array.from({ length: 16 }).map((_, i) => {
    const a = (i / 16) * Math.PI * 2 + rnd() * 0.2;
    return { pos: [Math.cos(a) * 1.75, 0.08, Math.sin(a) * 1.05] as [number, number, number], r: 0.18 + rnd() * 0.14 };
  });
  return (
    <group position={p}>
      <Rise delay={t} mode="pop">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={[1, 0.6, 1]} receiveShadow material={mat(P.water, { rough: 0.15, metal: 0.1 })}>
          <circleGeometry args={[1.7, 32]} />
        </mesh>
        <Koi center={[0, 0.07, 0]} radius={0.8} speed={0.45} phase={0} color="#f08a3c" />
        <Koi center={[0, 0.07, 0]} radius={0.5} speed={-0.6} phase={2} color={P.white} />
      </Rise>
      {stones.map((s, i) => (
        <Rise key={i} delay={t + 0.2 + i * 0.02} mode="pop" position={s.pos}>
          <Ball r={s.r} c={i % 3 ? P.rock : P.rockWarm} scale={[1, 0.6, 1]} />
        </Rise>
      ))}
    </group>
  );
}

export function ArchBridge({ p, r = 0, t = 0 }: { p: [number, number, number]; r?: number; t?: number }) {
  // A little arch bridge over the pond. Civil engineering, smallest scale.
  const planks = 11;
  return (
    <group position={p} rotation={[0, r, 0]}>
      {Array.from({ length: planks }).map((_, i) => {
        const u = i / (planks - 1);
        const x = (u - 0.5) * 2.4;
        const y = Math.sin(u * Math.PI) * 0.45 + 0.12;
        const slope = Math.cos(u * Math.PI) * 0.45 * (Math.PI / 2.4);
        return (
          <Rise key={i} delay={t + i * 0.04} mode="drop" distance={1.2} position={[x, y, 0]} rotation={[0, 0, Math.atan(slope)]}>
            <B s={[0.22, 0.06, 0.7]} c={P.vermilion} />
          </Rise>
        );
      })}
      <Rise delay={t + 0.5} mode="pop">
        {[-0.33, 0.33].map((z, i) => (
          <mesh key={i} position={[0, 0.2, z]} scale={[2.4 / 2, 0.75, 1]} material={mat(P.vermilion)}>
            <torusGeometry args={[1, 0.04, 6, 20, Math.PI]} />
          </mesh>
        ))}
      </Rise>
    </group>
  );
}

export function Notebook({ p, t = 0 }: { p: [number, number, number]; t?: number }) {
  return (
    <group position={p}>
      <Rise delay={t} mode="rise" distance={1}>
        <B p={[0, 0.3, 0]} s={[4.0, 0.12, 2.6]} c={P.timber} />
        {[
          [1.9, 1.2],
          [-1.9, 1.2],
          [1.9, -1.2],
          [-1.9, -1.2],
        ].map(([x, z], i) => (
          <B key={i} p={[x, 0.15, z]} s={[0.14, 0.3, 0.14]} c={P.timberDark} />
        ))}
        <B p={[0.3, 0.38, 0.1]} s={[1.6, 0.04, 1.6]} c={P.tatami} />
      </Rise>
      <Rise delay={t + 0.2} mode="grow">
        {/* shoji screen: frame + paper */}
        <B p={[0, 1.4, -1.2]} s={[3.8, 2.1, 0.05]} c={P.paper} m={mat('#f7efdc', { emissive: '#ffe7b8', emissiveIntensity: 0.15 })} />
        {Array.from({ length: 7 }).map((_, i) => (
          <B key={`v${i}`} p={[-1.8 + i * 0.6, 1.4, -1.17]} s={[0.05, 2.1, 0.04]} c={P.timberDark} />
        ))}
        {[0.5, 1.05, 1.6, 2.15].map((y, i) => (
          <B key={`h${i}`} p={[0, y + 0.3, -1.17]} s={[3.8, 0.04, 0.04]} c={P.timberDark} />
        ))}
        <B p={[0, 2.5, -1.2]} s={[4.1, 0.12, 0.3]} c={P.timberDark} />
      </Rise>
      <Rise delay={t + 0.9} mode="pop" position={[0.3, 0.4, 0.1]}>
        {/* low table, open notebook, books, cushions */}
        <B p={[0, 0.2, 0]} s={[1.0, 0.06, 0.6]} c={P.timberDark} />
        {[
          [0.42, 0.22],
          [-0.42, 0.22],
          [0.42, -0.22],
          [-0.42, -0.22],
        ].map(([x, z], i) => (
          <B key={i} p={[x, 0.09, z]} s={[0.06, 0.18, 0.06]} c={P.timberDark} />
        ))}
        <B p={[-0.12, 0.25, 0]} r={[0, 0, 0.06]} s={[0.26, 0.015, 0.34]} c={P.white} />
        <B p={[0.13, 0.25, 0]} r={[0, 0, -0.06]} s={[0.26, 0.015, 0.34]} c={P.white} />
        <B p={[0.0, 0.26, 0.05]} s={[0.012, 0.01, 0.2]} c={P.iron} shadow={false} />
        <B p={[-0.9, 0.06, 0.15]} s={[0.55, 0.1, 0.55]} c={P.cushion} />
        <B p={[0.85, 0.06, 0.55]} s={[0.5, 0.1, 0.5]} c={P.indigo} />
      </Rise>
      <Rise delay={t + 1.05} mode="drop" distance={1.5} position={[-1.4, 0.4, -0.5]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <B key={i} p={[i * 0.015, 0.04 + i * 0.075, 0]} r={[0, i * 0.15, 0]} s={[0.42, 0.07, 0.3]} c={[P.indigo, P.paper, P.vermilion, P.grassDeep, P.clay][i]} />
        ))}
      </Rise>
      {/* paper lantern (andon) */}
      <Rise delay={t + 1.2} mode="pop" position={[1.6, 0.4, -0.6]}>
        <B p={[0, 0.35, 0]} s={[0.32, 0.6, 0.32]} c={P.paper} m={mat('#fff1d0', { emissive: '#ffcf7a', emissiveIntensity: 1.6 })} />
        <B p={[0, 0.68, 0]} s={[0.38, 0.05, 0.38]} c={P.timberDark} />
        <B p={[0, 0.03, 0]} s={[0.38, 0.05, 0.38]} c={P.timberDark} />
      </Rise>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// The gate: a torii at the front edge, the way in
// ─────────────────────────────────────────────────────────────
export function Torii({ p, r = 0, t = 0 }: { p: [number, number, number]; r?: number; t?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Rise delay={t} mode="grow">
        <Cyl p={[-0.9, 1.25, 0]} rt={0.1} rb={0.13} h={2.5} c={P.vermilion} seg={10} />
        <Cyl p={[0.9, 1.25, 0]} rt={0.1} rb={0.13} h={2.5} c={P.vermilion} seg={10} />
        <B p={[-0.9, 0.08, 0]} s={[0.32, 0.16, 0.32]} c={P.iron} />
        <B p={[0.9, 0.08, 0]} s={[0.32, 0.16, 0.32]} c={P.iron} />
      </Rise>
      <Rise delay={t + 0.35} mode="drop" distance={1.5} position={[0, 2.05, 0]}>
        <B s={[2.3, 0.12, 0.16]} c={P.vermilion} />
      </Rise>
      <Rise delay={t + 0.45} mode="drop" distance={1.5} position={[0, 2.5, 0]}>
        <B s={[2.9, 0.14, 0.28]} c={P.vermilion} />
        <B p={[0, 0.12, 0]} s={[3.1, 0.1, 0.32]} c={P.iron} />
        <B p={[0, -0.2, 0]} s={[0.14, 0.3, 0.14]} c={P.vermilion} />
      </Rise>
    </group>
  );
}

// Re-export so the scene can scatter extra trees and shrubs
export { Tree, Shrub };
