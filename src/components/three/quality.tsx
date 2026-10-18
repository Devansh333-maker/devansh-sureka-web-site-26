'use client';

import { useEffect, useState } from 'react';
import { PerformanceMonitor } from '@react-three/drei';

// One quality dial for every 3D scene on the site.
//   2: everything (soft shadows, ambient occlusion, depth of field, reflections)
//   1: integrated laptop GPUs and phones: crisp shadows, bloom, no AO/DOF, lower pixel ratio
//   0: struggling devices: no post-processing, no real-time shadows
// The starting tier comes from the GPU name; a performance monitor inside each canvas
// steps it down if the frame rate still sags.

export type Tier = 0 | 1 | 2;

let detected: Tier | null = null;

export function gpuTier(): Tier {
  if (detected !== null) return detected;
  let tier: Tier = 2;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return (detected = 0);
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
    const mobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
    if (/swiftshader|llvmpipe|software|basic render/.test(name)) tier = 0;
    else if (mobile || /intel|uhd|hd graphics|mali|adreno|powervr|videocore/.test(name)) tier = 1;
    // the strong integrated chips
    if (/iris\(r\) xe|arc|apple m\d|apple gpu/.test(name) && !mobile) tier = 2;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    tier = 1;
  }
  return (detected = tier);
}

// the tier for one canvas: starts from the GPU guess, can only go down from there
export function useTier() {
  const [tier, setTier] = useState<Tier>(1);
  useEffect(() => {
    let forced: Tier | null = null;
    try {
      const q = new URLSearchParams(window.location.search).get('quality');
      if (q === '0' || q === '1' || q === '2') forced = Number(q) as Tier;
    } catch {}
    setTier(forced ?? gpuTier());
  }, []);
  const lower = () => setTier((t) => (t > 0 ? ((t - 1) as Tier) : t));
  return [tier, lower] as const;
}

export const DPR: Record<Tier, [number, number]> = { 0: [0.8, 1], 1: [1, 1.25], 2: [1, 1.5] };

// put inside a <Canvas>: steps quality down when frames drop for a few seconds
export function Adapt({ onDecline }: { onDecline: () => void }) {
  return <PerformanceMonitor bounds={(refresh) => [Math.min(45, refresh * 0.75), refresh * 0.95]} flipflops={2} onDecline={onDecline} />;
}
