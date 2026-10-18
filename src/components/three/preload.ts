'use client';

import { preload } from 'react-dom';

// Start the heavy 3D downloads (my avatar, the motion clips, the Draco decoder) the
// moment a page with a 3D scene renders, in parallel with the page's code, instead of
// waiting for three.js to boot and ask for them one after another.
export function preload3D() {
  preload('/models/avatar/devansh-guide.glb', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/models/anim/mixamo-clips.glb', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/draco/draco_wasm_wrapper.js', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/draco/draco_decoder.wasm', { as: 'fetch', crossOrigin: 'anonymous' });
}
