'use client';

import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// The air around the island: a flock wheeling overhead, clouds drifting under the rim,
// and a kite from the Chaupal, because it's Jaipur. Small things that keep the world
// moving while you read.

const BIRD = '#3b2d25';

function Bird({ seed }: { seed: number }) {
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const wing = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // a swept wing: root at the body, tip out and back
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.09, 0, 0, -0.06, 0.42, 0.02, -0.16], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const p = useMemo(() => {
    const r = (n: number) => {
      const s = Math.sin(seed * 91.7 + n * 13.1) * 43758.5;
      return s - Math.floor(s);
    };
    return { off: r(1) * Math.PI * 2, rad: 0.6 + r(2) * 1.8, h: r(3) * 1.4, flap: 7 + r(4) * 3, lag: r(5) * 0.9 };
  }, [seed]);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime * 0.11 - p.lag * 0.08;
    // the flock circles wide of the island, rising and dipping together
    const R = 11.5;
    const cx = Math.cos(t) * R + Math.cos(p.off) * p.rad;
    const cz = Math.sin(t) * R * 0.75 + Math.sin(p.off) * p.rad;
    const cy = 5.6 + p.h + Math.sin(clock.elapsedTime * 0.4 + p.off) * 0.4;
    g.position.set(cx, cy, cz);
    // face along the path, banking into the turn
    const ahead = new THREE.Vector3(Math.cos(t + 0.02) * R, cy, Math.sin(t + 0.02) * R * 0.75);
    g.lookAt(ahead.x + Math.cos(p.off) * p.rad, cy, ahead.z + Math.sin(p.off) * p.rad);
    g.rotateZ(-0.35);
    // flap in bursts, then glide
    const burst = Math.sin(clock.elapsedTime * 0.7 + p.off) > -0.2 ? 1 : 0.15;
    const a = Math.sin(clock.elapsedTime * p.flap + p.off) * 0.7 * burst + 0.15;
    if (left.current) left.current.rotation.z = a;
    if (right.current) right.current.rotation.z = -a;
  });

  return (
    <group ref={root} scale={0.9}>
      <mesh>
        <coneGeometry args={[0.045, 0.32, 5]} />
        <meshStandardMaterial color={BIRD} roughness={0.9} />
      </mesh>
      <mesh ref={left} geometry={wing} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color={BIRD} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh ref={right} geometry={wing} scale={[-1, 1, 1]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color={BIRD} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Birds({ count = 9 }: { count?: number }) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Bird key={i} seed={i + 1} />
      ))}
    </group>
  );
}

// soft puffs below the island's rim, drifting slowly round it
export function Clouds({ night = false }: { night?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const out: { a: number; r: number; y: number; s: number; parts: [number, number, number, number][] }[] = [];
    for (let i = 0; i < 9; i++) {
      const parts: [number, number, number, number][] = [];
      const n = 4 + (i % 3);
      for (let k = 0; k < n; k++) parts.push([(k - n / 2) * 0.9, Math.sin(k * 1.7) * 0.25, Math.cos(k * 2.3) * 0.4, 0.75 + ((k * 37) % 5) * 0.12]);
      out.push({ a: (i / 9) * Math.PI * 2 + (i % 2) * 0.3, r: 13.5 + (i % 3) * 1.6, y: -1.6 - (i % 4) * 0.55, s: 0.9 + (i % 3) * 0.25, parts });
    }
    return out;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fffaf1', roughness: 1, transparent: true, opacity: 0.92, emissive: '#fff4e2', emissiveIntensity: 0.25 }), []);
  // by day they glow warm; at night they take the moon's cool light and sit back in the dark
  useEffect(() => {
    mat.color.set(night ? '#b9c2e4' : '#fffaf1');
    mat.emissive.set(night ? '#29305a' : '#fff4e2');
    mat.emissiveIntensity = night ? 0.4 : 0.25;
    mat.opacity = night ? 0.82 : 0.92;
  }, [mat, night]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });
  return (
    <group ref={ref}>
      {puffs.map((c, i) => (
        <group key={i} position={[Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r * 0.8]} scale={c.s}>
          {c.parts.map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]} material={mat} scale={[r * 1.2, r * 0.75, r]}>
              <icosahedronGeometry args={[0.9, 2]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// a patang over the island, flown from the Chaupal's courtyard
export function Kite({ anchor }: { anchor: [number, number, number] }) {
  const kite = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const line = useMemo(() => {
    const pts = Array.from({ length: 16 }, () => new THREE.Vector3());
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#5a4636', transparent: true, opacity: 0.55 }));
  }, []);
  const a = useMemo(() => new THREE.Vector3(...anchor), [anchor]);
  const tailGeo = useMemo(() => new THREE.PlaneGeometry(0.12, 1.4, 1, 12), []);
  const tailBase = useMemo(() => Float32Array.from(tailGeo.attributes.position.array as Float32Array), [tailGeo]);

  useFrame(({ clock }) => {
    const k = kite.current;
    if (!k) return;
    const t = clock.elapsedTime;
    k.position.set(a.x - 3.2 + Math.sin(t * 0.37) * 0.9, 7.4 + Math.sin(t * 0.53) * 0.5, a.z - 3.4 + Math.cos(t * 0.29) * 0.8);
    k.rotation.set(-0.5 + Math.sin(t * 0.9) * 0.08, 0.8 + Math.sin(t * 0.4) * 0.25, Math.sin(t * 1.3) * 0.22);
    // the string sags in a gentle curve from hand to kite
    const pos = line.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 16; i++) {
      const u = i / 15;
      const x = THREE.MathUtils.lerp(a.x, k.position.x, u);
      const y = THREE.MathUtils.lerp(a.y, k.position.y, u) - Math.sin(u * Math.PI) * 0.9;
      const z = THREE.MathUtils.lerp(a.z, k.position.z, u);
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    // the tail ripples
    const tp = tailGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < tp.count; i++) {
      const y = tailBase[i * 3 + 1];
      const u = (0.7 - y) / 1.4;
      tp.setX(i, tailBase[i * 3] + Math.sin(t * 6 - u * 7) * 0.12 * u);
    }
    tp.needsUpdate = true;
  });

  return (
    <>
      <group ref={kite}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial color="#e8452c" side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.33, 0.005]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.42, 0.42]} />
          <meshStandardMaterial color="#f2b705" side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.02, 1.34, 0.01]} />
          <meshStandardMaterial color="#6b4a30" />
        </mesh>
        <mesh ref={tail} geometry={tailGeo} position={[0, -1.35, 0]}>
          <meshStandardMaterial color="#f2b705" side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      </group>
      <primitive object={line} />
    </>
  );
}
