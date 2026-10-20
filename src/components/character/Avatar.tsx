'use client';

import * as THREE from 'three';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { buildGear, type GearPiece, type Outfit, type Points } from './gear';
import { Rig, type Side } from './ik';
import { Life, type Gesture, type Grip, type LifeOpts } from './life';
import { lookNormal, lookTexture, shoeTexture } from './fabric';
import { kitAlpha } from './kit';

export type { Outfit } from './gear';
export type { Gesture, LifeOpts } from './life';

// Me, as a game character: my own Avaturn avatar, built from my selfies.
// The skeleton uses Mixamo naming (Hips, Spine, LeftArm…), so motion-captured
// clips are retargeted onto it from a Mixamo-rigged source. Build (athletic),
// hair, glasses and outfit are chosen in Avaturn and baked into the export.

export const AVATARS = {
  guide: '/models/avatar/devansh-guide.glb',
} as const;
export type AvatarId = keyof typeof AVATARS;

// Phones get a copy with every texture at half size (1.7 MB → 0.5 MB): same model, same
// motion, and at phone size the difference doesn't show
const small = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)').matches;
const fileFor = (id: AvatarId) => (small() ? AVATARS[id].replace('.glb', '-lite.glb') : AVATARS[id]);

const CLIPS_URL = '/models/anim/mixamo-clips.glb';
const CLIP_CACHE = new Map<Move, THREE.AnimationClip>();
// models are Draco-compressed (4.3 MB → 1.7 MB); the decoder is served from our own /draco
const DRACO = '/draco/';

// friendly names for the clips in the source file
export const MOVES = {
  idle: 'idle',
  walk: 'walk',
  run: 'run',
  nod: 'agree',
  shake: 'headShake',
  think: 'sad_pose',
} as const;
export type Move = keyof typeof MOVES;

function findSkinned(root: THREE.Object3D) {
  let found: THREE.SkinnedMesh | null = null;
  root.traverse((o) => {
    const s = o as THREE.SkinnedMesh;
    if (!found && s.isSkinnedMesh) found = s;
  });
  return found as THREE.SkinnedMesh | null;
}

// free a piece of gear's geometry, materials and any textures on them
function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((mat) => {
      Object.values(mat).forEach((v) => v instanceof THREE.Texture && v.dispose());
      mat.dispose();
    });
  });
}

export type AvatarApi = { root: THREE.Object3D; bone: (name: string) => THREE.Bone | undefined; mixer: THREE.AnimationMixer; rig: Rig };
export type RigFn = (rig: Rig, t: number, dt: number) => void;

const DEFAULT_LIFE: LifeOpts = {};

export function Avatar({
  avatar = 'guide',
  move = 'idle',
  outfit = 'guide',
  fade = 0.4,
  timeScale = 1,
  onReady,
  onRig,
  life: lifeOpts = DEFAULT_LIFE,
  grips,
  cue,
  ...props
}: {
  avatar?: AvatarId;
  move?: Move;
  outfit?: Outfit;
  fade?: number;
  timeScale?: number;
  onReady?: (api: AvatarApi) => void;
  // runs every frame after the clip, for scene-driven motion (skating, dribbling, waving)
  onRig?: RigFn;
  // the living layer: stance, breath, gaze, habits (on by default)
  life?: LifeOpts;
  // force how a hand closes (e.g. an open palm for dribbling)
  grips?: Partial<Record<Side, Grip>>;
  // play a habit now, e.g. { name: 'nod', key: Date.now() }
  cue?: { name: Gesture; key: number };
} & Omit<ThreeElements['group'], 'ref'>) {
  const { scene } = useGLTF(fileFor(avatar), DRACO);
  const source = useGLTF(CLIPS_URL, DRACO);
  const gl = useThree((s) => s.gl);

  // our own copy of the avatar, with crisp textures and shadows
  const model = useMemo(() => {
    const m = SkeletonUtils.clone(scene) as THREE.Group;
    const aniso = gl.capabilities.getMaxAnisotropy();
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const c = (mesh.material as THREE.MeshStandardMaterial).clone();
      for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'] as const) {
        const tex = c[key];
        if (tex) {
          tex.anisotropy = aniso;
          tex.needsUpdate = true;
        }
      }
      c.envMapIntensity = 1.15;
      // hair cards: clean edges, no sorting flicker
      if (/hair/i.test(c.name)) {
        c.alphaTest = 0.35;
        c.transparent = false;
        c.side = THREE.DoubleSide;
      }
      // clothes and skin are fabric, not metal (the export marks them fully metallic)
      if (/look|body|shoes/i.test(c.name)) c.metalness = 0;
      // glasses lenses stay see-through
      if (/glasses_1/i.test(c.name)) c.depthWrite = false;
      mesh.material = c;
    });
    // hidden until the first clip is applied, so nobody sees the T-pose
    m.visible = false;
    return m;
  }, [scene, gl]);

  // motion clips, retargeted onto my skeleton on first use and shared by every copy of
  // me on the site (retargeting samples every frame of every bone, so it's worth caching)
  const clipFor = useCallback(
    (m: Move) => {
      const hit = CLIP_CACHE.get(m);
      if (hit) return hit;
      const target = findSkinned(model);
      const src = findSkinned(source.scene);
      const clip = source.animations.find((a) => a.name === MOVES[m]);
      if (!target || !src || !clip) return null;
      const names: Record<string, string> = {};
      target.skeleton.bones.forEach((bn) => (names[bn.name] = `mixamorig${bn.name}`));
      const saved = target.skeleton.bones.map((bn) => [bn.position.clone(), bn.quaternion.clone()] as const);
      const r = SkeletonUtils.retargetClip(target, src, clip, { names, hip: 'mixamorigHips', useFirstFramePosition: true, fps: 30 }) as THREE.AnimationClip;
      r.name = m;
      // keep rotations only: the source character is scaled differently, so its hip
      // height would sink me into the floor. Travel is driven by the scene instead.
      r.tracks = r.tracks.filter((t) => !t.name.endsWith('.position'));
      // retargeting moves my bones while it samples; put them back
      target.skeleton.bones.forEach((bn, i) => {
        bn.position.copy(saved[i][0]);
        bn.quaternion.copy(saved[i][1]);
      });
      CLIP_CACHE.set(m, r);
      return r;
    },
    [model, source],
  );

  const mixer = useMemo(() => new THREE.AnimationMixer(findSkinned(model) ?? model), [model]);
  const rig = useMemo(() => {
    const s = findSkinned(model);
    return s ? new Rig(model, s.skeleton) : null;
  }, [model]);
  const gearRef = useRef<GearPiece[]>([]);
  const camera = useThree((s) => s.camera);

  // the glasses bridge at bind pose: gestures reach for it, so it has to be exact
  const life = useMemo(() => {
    if (!rig) return null;
    const s = findSkinned(model);
    const saved = s?.skeleton.bones.map((b) => [b.position.clone(), b.quaternion.clone()] as const);
    s?.skeleton.pose();
    model.updateWorldMatrix(true, true);
    const bridge = rig.restPos('Head').clone().add(new THREE.Vector3(0, 0.09, 0.1));
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !/glasses_0/.test(m.name)) return;
      m.geometry.computeBoundingBox();
      const box = m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);
      const c = box.getCenter(new THREE.Vector3());
      bridge.copy(model.worldToLocal(new THREE.Vector3(c.x, c.y, box.max.z)));
    });
    s?.skeleton.bones.forEach((b, i) => {
      b.position.copy(saved![i][0]);
      b.quaternion.copy(saved![i][1]);
    });
    model.updateWorldMatrix(true, true);
    return new Life(rig, bridge, Math.floor(Math.random() * 1000) + 1);
  }, [rig, model]);

  // outfit: re-dress the clothes, then pin this outfit's gear to the bones at rest pose
  useEffect(() => {
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const m = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (!mesh.isMesh || !m) return;
      const kit = outfit === 'arena';
      if (/shoes/i.test(m.name)) {
        if (!m.userData.baseMap) m.userData.baseMap = m.map;
        const base = m.userData.baseMap as THREE.Texture | null;
        m.map = (base && shoeTexture(base, outfit)) || base;
        m.needsUpdate = true;
        return;
      }
      if (!/look/i.test(m.name)) return;
      if (!m.userData.baseMap) m.userData.baseMap = m.map;
      const base = m.userData.baseMap as THREE.Texture | null;
      m.map = (base && lookTexture(base, outfit)) || base;
      m.normalScale.setScalar(lookNormal(outfit));
      // the match kit: trousers cut to shorts, sleeves cut short
      m.alphaMap = kit ? kitAlpha() : null;
      m.alphaTest = kit ? 0.5 : 0;
      m.side = kit ? THREE.DoubleSide : THREE.FrontSide; // the inside of a hem shows
      m.needsUpdate = true;
    });

    // skates add wheels under the shoes, so stand a little taller
    model.position.y = outfit === 'arena' ? 0.075 : 0;

    const skinned = findSkinned(model);
    if (!skinned) return;
    const saved = skinned.skeleton.bones.map((b) => [b.position.clone(), b.quaternion.clone()] as const);
    skinned.skeleton.pose();
    model.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
    const at = (n: string) => {
      const b = model.getObjectByName(n);
      return b ? b.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv) : new THREE.Vector3();
    };
    const points = {
      Head: at('Head'),
      Neck: at('Neck'),
      Spine2: at('Spine2'),
      Spine1: at('Spine1'),
      Hips: at('Hips'),
      LeftHand: at('LeftHand'),
      RightHand: at('RightHand'),
      LeftLeg: at('LeftLeg'),
      RightLeg: at('RightLeg'),
      LeftFoot: at('LeftFoot'),
      RightFoot: at('RightFoot'),
      LeftUpLeg: at('LeftUpLeg'),
      RightUpLeg: at('RightUpLeg'),
      LeftArm: at('LeftArm'),
      RightArm: at('RightArm'),
      LeftForeArm: at('LeftForeArm'),
      RightForeArm: at('RightForeArm'),
    } as Points;
    const gear = buildGear(outfit, points);
    for (const g of gear) {
      const bone = model.getObjectByName(g.anchor);
      if (!bone) continue;
      model.add(g.object); // placed in the model's space…
      g.object.updateMatrixWorld(true);
      bone.attach(g.object); // …then handed to the bone, keeping its place
    }
    gearRef.current = gear;
    // back to whatever pose the animation had
    skinned.skeleton.bones.forEach((b, i) => {
      b.position.copy(saved[i][0]);
      b.quaternion.copy(saved[i][1]);
    });
    return () => {
      // buildGear makes fresh geometry, materials and canvas textures every time, so free them all
      // (the shared kitAlpha / lookTexture maps sit on the body's own material, not on the gear)
      gear.forEach((g) => {
        g.object.removeFromParent();
        disposeTree(g.object);
      });
      gearRef.current = [];
    };
  }, [model, outfit]);

  useEffect(() => {
    if (rig) onReady?.({ root: model, bone: (n) => model.getObjectByName(n) as THREE.Bone | undefined, mixer, rig });
  }, [model, mixer, rig, onReady]);

  useEffect(() => {
    mixer.timeScale = timeScale;
  }, [mixer, timeScale]);
  const current = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const clip = clipFor(move);
    if (!clip) return;
    const next = mixer.clipAction(clip);
    const prev = current.current;
    if (!prev) {
      // the very first clip goes on at full weight: fading in from nothing would
      // blend with the bind pose and flash a T-pose
      next.reset().setEffectiveWeight(1).play();
      mixer.update(0);
      model.visible = true;
    } else if (prev !== next) {
      next.reset().setEffectiveWeight(1).play();
      next.crossFadeFrom(prev, fade, false);
    }
    current.current = next;
  }, [clipFor, move, mixer, fade, model]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
      current.current = null;
    },
    [mixer],
  );

  useEffect(() => {
    if (cue && life) life.trigger(cue.name, clock.current);
  }, [cue, life]);

  const clock = useRef(0);
  const focusAt = useMemo(() => new THREE.Vector3(), []);
  // The mixer only writes a bone when its animated value changes, so while paused (or
  // on a bone the clip holds still) last frame's procedural edits would stay and pile
  // up. Each frame: put back the clean clip pose, let the mixer move it, remember it.
  const clean = useMemo(() => {
    const s = findSkinned(model);
    const bones = s ? s.skeleton.bones : [];
    return { bones, q: bones.map(() => new THREE.Quaternion()), p: bones.map(() => new THREE.Vector3()), ready: false };
  }, [model]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 20);
    if (clean.ready)
      clean.bones.forEach((b, i) => {
        b.quaternion.copy(clean.q[i]);
        b.position.copy(clean.p[i]);
      });
    mixer.update(dt);
    clean.bones.forEach((b, i) => {
      clean.q[i].copy(b.quaternion);
      clean.p[i].copy(b.position);
    });
    clean.ready = model.visible;
    if (!rig || !life || !model.visible) return;
    const live = mixer.timeScale > 0;
    // habits and props keep real time even when frames are slow
    const step = live ? Math.min(raw, 0.25) : 0;
    clock.current += step;
    const t = clock.current;
    // the procedural layer, in order: body → props → habits → scene → gaze → fingers
    rig.resetHips();
    model.updateMatrixWorld(true);
    const gear = gearRef.current;
    const claimed = new Set<Side>();
    const handGrips: Partial<Record<Side, Grip>> = { ...grips };
    let focus: THREE.Vector3 | null = null;
    for (const g of gear) {
      if (g.hands) for (const s of Object.keys(g.hands) as Side[]) {
        claimed.add(s);
        handGrips[s] = handGrips[s] ?? g.hands[s];
      }
      if (g.focus) focus = g.focus.getWorldPosition(focusAt);
    }
    if (grips) (Object.keys(grips) as Side[]).forEach((s) => claimed.add(s));
    life.body(t, lifeOpts, claimed);
    for (const g of gear) g.update?.({ rig, L: 1 }, t);
    if (lifeOpts.gestures === undefined || lifeOpts.gestures.length) life.gestures(t, lifeOpts, claimed);
    onRig?.(rig, t, step * mixer.timeScale);
    life.head(t, Math.max(step, 1e-3), lifeOpts, camera, focus);
    life.fingers(Math.max(step, 1e-3), handGrips);
  });

  return (
    <group {...props}>
      <primitive object={model} />
    </group>
  );
}

if (typeof window !== 'undefined') useGLTF.preload(fileFor('guide'), DRACO);
useGLTF.preload(CLIPS_URL, DRACO);
