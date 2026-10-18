'use client';

import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, SoftShadows, Sparkles } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { BuildProvider, Rise, type BuildClock } from './build';
import { mat, palette as P, seeded, B, Shrub, CloudTree, ColumnTree } from './kit';
import { Arena, ArchBridge, Chaupal, Notebook, Pond, Press, Studio, Torii, Workshop } from './places';
import { zones, type ZoneId } from './zones';
import { GuideAvatar, type Spot } from './GuideAvatar';
import { compileAll } from './compile';
import { Birds, Clouds, Kite } from './ambient';
import { LIGHT, type Sky } from './sky';
import { Adapt, DPR, useTier, type Tier } from '../three/quality';
import { useMotion } from '@/components/motion/motion';

// Layout of the island. Each place sits on its own footprint; paths join them.
const PLACE: Record<ZoneId, [number, number, number]> = {
  workshop: [-6.8, 0, -3.4],
  studio: [1.2, 0, -4.6],
  commons: [8.6, 0, -2.6],
  arena: [5.6, 0, 4.4],
  press: [-8.2, 0, 3.6],
  notebook: [-2.2, 0, 4.1],
};

const HIT: Record<ZoneId, [number, number, number]> = {
  workshop: [5.8, 4.5, 4.8],
  studio: [6.6, 4.4, 4.8],
  commons: [5.4, 4.5, 5.4],
  arena: [8, 2, 5.2],
  press: [4.8, 3.6, 4.0],
  notebook: [4.4, 3, 3.2],
};

// When each place starts building (seconds on the build clock)
const START: Record<ZoneId, number> = {
  workshop: 0.75,
  arena: 0.85,
  studio: 0.95,
  notebook: 1.05,
  commons: 1.1,
  press: 1.2,
};

export const BUILD_SECONDS = 3.1;

// Where I stand: at the gate as a guide, then inside each place in its outfit.
// rotY = π/4 faces the camera.
const FACE = Math.PI / 4;
// an open place rises a little off the island (PlaceSlot), so I stand that much higher too
const LIFT = 0.22;
const at = (id: ZoneId, dx: number, y: number, dz: number, rotY = FACE): Spot => ({
  pos: [PLACE[id][0] + dx, y + LIFT, PLACE[id][2] + dz],
  rotY,
});
const SPOTS: Record<ZoneId | 'guide', Spot> = {
  guide: { pos: [3.0, 0, 7.5], rotY: FACE },
  workshop: at('workshop', 1.7, 0.45, 1.2),
  studio: at('studio', 1.6, 0.42, 1.0),
  commons: at('commons', -0.3, 0.55, 1.7),
  arena: at('arena', -1.4, 0.35, 0.6),
  press: at('press', 0.1, 0.44, 1.0),
  notebook: at('notebook', 1.3, 0.4, 0.75),
};

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

// ─── the island itself ───────────────────────────────────────
const RX = 12.2;
const RZ = 8.6;
const CX = 0.2;
const CZ = 0.6;
const DEPTH = 1.4;

function rim(theta: number, wobble: (a: number) => number) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const n = 3.2; // superellipse: between a circle and a rounded rectangle
  const r = 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n);
  const w = wobble(theta);
  return [CX + c * r * RX * w, CZ + s * r * RZ * w] as const;
}

function Island() {
  const { geo, rocks, shrubs } = useMemo(() => {
    const wob = (a: number) => 1 + 0.025 * Math.sin(a * 5) + 0.015 * Math.sin(a * 11 + 1);
    const shape = new THREE.Shape();
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const [x, z] = rim((i / N) * Math.PI * 2, wob);
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.25, bevelSegments: 2, curveSegments: 1 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -DEPTH, 0);

    const rnd = seeded(11);
    const rocks: { p: [number, number, number]; r: number; c: string; s: [number, number, number] }[] = [];
    const R = 150;
    for (let i = 0; i < R; i++) {
      const a = (i / R) * Math.PI * 2 + rnd() * 0.02;
      const [x, z] = rim(a, (t) => wob(t) * (1.0 + rnd() * 0.03));
      const tier = i % 3;
      rocks.push({
        p: [x, -0.35 - tier * 0.45 - rnd() * 0.25, z],
        r: 0.45 + rnd() * 0.45,
        c: [P.rock, P.rockDark, P.rockWarm][Math.floor(rnd() * 3)],
        s: [1, 0.7 + rnd() * 0.5, 1],
      });
    }

    const busy = Object.values(PLACE);
    const shrubs: { p: [number, number, number]; size: number; seed: number }[] = [];
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * Math.PI * 2 + rnd() * 0.05;
      const [x, z] = rim(a, (t) => wob(t) * (0.9 + rnd() * 0.05));
      if (busy.some(([bx, , bz]) => Math.hypot(bx - x, (bz - z) * 1.2) < 3.2)) continue;
      shrubs.push({ p: [x, 0, z], size: 0.42 + rnd() * 0.38, seed: i + 100 });
    }
    return { geo: g, rocks, shrubs };
  }, []);

  return (
    <group>
      <Rise delay={0} duration={0.9} mode="rise" distance={5}>
        <mesh geometry={geo} receiveShadow castShadow material={[mat('#d8ccae'), mat(P.rockWarm)]} />
        {/* grass patches */}
        {[
          [-2.6, 0.6, 2.4, 1.4],
          [3.8, -0.4, 2.0, 1.2],
          [-10.2, -0.6, 1.2, 1.8],
          [10.4, 3.6, 1.3, 1.6],
          [-5.0, 7.0, 2.0, 1.0],
          [-4.2, 0.8, 1.4, 1.0],
        ].map(([x, z, sx, sz], i) => (
          <mesh key={i} position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]} receiveShadow material={mat(i % 2 ? P.grass : P.grassDeep)}>
            <circleGeometry args={[1, 18]} />
          </mesh>
        ))}
      </Rise>
      {rocks.map((r, i) => (
        <Rise key={i} delay={0.35 + (i % 25) * 0.012} duration={0.5} mode="pop" position={r.p}>
          <mesh scale={r.s} castShadow receiveShadow material={mat(r.c)}>
            <dodecahedronGeometry args={[r.r, 0]} />
          </mesh>
        </Rise>
      ))}
      {shrubs.map((s, i) => (
        <Rise key={`s${i}`} delay={1.7 + (i % 12) * 0.03} mode="pop" position={s.p}>
          <Shrub size={s.size} seed={s.seed} colors={[P.leafDark, P.grassDeep, P.leaf]} />
        </Rise>
      ))}
    </group>
  );
}

// Stepping-stone paths between the places
function Paths() {
  const routes: [number, number][][] = [
    [
      [1.4, 8.0],
      [0.9, 5.6],
      [0.6, 2.4],
      [0.9, -1.8],
    ],
    [
      [0.6, 0.8],
      [-2.6, 0.2],
      [-4.4, -0.6],
    ],
    [
      [0.8, 0.6],
      [3.6, 0.2],
      [6.0, -0.6],
    ],
    [
      [-0.6, 0.6],
      [-4.6, 2.0],
      [-6.0, 2.4],
    ],
  ];
  const slabs = useMemo(() => {
    const rnd = seeded(5);
    const out: { p: [number, number, number]; r: number; s: number }[] = [];
    for (const route of routes) {
      for (let k = 0; k < route.length - 1; k++) {
        const [x1, z1] = route[k];
        const [x2, z2] = route[k + 1];
        const len = Math.hypot(x2 - x1, z2 - z1);
        const steps = Math.floor(len / 0.62);
        for (let i = 0; i < steps; i++) {
          const u = i / steps;
          out.push({ p: [x1 + (x2 - x1) * u, 0.03, z1 + (z2 - z1) * u], r: Math.atan2(x2 - x1, z2 - z1) + (rnd() - 0.5) * 0.25, s: 0.85 + rnd() * 0.3 });
        }
      }
    }
    return out;
  }, []);
  return (
    <>
      {slabs.map((sl, i) => (
        <Rise key={i} delay={0.55 + i * 0.008} duration={0.35} mode="pop" position={sl.p} rotation={[0, sl.r, 0]}>
          <B s={[0.5 * sl.s, 0.06, 0.42 * sl.s]} c={i % 4 ? P.stoneLight : P.sandstoneLight} />
        </Rise>
      ))}
    </>
  );
}

function Trees() {
  // Cloud-pruned Japanese maples by the notebook and the gate;
  // slim ashoka columns along the Rajasthani side, the way palace walks are lined
  const maples: { p: [number, number, number]; h: number; s: number; seed: number }[] = [
    { p: [-4.4, 0, 6.6], h: 2.0, s: 1.15, seed: 2 },
    { p: [0.4, 0, 3.0], h: 1.7, s: 0.85, seed: 9 },
    { p: [10.6, 0, 3.0], h: 1.8, s: 0.9, seed: 14 },
  ];
  const columns: { p: [number, number, number]; h: number; seed: number }[] = [
    { p: [-10.6, 0, -0.6], h: 3.2, seed: 4 },
    { p: [-10.2, 0, -2.4], h: 2.8, seed: 5 },
    { p: [-3.4, 0, -6.4], h: 3.4, seed: 8 },
    { p: [-2.2, 0, -6.9], h: 2.9, seed: 3 },
    { p: [5.4, 0, -6.2], h: 3.0, seed: 12 },
    { p: [-11, 0, 4.8], h: 2.6, seed: 17 },
    { p: [3.6, 0, 1.2], h: 2.4, seed: 19 },
  ];
  return (
    <>
      {maples.map((t, i) => (
        <Rise key={`m${i}`} delay={1.5 + i * 0.09} mode="grow" position={t.p}>
          <CloudTree height={t.h} size={t.s} seed={t.seed} />
        </Rise>
      ))}
      {columns.map((t, i) => (
        <Rise key={`c${i}`} delay={1.55 + i * 0.06} mode="grow" position={t.p}>
          <ColumnTree height={t.h} seed={t.seed} />
        </Rise>
      ))}
    </>
  );
}

// ─── light that warms into golden hour as the world finishes ───
function Lights({ clock, tier, sky }: { clock: MutableRefObject<BuildClock>; tier: Tier; sky: Sky }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const cool = useMemo(() => new THREE.Color('#a9b8d4'), []);
  const warm = useMemo(() => new THREE.Color(), []);
  const L = LIGHT[sky];
  useFrame(() => {
    const { start, speed } = clock.current;
    const k = start === null ? 0 : easeOut(((performance.now() / 1000 - start) * speed) / BUILD_SECONDS);
    warm.set(L.sun);
    if (sun.current) {
      // the light settles into whatever hour it is in Pilani as the world finishes building
      sun.current.intensity = (0.6 + 2.4 * k) * L.sunK;
      sun.current.color.copy(cool).lerp(warm, k);
      sun.current.position.y = L.sunY;
    }
    if (hemi.current) {
      hemi.current.intensity = (0.7 + 0.5 * k) * L.hemiK;
      hemi.current.color.set(L.hemiSky);
      hemi.current.groundColor.set(L.hemiGround);
    }
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff1da', '#7a6450', 1]} />
      <directionalLight
        ref={sun}
        position={[-14, 18, 10]}
        castShadow
        shadow-mapSize={tier === 2 ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  );
}

// ─── after dark: lantern light pooling at each place, fireflies over the paths ───
// The lamps are in the scene from the first frame, dark until the world is built: adding
// lights later would make every material in the island recompile at once (a visible hitch).
function Lamps({ amount, on }: { amount: number; on: boolean }) {
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  const glow = useRef<THREE.PointLight>(null);
  const k = useRef(0);
  useFrame(({ clock }, dt) => {
    k.current = THREE.MathUtils.damp(k.current, on ? 1 : 0, 3, Math.min(dt, 0.1));
    lights.current.forEach((l, i) => {
      if (!l) return;
      const t = clock.elapsedTime * 7 + i * 1.7;
      l.intensity = k.current * amount * (7 + Math.sin(t) * 0.5 + Math.sin(t * 2.3) * 0.35);
    });
    if (glow.current) glow.current.intensity = k.current * 5 * amount;
  });
  if (amount <= 0) return null;
  return (
    <group>
      {(Object.keys(PLACE) as ZoneId[]).map((id, i) => (
        <pointLight
          key={id}
          ref={(l) => {
            lights.current[i] = l;
          }}
          position={[PLACE[id][0] + 0.8, 2.2, PLACE[id][2] + 1.4]}
          color="#ffb45e"
          distance={7}
          decay={1.7}
        />
      ))}
      <pointLight ref={glow} position={[1.6, 2, 8.4]} color="#ff9b52" intensity={0} distance={5} decay={1.7} />
      {on && amount > 0.6 && <Sparkles count={60} scale={[22, 3, 16]} position={[0.2, 1.4, 0.6]} size={4} speed={0.35} color="#ffd36b" opacity={0.9} noise={1.2} />}
    </group>
  );
}

// ─── camera: settles in during the build, flies to a place on click ───
const VIEW_DIR = new THREE.Vector3(1, 0.86, 1).normalize();
const UP = new THREE.Vector3(0, 1, 0);
const UP_FLOAT = new THREE.Vector3();

function CameraRig({ clock, selected }: { clock: MutableRefObject<BuildClock>; selected: ZoneId | null }) {
  const { camera, size, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const zoomNow = useRef<number | null>(null);
  const orbit = useRef(0);
  const viewDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock: c }, dt) => {
    const cam = camera as THREE.OrthographicCamera;
    const wide = size.width > 760;
    // the island fills a little more of the screen now that the oak frames it
    const fit = wide ? Math.min(size.width / 38.5, size.height / 26.5) : Math.min(size.width / 27, size.height / 17.5);
    const { start, speed } = clock.current;
    const k = start === null ? 0 : easeOut(((performance.now() / 1000 - start) * speed) / (BUILD_SECONDS + 0.4));

    let goalZoom = fit * (1.45 - 0.45 * k);
    // On wide screens the island sits right of centre so the intro copy has room on the left.
    // Screen-right is world (+x, -z); points nearer the camera (+x, +z) sit lower on screen.
    // (y lifts the camera's aim, which seats the island lower, clear of the header and its labels)
    const goal = wide ? new THREE.Vector3(-3.9 + 3.0, 1.9, 3.9 + 3.0) : new THREE.Vector3(0.2, -0.5, 0.6);
    if (selected) {
      const z = zones.find((zz) => zz.id === selected)!;
      const [x, , zp] = PLACE[selected];
      // nudge the place left of centre (or up, on phones) so the card doesn't cover it
      if (wide) goal.set(x + 1.6, 1.2, zp - 1.6);
      else goal.set(x, 1.2 - 7, zp); // phones: look below the place so it rises into the top half, above the card
      goalZoom = fit * z.focusZoom;
    } else {
      // a little parallax with the pointer
      goal.x += pointer.x * 0.6;
      goal.z -= pointer.x * 0.6;
      goal.y += pointer.y * 0.35;
    }

    const ease = 1 - Math.pow(0.0025, dt);
    target.current.lerp(goal, ease);
    zoomNow.current = zoomNow.current === null ? goalZoom : THREE.MathUtils.lerp(zoomNow.current, goalZoom, ease);

    // the view swings a few degrees with the cursor, like turning a model in your hands
    orbit.current = THREE.MathUtils.lerp(orbit.current, selected ? 0 : pointer.x * 0.09, ease * 0.6);
    viewDir.copy(VIEW_DIR).applyAxisAngle(UP, orbit.current);
    const float = Math.sin(c.elapsedTime * 0.45) * 0.06;
    cam.position.copy(target.current).addScaledVector(viewDir, 60).add(UP_FLOAT.set(0, float, 0));
    cam.lookAt(target.current);
    cam.zoom = zoomNow.current;
    cam.updateProjectionMatrix();
  });
  return null;
}

// Tells the page the scene has drawn its first frame, so the build can start on cue
// Before the first frame, compile every shader in the background (parallel compile where
// the browser has it), so the island doesn't freeze the samurai while it gets ready.
function Warm({ onDone }: { onDone: () => void }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    let alive = true;
    const { gl, scene, camera } = get();
    const done = () => alive && onDone();
    const fallback = window.setTimeout(done, 2500);
    (compileAll(gl, scene, camera) ?? Promise.resolve())
      .catch(() => {})
      .then(() => {
        window.clearTimeout(fallback);
        done();
      });
    return () => {
      alive = false;
      window.clearTimeout(fallback);
    };
  }, [get, onDone]);
  return null;
}

function FirstFrame({ onFrame }: { onFrame?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onFrame?.();
  });
  return null;
}

// Soft shadow under the floating island
function GroundShadow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(70,45,25,0.38)');
    grd.addColorStop(1, 'rgba(70,45,25,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, -3.6, 1.5]} scale={[34, 26, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

// Hover lift + hit area for a place
function PlaceSlot({
  id,
  hovered,
  selected,
  ready,
  onHover,
  onSelect,
  children,
}: {
  id: ZoneId;
  hovered: ZoneId | null;
  selected: ZoneId | null;
  ready: boolean;
  onHover: (id: ZoneId | null) => void;
  onSelect: (id: ZoneId) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const [x, , z] = PLACE[id];
  const [hx, hy, hz] = HIT[id];
  const zone = zones.find((zz) => zz.id === id)!;
  const lifted = ready && (hovered === id || selected === id);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, lifted ? LIFT : 0, 1 - Math.pow(0.001, dt));
  });
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), []);
  return (
    <group>
      <group ref={ref}>{children}</group>
      <mesh
        position={[x, hy / 2, z]}
        material={hitMat}
        onPointerOver={(e) => {
          if (!ready) return;
          e.stopPropagation();
          onHover(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          if (!ready) return;
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <boxGeometry args={[hx, hy, hz]} />
      </mesh>
      {ready && (
        <Html position={[x, zone.labelHeight, z]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          {/* the same names as the Places list, which is what keyboards and screen readers use */}
          <div aria-hidden="true" className={`world-label ${hovered === id || selected === id ? 'is-active' : ''} ${selected && selected !== id ? 'is-dim' : ''}`}>
            <span className="world-label__index">{zone.index}</span>
            <span className="world-label__name">{zone.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export type DioramaProps = {
  clock: MutableRefObject<BuildClock>;
  onFirstFrame?: () => void;
  ready: boolean;
  hovered: ZoneId | null;
  selected: ZoneId | null;
  onHover: (id: ZoneId | null) => void;
  onSelect: (id: ZoneId | null) => void;
  sky?: Sky;
  // leaving for a place: stop drawing so the browser can build the next page
  away?: boolean;
};

export default function Diorama({ clock, onFirstFrame, ready, hovered, selected, onHover, onSelect, sky = 'day', away = false }: DioramaProps) {
  const slot = (id: ZoneId, node: React.ReactNode) => (
    <PlaceSlot key={id} id={id} hovered={hovered} selected={selected} ready={ready} onHover={onHover} onSelect={onSelect}>
      {node}
    </PlaceSlot>
  );
  const [tier, lower] = useTier();
  // motion paused: draw only when something changes (a click, a hover)
  const motion = useMotion();
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  // leaving while a place is hovered skips pointer-out, so hand the cursor back here
  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);
  return (
    <Canvas
      orthographic
      frameloop={away || !warm ? 'never' : motion ? 'always' : 'demand'}
      shadows={tier > 0}
      dpr={DPR[tier]}
      camera={{ position: [60, 52, 60], zoom: 30, near: 0.1, far: 400 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
      // reading every shader's error log makes the browser finish compiling it on the spot;
      // only worth it while developing
      onCreated={({ gl }) => (gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production')}
    >
      <BuildProvider clock={clock}>
        {!warm && <Warm onDone={onWarm} />}
        <FirstFrame onFrame={onFirstFrame} />
        <Adapt onDecline={lower} />
        {tier === 2 && <SoftShadows size={14} samples={10} focus={0.5} />}
        <Lights clock={clock} tier={tier} sky={sky} />
        <Lamps amount={LIGHT[sky].lamps} on={ready} />
        <CameraRig clock={clock} selected={selected} />
        <GroundShadow />
        <Island />
        <Paths />
        <Trees />
        {slot('workshop', <Workshop p={PLACE.workshop} t={START.workshop} />)}
        {slot('studio', <Studio p={PLACE.studio} t={START.studio} />)}
        {slot('commons', <Chaupal p={PLACE.commons} t={START.commons} />)}
        {slot('arena', <Arena p={PLACE.arena} t={START.arena} />)}
        {slot('press', <Press p={PLACE.press} t={START.press} />)}
        {slot(
          'notebook',
          <group>
            <Notebook p={PLACE.notebook} t={START.notebook} />
            <Pond p={[-2.4, 0, 7.0]} t={1.3} />
            <ArchBridge p={[-2.4, 0, 7.0]} r={0.15} t={1.7} />
          </group>,
        )}
        <Torii p={[1.6, 0, 8.1]} r={-0.25} t={1.9} />
        {/* in the scene from the start (so their shaders are compiled with the rest), shown once it's built */}
        <group visible={ready}>
          {sky !== 'night' && <Birds />}
          <Clouds night={sky === 'night'} />
          <Kite anchor={[PLACE.commons[0] - 0.6, 0.6, PLACE.commons[2] + 0.4]} />
        </group>
        <GuideAvatar active={ready} outfit={selected ?? 'guide'} spot={SPOTS[selected ?? 'guide']} look={hovered && hovered !== selected ? PLACE[hovered] : null} />
      </BuildProvider>
    </Canvas>
  );
}
