'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { compileAll } from './compile';

// Before a scene's first frame, compile all its shaders in the background (in parallel
// where the browser can), so the page doesn't freeze while the scene gets ready. Calls
// onDone when they're ready, or after a short wait at most.
export function Warm({ onDone }: { onDone: () => void }) {
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
