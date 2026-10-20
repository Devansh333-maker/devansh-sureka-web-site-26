'use client';

import { preload } from 'react-dom';

// Start the heavy 3D downloads (my avatar, the motion clips, the Draco decoder) the
// moment a page with a 3D scene renders, in parallel with the page's code, instead of
// waiting for three.js to boot and ask for them one after another.
export function preload3D() {
  // the avatar itself is hinted by <AvatarPreload /> (AvatarPreload.tsx): it needs a screen-size
  // media query (phones fetch the half-size copy), which react-dom's preload() can't express
  preload('/models/anim/mixamo-clips.glb', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/draco/draco_wasm_wrapper.js', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/draco/draco_decoder.wasm', { as: 'fetch', crossOrigin: 'anonymous' });
}

