import * as THREE from 'three';

// Compile the shaders for everything in the scene, including what's still hidden (the
// pieces that rise during the build), so none of them compiles mid-animation later.
export function compileAll(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (!o.visible) {
      hidden.push(o);
      o.visible = true;
    }
  });
  const r = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> };
  let p: Promise<unknown> | undefined;
  try {
    // the programs are created synchronously inside this call; only the readiness check waits
    p = r.compileAsync ? r.compileAsync(scene, camera) : (gl.compile(scene, camera), undefined);
  } finally {
    hidden.forEach((o) => (o.visible = false));
  }
  return p;
}
