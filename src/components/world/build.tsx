'use client';

import { createContext, useContext, useRef, type ReactNode, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

// Shared clock for the build-up. `start` is set when the slash lands;
// `speed` lets a returning visitor see the whole build in about a second.
export type BuildClock = { start: number | null; speed: number };
const BuildContext = createContext<MutableRefObject<BuildClock> | null>(null);

export function BuildProvider({ clock, children }: { clock: MutableRefObject<BuildClock>; children: ReactNode }) {
  return <BuildContext.Provider value={clock}>{children}</BuildContext.Provider>;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOutBack = (t: number) => {
  const c1 = 0.55; // a settle, not a bounce
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type RiseMode = 'rise' | 'drop' | 'pop' | 'grow';

type RiseProps = {
  delay: number;
  duration?: number;
  mode?: RiseMode;
  distance?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: ReactNode;
};

// Wraps any piece of the world and animates it into place on the build clock.
// rise: pushes up out of the ground · drop: falls in from above · pop: scales up · grow: stretches up from its base
export function Rise({ delay, duration = 0.7, mode = 'rise', distance = 3, position = [0, 0, 0], rotation, children }: RiseProps) {
  const clock = useContext(BuildContext);
  const ref = useRef<Group>(null);
  const done = useRef(false);

  useFrame(() => {
    const g = ref.current;
    if (!g || !clock || done.current) return;
    const { start, speed } = clock.current;
    const raw = start === null ? 0 : clamp(((performance.now() / 1000 - start) * speed - delay) / duration);
    const [x, y, z] = position;

    g.visible = raw > 0;
    if (mode === 'rise') {
      const e = easeOutCubic(raw);
      g.position.set(x, y - distance * (1 - e), z);
      g.scale.setScalar(1);
    } else if (mode === 'drop') {
      const e = easeOutBack(raw);
      g.position.set(x, y + distance * (1 - e), z);
    } else if (mode === 'pop') {
      g.position.set(x, y, z);
      g.scale.setScalar(Math.max(0.0001, easeOutBack(raw)));
    } else {
      g.position.set(x, y, z);
      g.scale.set(1, Math.max(0.0001, easeOutBack(raw)), 1);
    }
    if (raw >= 1) done.current = true;
  });

  return (
    <group ref={ref} position={position} rotation={rotation} visible={false}>
      {children}
    </group>
  );
}
