'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, SoftShadows } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, Vignette, ToneMapping, DepthOfField, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Avatar, type Gesture, type Move, type Outfit } from './Avatar';
import './lab.css';

type View = 'full' | 'face';

function Stage({ view, move, outfit, cue }: { view: View; move: Move; outfit: Outfit; cue?: { name: Gesture; key: number } }) {
  const face = view === 'face';
  return (
    <Canvas
      key={view}
      shadows
      dpr={[1, 2]}
      camera={{ position: face ? [0.15, 1.68, 1.15] : [0.6, 1.15, 4.0], fov: face ? 26 : 30 }}
      gl={{ antialias: false }}
    >
      <color attach="background" args={['#efe4d2']} />
      <fog attach="fog" args={['#efe4d2', 6, 14]} />

      {/* studio lighting: warm key, cool rim, soft fill, plus soft-box reflections */}
      <SoftShadows size={18} samples={12} focus={0.6} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.1} color="#ffe4c4" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.02} />
      <directionalLight position={[-3, 2.5, -2.5]} intensity={1.6} color="#bcd3ff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} color="#fff1dd" position={[2, 2.5, 3]} scale={[3, 2, 1]} target={[0, 1.3, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#c9dcff" position={[-3, 2, -1.5]} scale={[2, 3, 1]} target={[0, 1.3, 0]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 4, 0]} scale={2} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#e9d6b8" position={[0, -1, 2]} scale={[6, 1, 1]} />
      </Environment>

      {/* podium */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 0.95, 0.12, 64]} />
        <meshStandardMaterial color="#d9c6a6" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#e8dcc6" roughness={1} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={4} blur={2.2} far={2.2} />

      <Suspense fallback={null}>
        <Avatar move={move} outfit={outfit} cue={cue} />
      </Suspense>

      <OrbitControls
        target={face ? [0, 1.64, 0] : [0, 0.88, 0]}
        enablePan={false}
        minDistance={face ? 0.45 : 1.6}
        maxDistance={7}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={view === 'full'}
        autoRotateSpeed={0.5}
      />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.4} intensity={1.6} distanceFalloff={0.6} />
        <Bloom intensity={0.15} luminanceThreshold={0.9} mipmapBlur />
        {face ? <DepthOfField focusDistance={0.0} focalLength={0.02} bokehScale={3} target={[0, 1.6, 0]} /> : <></>}
        <Vignette offset={0.25} darkness={0.4} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}

export function CharacterLab() {
  const [view, setView] = useState<View>('full');
  const [move, setMove] = useState<Move>('idle');
  const [outfit, setOutfit] = useState<Outfit>('guide');
  const [cue, setCue] = useState<{ name: Gesture; key: number }>();

  return (
    <div className="lab">
      <header className="lab-head">
        <p className="lab-kicker">Character lab · not part of the live site</p>
        <h1>The guide</h1>
        <p className="lab-lede">
          Me, as a game character: my own avatar, built from my selfies. Once he’s approved, he gets an outfit for every place and the movement to go with it.
        </p>
      </header>

      <div className="lab-stage">
        <Stage view={view} move={move} outfit={outfit} cue={cue} />
      </div>

      <div className="lab-controls">
        <div>
          <p className="lab-label">View</p>
          <div className="lab-row">
            <button className={view === 'full' ? 'is-on' : ''} onClick={() => setView('full')}>
              Full body, turntable
            </button>
            <button className={view === 'face' ? 'is-on' : ''} onClick={() => setView('face')}>
              Face close-up
            </button>
          </div>
        </div>
        <div>
          <p className="lab-label">Outfit · one per place</p>
          <div className="lab-row">
            {(
              [
                ['guide', 'Guide'],
                ['workshop', 'Workshop'],
                ['studio', 'Studio'],
                ['commons', 'Chaupal'],
                ['arena', 'Arena · match kit'],
                ['press', 'Press'],
                ['notebook', 'Notebook'],
                ['work', 'Work'],
              ] as [Outfit, string][]
            ).map(([o, label]) => (
              <button key={o} className={outfit === o ? 'is-on' : ''} onClick={() => setOutfit(o)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="lab-label">Movement · motion captured</p>
          <div className="lab-row">
            {(
              [
                ['idle', 'Idle'],
                ['walk', 'Walk'],
                ['run', 'Run'],
              ] as [Move, string][]
            ).map(([m, label]) => (
              <button key={m} className={move === m ? 'is-on' : ''} onClick={() => setMove(m)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="lab-label">Habits · he does these on his own, or play one now</p>
          <div className="lab-row">
            {(
              [
                ['wave', 'Wave'],
                ['glasses', 'Push glasses up'],
                ['chin', 'Thinking'],
                ['nod', 'Nod'],
                ['present', 'Present'],
              ] as [Gesture, string][]
            ).map(([g, label]) => (
              <button key={g} onClick={() => setCue({ name: g, key: performance.now() })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="lab-note">Drag to turn him around · scroll to zoom.</p>
      </div>
    </div>
  );
}
