'use client';

import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';

// The arena, built for the film: an indigo court with lime lines under a lighting truss,
// goals drawn in clean white line, a dark crowd with phone lights, hanging banners.

export const COURT = { w: 22, d: 12 };
export const GOAL_X = 9.4;

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function floorTexture() {
  const W = 2048;
  const H = Math.round((W * COURT.d) / COURT.w);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
  grd.addColorStop(0, '#2c3366');
  grd.addColorStop(1, '#181c3a');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  // boards
  for (let y = 0; y < H; y += 22) {
    g.fillStyle = `rgba(0,0,0,${0.05 + rnd(y) * 0.06})`;
    g.fillRect(0, y, W, 2);
  }
  const s = W / COURT.w;
  const m = 0.6 * s;
  g.strokeStyle = 'rgba(198,242,74,0.92)';
  g.lineWidth = 0.07 * s;
  g.strokeRect(m, m, W - 2 * m, H - 2 * m);
  g.beginPath();
  g.moveTo(W / 2, m);
  g.lineTo(W / 2, H - m);
  g.stroke();
  // the centre: a vermilion disc in a double ring
  g.fillStyle = 'rgba(226,69,42,0.55)';
  g.beginPath();
  g.arc(W / 2, H / 2, 1.2 * s, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(W / 2, H / 2, 1.9 * s, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 0.03 * s;
  g.beginPath();
  g.arc(W / 2, H / 2, 2.2 * s, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 0.07 * s;
  for (const [x, dir] of [
    [m, 1],
    [W - m, -1],
  ] as const) {
    g.fillStyle = 'rgba(226,69,42,0.22)';
    g.beginPath();
    g.arc(x, H / 2, 3.2 * s, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : (3 * Math.PI) / 2);
    g.fill();
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function Floor({ hq }: { hq: boolean }) {
  const tex = useMemo(floorTexture, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[COURT.w, COURT.d]} />
        {hq ? (
          <MeshReflectorMaterial
            map={tex}
            resolution={1024}
            blur={[300, 90]}
            mixBlur={1}
            mixStrength={1.0}
            mirror={0.3}
            roughness={0.6}
            metalness={0}
            depthScale={0.5}
            minDepthThreshold={0.6}
            maxDepthThreshold={1.2}
          />
        ) : (
          <meshStandardMaterial map={tex} roughness={0.35} metalness={0.1} />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[70, 50]} />
        <meshStandardMaterial color="#0c0e1a" roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0, 0.32, side * (COURT.d / 2 + 0.45)]} castShadow receiveShadow>
            <boxGeometry args={[COURT.w + 1.2, 0.64, 0.14]} />
            <meshStandardMaterial color="#141832" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, side * (COURT.d / 2 + 0.37)]}>
            <boxGeometry args={[COURT.w - 1, 0.07, 0.02]} />
            <meshStandardMaterial color="#000" emissive={side < 0 ? '#c6f24a' : '#e2452a'} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// a goal in clean line: a white frame and a net of straight strokes
export function Goal({ x, facing }: { x: number; facing: 1 | -1 }) {
  const W = 2.6;
  const H = 1.5;
  const D = 0.9;
  const net = useMemo(() => {
    const pts: number[] = [];
    const n = 14;
    // back
    for (let i = 0; i <= n; i++) {
      const z = -W / 2 + (W * i) / n;
      pts.push(D, 0, z, D, H, z);
    }
    for (let i = 0; i <= 8; i++) {
      const y = (H * i) / 8;
      pts.push(D, y, -W / 2, D, y, W / 2);
    }
    // top and sides
    for (let i = 0; i <= n; i++) {
      const z = -W / 2 + (W * i) / n;
      pts.push(0, H, z, D, H, z);
    }
    for (const z of [-W / 2, W / 2]) {
      for (let i = 0; i <= 8; i++) {
        const y = (H * i) / 8;
        pts.push(0, y, z, D, y, z);
      }
      for (let i = 0; i <= 5; i++) {
        const xx = (D * i) / 5;
        pts.push(xx, 0, z, xx, H, z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const post = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f3ebdd', roughness: 0.3, emissive: '#f3ebdd', emissiveIntensity: 0.15 }), []);
  return (
    <group position={[x, 0, 0]} rotation={[0, facing < 0 ? Math.PI : 0, 0]}>
      {[-W / 2, W / 2].map((z) => (
        <mesh key={z} position={[0, H / 2, z]} material={post} castShadow>
          <cylinderGeometry args={[0.05, 0.05, H, 16]} />
        </mesh>
      ))}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={post} castShadow>
        <cylinderGeometry args={[0.05, 0.05, W, 16]} />
      </mesh>
      <lineSegments geometry={net}>
        <lineBasicMaterial color="#e9eef7" transparent opacity={0.55} />
      </lineSegments>
    </group>
  );
}

function silhouette() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(32, 26, 14, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(6, 96);
  g.quadraticCurveTo(8, 46, 32, 44);
  g.quadraticCurveTo(56, 46, 58, 96);
  g.fill();
  return new THREE.CanvasTexture(c);
}

// the crowd: rows of dark figures, a few phone lights, all on their feet for the goal
export function Crowd({ cheer }: { cheer: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const lights = useRef<THREE.Points>(null);
  const ROWS = 6;
  const N = 560;
  const seats = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const row = i % ROWS;
        const col = Math.floor(i / ROWS);
        return {
          p: new THREE.Vector3(-19 + col * 0.42 + (row % 2) * 0.2 + (rnd(i) - 0.5) * 0.1, 1.15 + row * 0.55, -(COURT.d / 2 + 2.2 + row * 0.7)),
          ph: rnd(i + 7) * Math.PI * 2,
          s: 0.85 + rnd(i + 3) * 0.3,
        };
      }),
    [],
  );
  const tex = useMemo(silhouette, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    seats.forEach((_, i) => {
      c.setHSL(0.64 + rnd(i + 11) * 0.06, 0.3, 0.07 + rnd(i + 13) * 0.08);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seats]);
  const phone = useMemo(() => {
    const idx = seats.map((_, i) => i).filter((i) => rnd(i + 29) < 0.12);
    return { idx, pos: new Float32Array(idx.length * 3) };
  }, [seats]);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const jump = cheer.current;
    seats.forEach((s, i) => {
      dummy.position.copy(s.p);
      dummy.position.y += Math.abs(Math.sin(t * 7 + s.ph)) * 0.24 * jump + Math.sin(t * 1.3 + s.ph) * 0.015;
      dummy.scale.set(0.5 * s.s, 0.75 * s.s, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    if (lights.current) {
      phone.idx.forEach((i, k) => {
        const s = seats[i];
        phone.pos[k * 3] = s.p.x + 0.12;
        phone.pos[k * 3 + 1] = s.p.y + 0.15 + Math.abs(Math.sin(t * 7 + s.ph)) * 0.24 * jump + jump * 0.35;
        phone.pos[k * 3 + 2] = s.p.z + 0.05;
      });
      lights.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  return (
    <group>
      {Array.from({ length: ROWS }, (_, r) => (
        <mesh key={r} position={[0, 0.3 + r * 0.55, -(COURT.d / 2 + 2.2 + r * 0.7) - 0.2]} receiveShadow>
          <boxGeometry args={[40, 0.6 + r * 0.55 * 2, 0.7]} />
          <meshStandardMaterial color="#0e1022" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[undefined, undefined, N]}>
        <planeGeometry args={[1, 1.5]} />
        <meshBasicMaterial map={tex} alphaTest={0.5} />
      </instancedMesh>
      <points ref={lights} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[phone.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#fff3d6" toneMapped={false} />
      </points>
    </group>
  );
}

function bannerTexture(text: string, bg: string) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 512);
  g.fillStyle = '#c6f24a';
  g.fillRect(0, 0, 128, 10);
  g.fillRect(0, 502, 128, 10);
  g.fillStyle = '#f3ebdd';
  g.font = 'bold 74px "Yu Gothic", "Hiragino Sans", "MS Gothic", sans-serif';
  g.textAlign = 'center';
  [...text].forEach((ch, i) => g.fillText(ch, 64, 100 + i * 84));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// the roof: a lighting truss with lamps, hanging banners
export function Roof({ bars }: { bars: THREE.MeshBasicMaterial }) {
  const b1 = useMemo(() => bannerTexture('ロールボール', '#b8321f'), []);
  const b2 = useMemo(() => bannerTexture('スケート', '#1f2a5c'), []);
  return (
    <group>
      {[-3.2, 3.2].map((z) => (
        <mesh key={z} position={[0, 8.2, z]}>
          <boxGeometry args={[26, 0.12, 0.12]} />
          <meshStandardMaterial color="#20232e" />
        </mesh>
      ))}
      {[-8, -4, 0, 4, 8].map((x) =>
        [-3.2, 3.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 8.05, z]} rotation={[Math.PI / 2, 0, 0]} material={bars}>
            <circleGeometry args={[0.3, 24]} />
          </mesh>
        )),
      )}
      <mesh position={[-6, 6.2, -12.5]}>
        <planeGeometry args={[1.2, 4.6]} />
        <meshBasicMaterial map={b1} toneMapped={false} color="#9a9a9a" />
      </mesh>
      <mesh position={[6, 6.2, -12.5]}>
        <planeGeometry args={[1.2, 4.6]} />
        <meshBasicMaterial map={b2} toneMapped={false} color="#9a9a9a" />
      </mesh>
    </group>
  );
}

export function ballTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f3ebdd';
  g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? '#1f2a5c' : '#e2452a';
    g.beginPath();
    g.ellipse(64 + i * 128, 128, 46, 128, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#0b0908';
  g.fillRect(0, 124, 512, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
