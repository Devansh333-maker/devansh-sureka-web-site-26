'use client';

import { useEffect, useRef } from 'react';
import { motionOn, useMotion } from '@/components/motion/motion';
import './foot-scene.css';

// The end of every page: Pilani at dusk, from the hill. The painting itself breathes (the maple
// sways, the mist drifts, the lake shimmers) in a small WebGL pass driven by a colour matte;
// on top of it live birds leave from where they were painted, leaves fall from the maple, the
// town's lights twinkle, the clock faces glow and a red light blinks on the spire.

const W = 1916;
const H = 821;
const ART = '/opt/footer/dusk.webp';
const ART_SM = '/opt/footer/dusk-sm.webp';
const MATTE = '/opt/footer/dusk-matte.webp';

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};
// lit windows and street lamps, as % of the picture
const LIGHTS = [[94.23, 56.33], [83.9, 59.87], [35.05, 61.21], [41.41, 70.34], [97.86, 56.03], [30.66, 60.9], [47.13, 69.79], [29.51, 60.17], [75.52, 69.37], [41.34, 54.57], [10.28, 60.9], [76.02, 55.36], [60.36, 60.84], [87.92, 55.54], [94.65, 67.72], [43.71, 55.12], [42.35, 57.92], [60.33, 52.31], [85.36, 64.86], [33.09, 57.73], [57.02, 57.31], [77.06, 59.01], [59.0, 52.56], [56.86, 56.15], [43.58, 62.24], [78.0, 64.37], [72.57, 72.66], [49.37, 56.03], [37.84, 64.74], [95.43, 55.48], [81.55, 71.74], [78.58, 72.41]];
// where the painting had its birds; the live flock starts exactly there
const BIRDS = [[78.18, 24.85, 22], [81.55, 25.76, 21], [79.7, 26.74, 14], [74.37, 28.32, 22], [76.46, 29.42, 20], [72.73, 30.88, 17], [74.37, 33.19, 12]];
// a bird seen from below, wings up / level / down (the drawing morphs between them)
const WING_UP = 'M-13 -6 Q-7 -6 -2.5 -0.5 L0 0.8 L2.5 -0.5 Q7 -6 13 -6 Q7 -3 2.6 1.6 L0 3.2 L-2.6 1.6 Q-7 -3 -13 -6Z';
const WING_MID = 'M-13 0 Q-7 -2 -2.5 -0.5 L0 0.8 L2.5 -0.5 Q7 -2 13 0 Q7 0 2.6 1.6 L0 3.2 L-2.6 1.6 Q-7 0 -13 0Z';
const WING_DOWN = 'M-12 5 Q-7 1.5 -2.5 -0.5 L0 0.8 L2.5 -0.5 Q7 1.5 12 5 Q7 3 2.6 1.6 L0 3.2 L-2.6 1.6 Q-7 3 -12 5Z';
const LEAF = 'M0 -7 L1.4 -2.6 L5.6 -4.6 L4.2 -0.6 L8 0.4 L4 2.6 L5.4 6.4 L0.9 4.6 L0 8 L-0.9 4.6 L-5.4 6.4 L-4 2.6 L-8 0.4 L-4.2 -0.6 L-5.6 -4.6 L-1.4 -2.6 Z';
const LEAVES = Array.from({ length: 14 }, (_, i) => ({
  x: 2 + rnd(i) * 22,
  y: 4 + rnd(i + 20) * 22,
  s: 9 + rnd(i + 40) * 9,
  dur: 11 + rnd(i + 60) * 9,
  delay: -rnd(i + 80) * 20,
  sway: 1.6 + rnd(i + 100) * 1.6,
  fill: ['#c84a26', '#d9622f', '#b5361e', '#e0763a'][i % 4],
}));

const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D art, matte; uniform float t;
void main(){
  vec3 m = texture(matte, uv).rgb;
  vec2 off = vec2(0.);
  // the maple: the canopy sways from the trunk, leaves flutter on top of it
  float reach = smoothstep(0.0, 0.3, length(uv - vec2(0.02, 0.42)));
  float gust = 0.6 + 0.4*sin(t*0.37) * sin(t*0.23 + 1.3);
  off += m.r * reach * gust * vec2(0.0032*sin(t*1.25 + uv.y*6.0) + 0.0011*sin(t*4.1 + uv.x*60.0),
                                   0.0022*sin(t*1.6 + uv.x*9.0) + 0.0010*cos(t*3.7 + uv.y*55.0));
  // the lake: a slow horizontal shimmer, finer near the shore
  off.x += m.g * 0.0011 * sin(uv.y*820.0 + t*2.6) * (0.6 + 0.4*sin(uv.x*40.0 - t));
  // the mist: drifts along the valley
  off.x += m.b * 0.007 * sin(t*0.11 + uv.y*7.0 + uv.x*2.0);
  // the clock tower and the campus stay perfectly still: no drift or shimmer reaches them
  vec2 tw = smoothstep(vec2(0.618, 0.27), vec2(0.628, 0.285), uv) * (1.0 - smoothstep(vec2(0.692, 0.72), vec2(0.702, 0.735), uv));
  vec2 cp = smoothstep(vec2(0.44, 0.60), vec2(0.46, 0.62), uv) * (1.0 - smoothstep(vec2(0.90, 0.77), vec2(0.92, 0.79), uv));
  float still = max(tw.x * tw.y, cp.x * cp.y);
  off *= 1.0 - still;
  vec3 c = texture(art, uv + off).rgb;
  // the mist breathes a little lighter and darker
  c += (1.0 - still) * m.b * 0.035 * vec3(0.8,0.75,1.0) * (0.5 + 0.5*sin(t*0.4 + uv.x*5.0 - uv.y*3.0));
  // glints on the water
  vec2 cell = floor(uv * vec2(240.0, 700.0));
  float n = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float gl = step(0.992, n) * pow(0.5 + 0.5*sin(t*2.2 + n*80.0), 6.0);
  c += m.g * gl * vec3(1.0, 0.8, 0.55) * 0.22;
  o = vec4(c, 1.0);
}`;

// `still` is asked every frame, so the site's motion switch can stop or restart the loop live
function paint(canvas: HTMLCanvasElement, srcs: [string, string], still: () => boolean, onReady: () => void) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return () => {};
  // let the context go when we're done, rather than waiting for GC to find it
  const lose = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  const shaders: WebGLShader[] = [];
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    shaders.push(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    lose();
    return () => {};
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, 't');
  const textures: WebGLTexture[] = [];
  const tex = (unit: number, img: HTMLImageElement, name: string) => {
    const t = gl.createTexture()!;
    textures.push(t);
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
  };
  let raf = 0;
  let visible = false;
  let alive = true;
  let ready = false;
  const start = () => {
    if (visible && !raf && !still()) raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    start();
  });
  const size = () => {
    const d = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(canvas.clientWidth * d);
    canvas.height = Math.round(canvas.clientHeight * d);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // resizing wipes the canvas; when the loop is stopped, put the still frame back
    if (ready) draw();
  };
  const t0 = performance.now();
  const draw = () => {
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  function frame() {
    raf = 0;
    // motion switched off: the last frame stays up as the still
    if (!alive || !visible || still()) return;
    draw();
    raf = requestAnimationFrame(frame);
  }
  const load = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.decoding = 'async';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  Promise.all(srcs.map(load)).then(([art, matte]) => {
    if (!alive) return;
    tex(0, art, 'art');
    tex(1, matte, 'matte');
    ready = true;
    size();
    onReady();
    io.observe(canvas);
  }, () => {});
  window.addEventListener('resize', size);
  // motion switched back on: pick the loop up again
  window.addEventListener('motionchange', start);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener('resize', size);
    window.removeEventListener('motionchange', start);
    textures.forEach((t) => gl.deleteTexture(t));
    gl.deleteBuffer(buf);
    shaders.forEach((s) => gl.deleteShader(s));
    gl.deleteProgram(prog);
    lose();
  };
}

export function FootScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  // the birds' wingbeats are SVG animation, which CSS can't pause: with motion off they glide
  const moving = useMotion();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    // the site's motion switch, and the device's reduce-motion setting
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const still = () => !motionOn() || reduce.matches;
    const small = innerWidth < 900;
    return paint(c, [small ? ART_SM : ART, MATTE], still, () => box.current?.classList.add('is-live'));
  }, []);

  return (
    <div className="fs" aria-hidden="true">
      {/* the window shows the bottom of the painting (the town); on short screens the empty sky
          at its top is what gets cropped, so the footer never grows taller than the screen */}
      <div ref={box} className="fs__art">
      {/* the painting as a plain picture first, the moving one replaces it once it's ready */}
      <picture>
        <source media="(max-width: 899px)" srcSet={ART_SM} />
        <img className="fs__img" src={ART} alt="" decoding="async" loading="lazy" />
      </picture>
      <canvas ref={canvas} className="fs__gl" />
      <svg className="fs__over" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <radialGradient id="fs-glow">
            <stop offset="0" stopColor="#ffd89a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffb860" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fs-red">
            <stop offset="0" stopColor="#ff4a3a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ff4a3a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fs-sun">
            <stop offset="0" stopColor="#ff9a4d" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff7a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* the setting sun's haze */}
        <circle className="fs__sun" cx={1585} cy={300} r={120} fill="url(#fs-sun)" />
        {/* the clock tower stays still; only a small red warning light burns on the spire */}
        <circle cx={1269} cy={243} r={9} fill="url(#fs-red)" />
        <circle cx={1269} cy={243} r={2.4} fill="#ff4a3a" />
        {/* the town's lights */}
        {LIGHTS.map(([x, y], i) => (
          <circle key={i} className="fs__light" cx={(x / 100) * W} cy={(y / 100) * H} r={3 + rnd(i) * 3} fill="url(#fs-glow)" style={{ animationDelay: `${-rnd(i + 7) * 5}s`, animationDuration: `${2.4 + rnd(i + 9) * 3}s` }} />
        ))}
        {/* the flock, leaving from where it was painted */}
        <g className="fs__flock">
          {BIRDS.map(([x, y, w], i) => (
            <g key={i} transform={`translate(${(x / 100) * W} ${(y / 100) * H}) scale(${w / 22})`}>
              <g className="fs__drift" style={{ animationDelay: `${-i * 0.7}s` }}>
                {/* one silhouette, like the painted ones: the wings beat, then glide */}
                <path className="fs__bird" fill="#120c16" d={WING_UP}>
                  {moving && <animate attributeName="d" dur={`${1.1 + rnd(i + 30) * 0.5}s`} begin={`${-rnd(i + 40) * 2}s`} repeatCount="indefinite" values={`${WING_UP};${WING_MID};${WING_DOWN};${WING_MID};${WING_UP};${WING_UP}`} keyTimes="0;0.15;0.3;0.45;0.6;1" />}
                </path>
              </g>
            </g>
          ))}
        </g>
      </svg>
      {/* leaves let go of the maple and drift down across the valley */}
      <div className="fs__leaves">
        {LEAVES.map((l, i) => (
          <span key={i} style={{ left: `${l.x}%`, top: `${l.y}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}>
            <svg viewBox="-9 -9 18 18" width={l.s} height={l.s} style={{ animationDuration: `${l.sway}s` }}>
              <path d={LEAF} fill={l.fill} />
            </svg>
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}
