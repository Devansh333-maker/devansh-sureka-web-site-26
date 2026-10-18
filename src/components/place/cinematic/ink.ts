import * as THREE from 'three';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';

// Cel shading and ink, as a final pass over the rendered frame:
//  · light is snapped into a few soft bands (the cel look), hue kept
//  · ink lines where depth jumps (silhouettes, the court's edges) and where colour turns hard
//  · an "impact frame" mode: the whole frame collapses to two flat tones for a few frames,
//    paper and ink, or vermilion and ink — the sakuga hit
const FRAG = /* glsl */ `
uniform float impact;
uniform float sat;
uniform float inkAmt;
uniform float bandsAmt;
uniform vec2 texel;
uniform float near;
uniform float far;

float lin(float d) { return near * far / (far - d * (far - near)); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  float l = lum(c);

  // cel: light snapped to four soft bands, the colour kept
  float bands = 4.0;
  float f = fract(l * bands);
  float q = (floor(l * bands) + smoothstep(0.4, 0.6, f)) / bands;
  vec3 cel = c * (q / max(l, 1e-3));
  cel = mix(c, cel, bandsAmt);
  float g = lum(cel);
  cel = mix(vec3(g), cel, sat);

  // ink: where depth jumps, and where colour turns hard
  float z = lin(depth);
  float zl = lin(texture2D(depthBuffer, uv - vec2(texel.x, 0.0)).r);
  float zr = lin(texture2D(depthBuffer, uv + vec2(texel.x, 0.0)).r);
  float zu = lin(texture2D(depthBuffer, uv + vec2(0.0, texel.y)).r);
  float zd = lin(texture2D(depthBuffer, uv - vec2(0.0, texel.y)).r);
  float dz = (abs(zl + zr - 2.0 * z) + abs(zu + zd - 2.0 * z)) / max(z, 0.6);
  float ed = smoothstep(0.012, 0.05, dz);
  float cx = lum(texture2D(inputBuffer, uv - vec2(texel.x, 0.0)).rgb) - lum(texture2D(inputBuffer, uv + vec2(texel.x, 0.0)).rgb);
  float cy = lum(texture2D(inputBuffer, uv - vec2(0.0, texel.y)).rgb) - lum(texture2D(inputBuffer, uv + vec2(0.0, texel.y)).rgb);
  float ec = smoothstep(0.1, 0.28, length(vec2(cx, cy)));
  float edge = clamp(max(ed, ec * 0.65), 0.0, 1.0) * inkAmt;
  vec3 ink = vec3(0.05, 0.035, 0.03);
  vec3 col = mix(cel, ink, edge * 0.9);

  // the impact frame: two flat tones
  if (impact > 0.5) {
    vec3 hi = impact > 1.5 ? vec3(0.84, 0.17, 0.11) : vec3(0.97, 0.94, 0.88);
    vec3 lo = vec3(0.035, 0.028, 0.025);
    col = mix(lo, hi, step(0.16, l));
    col = mix(col, lo, clamp(edge * 1.6, 0.0, 1.0));
  }
  outputColor = vec4(col, inputColor.a);
}
`;

export class InkEffect extends Effect {
  constructor() {
    super('InkEffect', FRAG, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['impact', new THREE.Uniform(0)],
        ['sat', new THREE.Uniform(1)],
        ['inkAmt', new THREE.Uniform(1)],
        ['bandsAmt', new THREE.Uniform(0.85)],
        ['texel', new THREE.Uniform(new THREE.Vector2(1 / 1280, 1 / 720))],
        ['near', new THREE.Uniform(0.1)],
        ['far', new THREE.Uniform(120)],
      ]),
    });
  }
  setSize(width: number, height: number) {
    (this.uniforms.get('texel')!.value as THREE.Vector2).set(1 / width, 1 / height);
  }
  set(name: 'impact' | 'sat' | 'inkAmt' | 'bandsAmt' | 'near' | 'far', v: number) {
    this.uniforms.get(name)!.value = v;
  }
}
