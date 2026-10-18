'use client';

import * as THREE from 'three';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Warm } from '@/components/world/Warm';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Adapt, DPR, useTier, type Tier } from '@/components/three/quality';
import { useMotion } from '@/components/motion/motion';
import { InkEffect } from '../cinematic/ink';
import { DUR, R, SCENE, sceneAt, speedAt } from '../cinematic/timeline';
import '../cinematic/cinematic.css';
import { Overlay } from './overlay';
import { buildSkater } from './skater';
import { animate, jumpAt } from './motion';
import { Crowd, Floor, GOAL_X, Goal, Roof, ballTexture } from './stage';
import { Burst, Confetti, Motes, Ring, Trail, WheelSparks } from './fx';

// The Arena, as an anime short. One real-time clock (the soundtrack's, when it plays)
// drives everything: the speed ramp turns it into the scene's own seconds, the camera
// cuts between seven shots, the frame is inked, and the 2D layer is drawn on top.

const SCORE = '/audio/arena-score.mp3';
// with motion off, the film rests on one frame: the strike
const STILL = R.shot + 0.2;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const inExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// his line down the court: in from the far left, cut across, square up for the shot
const PATH = new THREE.CatmullRomCurve3(
  [new THREE.Vector3(-8.5, 0, 3), new THREE.Vector3(-4.5, 0, -1.4), new THREE.Vector3(-0.5, 0, 1.8), new THREE.Vector3(3.2, 0, 0.5), new THREE.Vector3(5.4, 0, 0.2)],
  false,
  'catmullrom',
  0.4,
);
function travel(s: number) {
  if (s < SCENE.shot) return 0.88 * (s / SCENE.shot);
  return 0.88 + 0.12 * (1 - Math.pow(1 - clamp01((s - SCENE.shot) / 1.6), 3));
}

function coneTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#888');
  grd.addColorStop(0.7, '#2a2a2a');
  grd.addColorStop(1, '#000');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

type Clk = { r: number };

function Director({
  clk,
  audio,
  overlay,
  tier,
  live,
  still,
}: {
  clk: React.MutableRefObject<Clk>;
  audio: React.RefObject<HTMLAudioElement | null>;
  overlay: React.MutableRefObject<Overlay | null>;
  tier: Tier;
  live: boolean;
  still: boolean;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const world = useThree((s) => s.scene);
  const sk = useMemo(buildSkater, []);
  const sClock = useRef(0);
  const prevS = useRef(0);
  const cheer = useRef(0);
  const ball = useRef<THREE.Mesh>(null);
  const flash = useRef<THREE.PointLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const cone = useRef<THREE.Mesh>(null);
  const feet = useRef([new THREE.Vector3(), new THREE.Vector3()]);
  const moteAt = useRef(new THREE.Vector3());
  const moteLevel = useRef(0);
  const moteFlow = useRef(0);
  const goal = useMemo(() => new THREE.Vector3(GOAL_X - 0.15, 0.95, 0.55), []);
  const release = useRef(new THREE.Vector3());
  const arc = useRef(new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()));
  const v = useMemo(
    () => ({
      p: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      f: new THREE.Vector3(),
      rt: new THREE.Vector3(),
      look: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      chest: new THREE.Vector3(),
      hl: new THREE.Vector3(),
      hr: new THREE.Vector3(),
      gd: new THREE.Vector3(),
      side: new THREE.Vector3(),
      pr: new THREE.Vector3(),
      a: new THREE.Vector3(),
    }),
    [],
  );
  const ink = useMemo(() => new InkEffect(), []);
  const spot = useMemo(() => {
    const s = new THREE.SpotLight('#ffe7c4', 0, 18, 0.32, 0.55, 1.4);
    s.castShadow = tier > 0;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0004;
    return s;
  }, [tier]);
  const bars = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff6e6', toneMapped: false, side: THREE.DoubleSide }), []);
  const coneMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffe2b0',
        alphaMap: coneTexture(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const ballTex = useMemo(ballTexture, []);

  useFrame((_, raw) => {
    const dt = live ? Math.min(raw, 1 / 20) : 0;
    const a = audio.current;
    let r: number;
    if (still) r = STILL;
    else if (a && !a.paused && a.readyState >= 2) r = a.currentTime % DUR;
    else r = (clk.current.r + dt) % DUR;
    clk.current.r = r;
    const s = sceneAt(r);
    const speed = speedAt(r);
    let ds = s - prevS.current;
    if (ds < 0) {
      ds = 0;
      cheer.current = 0;
    }
    prevS.current = s;
    sClock.current = s;

    // ── him, on his line ──
    const u = clamp01(travel(s));
    const p = PATH.getPointAt(u, v.p);
    const dir = PATH.getTangentAt(u, v.dir);
    const ahead = PATH.getTangentAt(clamp01(u + 0.03));
    const turn = dir.x * ahead.z - dir.z * ahead.x;
    const yaw = Math.atan2(dir.x, dir.z);
    const lift = jumpAt(s, SCENE.shot);
    sk.root.position.set(p.x, lift, p.z);
    sk.root.rotation.set(0, yaw, THREE.MathUtils.clamp(-turn * 6, -0.2, 0.2));
    const fwd = v.f.set(dir.x, 0, dir.z).normalize();
    const right = v.rt.set(fwd.z, 0, -fwd.x);
    let gaze = Math.atan2(goal.x - p.x, goal.z - p.z) - yaw;
    gaze = Math.atan2(Math.sin(gaze), Math.cos(gaze));
    const mo = animate(sk, { s, r, gapT: SCENE.gap, shotT: SCENE.shot, hitT: SCENE.hit, title: R.title, drive: R.drive, gaze, speed });
    sk.root.updateMatrixWorld(true);
    sk.J.handL.getWorldPosition(v.hl);
    sk.J.handR.getWorldPosition(v.hr);
    sk.J.footL.getWorldPosition(feet.current[0]);
    sk.J.footR.getWorldPosition(feet.current[1]);
    sk.wheels.forEach((w) => (w.rotation.x += ds * 34));
    const chest = sk.J.chest.getWorldPosition(v.chest);

    // ── the ball ──
    const B = ball.current;
    if (B) {
      if (s < SCENE.shot) {
        // dribbled at his right hand: it leaves the palm, meets the floor, comes back up
        const f = (s / 0.475) % 1;
        const top = v.hr.y - 0.12;
        B.position.set(v.hr.x, 0.11 + Math.max(0, top - 0.11) * Math.pow(Math.abs(2 * f - 1), 0.7), v.hr.z).addScaledVector(fwd, 0.05);
        // in the hand for the opening, two hands for the gather, the right palm for the cock
        const inHand = v.a.copy(v.hr).addScaledVector(fwd, 0.04).setY(v.hr.y - 0.06);
        B.position.lerp(inHand, mo.ready);
        const both = v.a.copy(v.hl).add(v.hr).multiplyScalar(0.5).addScaledVector(fwd, 0.05);
        const palm = v.cam.copy(v.hr).add(new THREE.Vector3(0, 0.07, 0));
        if (mo.hold > 0) B.position.lerp(both.lerp(palm, mo.cock), mo.hold);
        release.current.copy(B.position);
        B.rotation.x += ds * 9;
      } else if (s < SCENE.hit) {
        const k = (s - SCENE.shot) / (SCENE.hit - SCENE.shot);
        const c = arc.current;
        c.v0.copy(release.current);
        c.v2.copy(goal);
        c.v1.copy(release.current).lerp(goal, 0.5).setY(Math.max(release.current.y, goal.y) + 0.5);
        c.getPoint(k, B.position);
        B.rotation.z -= ds * 22;
      } else {
        const k = s - SCENE.hit;
        B.position.set(goal.x + Math.min(0.5, k * 1.6), Math.max(0.11, goal.y - 4.9 * k * k + 0.6 * k), goal.z * (1 - Math.min(1, k)));
      }
    }

    // ── light: one backlight in the dark, the house lights bang on, dim again for the gap ──
    const dim = seg(r, R.gap, R.gap + 0.4) * (1 - seg(r, R.shot - 0.05, R.shot + 0.05));
    let house = r < R.drive ? 0.03 : 1 + (1 - seg(r, R.drive, R.drive + 0.3)) * 1.4;
    house *= 1 - 0.55 * dim;
    const lamp = r < R.drive ? seg(r, R.lightOn, R.lightOn + 0.05) * (0.9 + 0.1 * Math.sin(r * 47) * (1 - seg(r, R.lightOn, R.lightOn + 0.6))) : dim * 0.45;
    if (amb.current) amb.current.intensity = 0.55 * house;
    if (key.current) key.current.intensity = 2.4 * house;
    if (rim.current) rim.current.intensity = 1.3 * house + 1.4 * lamp;
    (world as unknown as { environmentIntensity: number }).environmentIntensity = 0.1 + 0.9 * Math.min(1, house);
    bars.color.setScalar(Math.min(2.4, house));
    spot.position.copy(p).addScaledVector(fwd, -1.6).setY(7.6);
    spot.target.position.copy(p);
    spot.target.updateMatrixWorld();
    spot.intensity = 230 * lamp;
    if (cone.current) {
      cone.current.position.copy(p).addScaledVector(fwd, -0.8).setY(3.8);
      cone.current.lookAt(spot.position);
      cone.current.rotateX(Math.PI / 2);
      coneMat.opacity = 0.42 * lamp;
      cone.current.visible = lamp > 0.01;
    }
    moteAt.current.copy(p);
    moteLevel.current = 0.9 * lamp;
    moteFlow.current += dt * (r < R.drive ? 0.22 : speed * 0.6);
    const since = s - SCENE.hit;
    if (flash.current) flash.current.intensity = since > 0 && since < 0.8 ? 35 * Math.pow(1 - since / 0.8, 2) : 0;
    cheer.current = THREE.MathUtils.damp(cheer.current, since > 0 && since < 2.6 ? 1 : 0, 4, dt);

    // ── the camera: seven shots, hard cuts ──
    const cam = v.cam;
    const look = v.look;
    let fov = 38;
    let roll = 0;
    let yawOff = 0;
    if (r < R.drive) {
      // low and in front, a slow push in on a still figure in the beam
      const k = outCubic(seg(r, 0, R.drive));
      const ang = -0.55 + k * 0.4;
      const D = 5.2 - 2.6 * k;
      cam.set(fwd.x * Math.cos(ang) + fwd.z * Math.sin(ang), 0, -fwd.x * Math.sin(ang) + fwd.z * Math.cos(ang)).multiplyScalar(D).add(p);
      cam.y = 0.35 + 0.25 * k;
      look.copy(p).setY(1.25);
      fov = 30;
    } else if (r < R.whip) {
      // on the floor beside the skates, rolled, bouncing with the wheels
      cam.copy(p).addScaledVector(right, -1.95).addScaledVector(fwd, 0.2);
      cam.y = 0.26 + Math.sin(r * 19) * 0.012;
      look.copy(p).addScaledVector(fwd, 1.0).addScaledVector(right, -0.2).setY(0.75);
      fov = 54;
      roll = -0.11;
      yawOff = -inExpo(seg(r, R.whip - 0.1, R.whip)) * 0.9;
    } else if (r < R.gap) {
      // a crane coming down over the play
      const k = inOut(seg(r, R.whip, R.gap));
      cam.copy(p).addScaledVector(fwd, 3.4).addScaledVector(right, -2.6);
      cam.y = 5.8 - 2.7 * k;
      look.copy(p).addScaledVector(fwd, 0.8).setY(0.8);
      fov = 40;
      yawOff = (1 - outExpo(seg(r, R.whip, R.whip + 0.14))) * 0.9;
    } else if (r < R.shot) {
      // bullet time: 210° around him while everything waits
      const k = inOut(seg(r, R.gap, R.shot));
      const base = Math.atan2(fwd.x, fwd.z);
      const ang = base - 0.9 + k * (Math.PI + 0.55);
      const rad = 3.0 - 0.6 * k;
      cam.set(p.x + Math.sin(ang) * rad, 1.45 - 0.2 * k + lift * 0.8, p.z + Math.cos(ang) * rad);
      look.copy(chest).lerp(ball.current?.position ?? chest, 0.35);
      fov = 34;
    } else if (r < R.hit) {
      // the strike: off his shoulder, a crash zoom, then chasing the ball
      const k = seg(r, R.shot, R.hit);
      const gd = v.gd.copy(goal).sub(release.current).setY(0).normalize();
      const side = v.side.set(gd.z, 0, -gd.x);
      cam.copy(release.current).addScaledVector(gd, -2.8 + 2.6 * k).addScaledVector(side, -1.1);
      cam.y = release.current.y + 0.1;
      look.copy(ball.current?.position ?? goal).lerp(goal, 0.35);
      fov = 64 - 36 * outExpo(seg(r, R.shot, R.shot + 0.16));
      roll = 0.05;
    } else if (r < R.outro) {
      // the reverse angle from behind the net: punch in on impact, then find him
      const k = seg(r, R.hit, R.outro);
      cam.set(GOAL_X + 2.6 - 0.4 * k, 1.35 + 0.3 * k, 3.1 + 0.6 * k);
      look.copy(goal).lerp(chest, ease(seg(r, R.hit + 0.35, R.hit + 1.6)));
      fov = 50 - 16 * outExpo(seg(r, R.hit, R.hit + 0.1)) + 12 * ease(seg(r, R.hit + 0.3, R.outro));
      const shake = 0.13 * (1 - seg(r, R.hit, R.hit + 0.6));
      cam.x += (rnd(Math.floor(r * 60)) - 0.5) * shake;
      cam.y += (rnd(Math.floor(r * 60) + 3) - 0.5) * shake;
      roll = (rnd(Math.floor(r * 60) + 8) - 0.5) * shake * 0.6;
    } else {
      // up and away on a crane, him small under the roof
      const k = inOut(seg(r, R.outro, DUR));
      cam.set(p.x + 2.6 + 1.6 * k, 1.3 + 4.4 * k, p.z + 4.2 + 2.6 * k);
      look.copy(p).setY(1.2 - 0.3 * k);
      fov = 34;
    }
    camera.position.copy(cam);
    camera.lookAt(look);
    if (roll) camera.rotateZ(roll);
    if (yawOff) camera.rotateY(yawOff);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // ── the grade ──
    const bt = seg(r, R.gap, R.gap + 0.35) * (1 - seg(r, R.shot - 0.06, R.shot));
    ink.set('sat', 1.12 - 0.85 * bt + 0.25 * bump(r, R.hit, R.hit + 1.2));
    let imp = 0;
    if (r >= R.shot && r < R.shot + 0.05) imp = 1;
    else if (r >= R.hit && r < R.hit + 0.045) imp = 2;
    else if (r >= R.hit + 0.045 && r < R.hit + 0.09) imp = 1;
    else if (r >= R.hit + 0.09 && r < R.hit + 0.125) imp = 2;
    ink.set('impact', imp);
    ink.set('near', camera.near);
    ink.set('far', camera.far);

    // ── the 2D layer ──
    const focusAt = r >= R.hit ? goal : r >= R.shot ? (ball.current?.position ?? goal) : chest;
    v.pr.copy(focusAt).project(camera);
    overlay.current?.draw(r, { x: (v.pr.x + 1) / 2, y: (1 - v.pr.y) / 2 });
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0} />
      <directionalLight
        ref={key}
        position={[3, 10, 4]}
        intensity={0}
        color="#fff2df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={rim} position={[-6, 4, -6]} intensity={0} color="#8fb0ff" />
      <primitive object={spot} />
      <primitive object={spot.target} />
      <mesh ref={cone} material={coneMat}>
        <coneGeometry args={[2.1, 7.6, 48, 1, true]} />
      </mesh>
      <Roof bars={bars} />
      <primitive object={sk.root} />
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[0.11, 32, 16]} />
        <meshToonMaterial map={ballTex} />
      </mesh>
      <Trail arc={arc} clock={sClock} from={SCENE.shot} to={SCENE.hit} />
      <pointLight ref={flash} position={[GOAL_X - 0.6, 1.2, 0.4]} color="#ffdca0" distance={14} decay={1.6} intensity={0} />
      <Burst at={goal} t0={SCENE.hit} clock={sClock} color="#ffd27a" count={150} />
      <Burst at={goal} t0={SCENE.hit + 0.04} clock={sClock} color="#c6f24a" count={70} />
      <Burst at={goal} t0={SCENE.hit + 0.08} clock={sClock} color="#e2452a" count={50} />
      <Ring at={goal} t0={SCENE.hit} clock={sClock} />
      <WheelSparks feet={feet} clock={sClock} until={SCENE.shot - 0.15} />
      <Motes at={moteAt} level={moteLevel} flow={moteFlow} />
      <Confetti clock={sClock} t0={SCENE.hit + 0.05} />
      <Crowd cheer={cheer} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.1} luminanceThreshold={0.7} luminanceSmoothing={0.2} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <primitive object={ink} />
        <Vignette offset={0.18} darkness={0.75} />
      </EffectComposer>
    </>
  );
}

export function ArenaFilm() {
  const wrap = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const type = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const overlay = useRef<Overlay | null>(null);
  const clk = useRef<Clk>({ r: 0 });
  const [inView, setInView] = useState(false);
  const [sound, setSound] = useState(false);
  const [tier, lower] = useTier();
  const motion = useMotion();
  const [reduced, setReduced] = useState(false);
  const still = reduced || !motion;
  // the film waits until its shaders are compiled, so it starts without a freeze
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => {
    if (still && audio.current && !audio.current.paused) {
      audio.current.pause();
      setSound(false);
    }
  }, [still]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const c = fx.current;
    const t = type.current;
    if (!c || !t) return;
    const o = new Overlay(c, t);
    overlay.current = o;
    o.resize();
    const ro = new ResizeObserver(() => o.resize());
    ro.observe(c);
    return () => {
      ro.disconnect();
      t.innerHTML = '';
      overlay.current = null;
    };
  }, []);
  useEffect(() => {
    if (!inView && audio.current && !audio.current.paused) {
      audio.current.pause();
      setSound(false);
    }
  }, [inView]);

  // sound restarts the film from the top, so picture and score start together
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      a.currentTime = 0;
      clk.current.r = 0;
      a.play().then(() => setSound(true)).catch(() => setSound(false));
    } else {
      a.pause();
      setSound(false);
    }
  };

  return (
    <div ref={wrap} className="ac">
      {/* the picture is the image; the sound button sits outside it so screen readers can reach it */}
      <div className="ac-frame" role="img" aria-label="An animated short: a roll ball player on quad skates drives down the court, waits for the gap in slow motion, and scores with a jump shot.">
      <Canvas
        shadows={tier > 0}
        dpr={DPR[tier]}
        // motion paused: one still frame, drawn on demand (switching to 'demand' draws it once)
        frameloop={inView && warm ? (still ? 'demand' : 'always') : 'never'}
        camera={{ position: [-6, 0.6, 2], fov: 30, near: 0.1, far: 120 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => (gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production')}
      >
        {!warm && <Warm onDone={onWarm} />}
        <color attach="background" args={['#06070d']} />
        <fog attach="fog" args={['#06070d', 13, 34]} />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={1.4} color="#fff4e2" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#c6f24a" position={[0, 1, -8]} scale={[20, 0.6, 1]} />
          <Lightformer form="rect" intensity={0.9} color="#7f9bff" position={[-8, 2, 6]} scale={[6, 3, 1]} />
        </Environment>
        <Adapt onDecline={lower} />
        <Floor hq={tier > 0} />
        <Goal x={GOAL_X} facing={1} />
        <Goal x={-GOAL_X} facing={-1} />
        <Director clk={clk} audio={audio} overlay={overlay} tier={tier} live={inView} still={still} />
      </Canvas>
      <canvas ref={fx} className="ac-fx" aria-hidden="true" />
      <div ref={type} className="ac-typeLayer" aria-hidden="true" />
      </div>
      {!still && (
      <button type="button" className={`ac-sound ${sound ? 'is-on' : ''}`} onClick={toggle} aria-pressed={sound}>
        <span className="ac-sound__bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {sound ? 'Sound on' : 'Play with sound'}
      </button>
      )}
      <audio ref={audio} src={SCORE} preload="none" loop />
    </div>
  );
}

