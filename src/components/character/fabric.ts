import * as THREE from 'three';
import type { Outfit } from './gear';

// Re-dressing the avatar. The Avaturn outfit texture is a clean atlas (white shirt
// panels, blue denim panels), so each outfit is the same atlas repainted with a new
// fabric: a match kit, a hoodie and joggers, a work shirt. The repainting is baked
// ahead of time by scripts/bake-looks.py (it used to run in the browser and stall the
// page); here we just load the result.

// how strongly each outfit keeps the original cloth's normal-map texture
const NORMAL: Partial<Record<Outfit, number>> = { arena: 0.25, notebook: 0.3, work: 0.5 };
const BAKED: Outfit[] = ['arena', 'notebook', 'work', 'workshop'];

const loader = new THREE.TextureLoader();
const cache = new Map<Outfit, THREE.Texture>();

// the baked texture for this outfit (loads in the background), or null to keep the original
export function lookTexture(src: THREE.Texture, outfit: Outfit): THREE.Texture | null {
  if (!BAKED.includes(outfit) || typeof document === 'undefined') return null;
  let t = cache.get(outfit);
  if (!t) {
    t = loader.load(`/models/avatar/looks/${outfit}.webp`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false; // glTF convention, same as the original
    t.wrapS = src.wrapS;
    t.wrapT = src.wrapT;
    t.anisotropy = src.anisotropy;
    t.channel = src.channel;
    cache.set(outfit, t);
  }
  return t;
}

export const lookNormal = (outfit: Outfit) => NORMAL[outfit] ?? 1;

// Shoes: the export's navy canvas trainers vanish against dark trousers once I'm small on
// the island, so each place gets a pair that reads: white trainers, tan work boots or
// brown leather (baked from the same atlas by recolouring its light and shade)
const SHOES: Record<Outfit, 'white' | 'tan' | 'brown'> = {
  guide: 'white',
  studio: 'white',
  notebook: 'white',
  arena: 'white',
  workshop: 'tan',
  commons: 'brown',
  press: 'brown',
  work: 'brown',
};
const shoeCache = new Map<string, THREE.Texture>();

export function shoeTexture(src: THREE.Texture, outfit: Outfit): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const name = SHOES[outfit];
  let t = shoeCache.get(name);
  if (!t) {
    t = loader.load(`/models/avatar/looks/shoes-${name}.webp`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    t.wrapS = src.wrapS;
    t.wrapT = src.wrapT;
    t.anisotropy = src.anisotropy;
    t.channel = src.channel;
    shoeCache.set(name, t);
  }
  return t;
}
