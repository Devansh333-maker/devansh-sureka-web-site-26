import * as THREE from 'three';

// The roll ball kit, made from the everyday outfit without new clothing geometry:
// the trousers are cut just above the knee into shorts and the sleeves end on the
// upper arm. The cut follows real body positions (height, distance from the spine),
// baked into a mask by scripts/bake-looks.py; here it's simply loaded and used as the
// clothes' alpha map. Avaturn shrinks the body under clothes, so the bare limbs that
// show are rebuilt as shaped segments riding the bones (matchLimbs in gear.ts).

let alpha: THREE.Texture | null = null;

// the clothes' cut-out: white keeps, black hides
export function kitAlpha() {
  if (!alpha) {
    alpha = new THREE.TextureLoader().load('/models/avatar/looks/kit-alpha.png');
    alpha.flipY = false;
    alpha.colorSpace = THREE.NoColorSpace;
  }
  return alpha;
}
