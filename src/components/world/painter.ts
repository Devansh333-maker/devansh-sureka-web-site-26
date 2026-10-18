// The painting, drawn on the GPU in one pass: it pulls into focus, drifts in slowly, and
// the wind moves what the wind would move: the red cape, the long hair, the torn robe and
// the maple's leaves. Nothing else in the painting moves.
//
// How the cloth moves like cloth:
//  · mattes (one texture: R cape, G hair/robe, B leaves) say exactly which pixels are fabric,
//    already weighted from where it's held (0) to its free end (1);
//  · waves travel from the shoulder out to the tip, growing as they go, mostly across the
//    direction the cloth streams (a billow), with a little give along it;
//  · the cloth's outline moves too: each pixel asks "is there cloth arriving here?" by reading
//    the matte at the source of the wave, and shows the sky behind it (a painted-out back plate)
//    wherever the cloth has moved away;
//  · folds catch the light: the slope of each wave brightens or shades the cloth;
//  · the wind gusts: everything breathes on a slow, irregular swell, never a fixed loop.

const VERT = `#version 300 es
in vec2 pos;
out vec2 vUv;
void main() {
  vUv = vec2(pos.x * 0.5 + 0.5, 0.5 - pos.y * 0.5); // y down, like the image
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 color;
uniform sampler2D tex;   // the painting
uniform sampler2D wind;  // coverage mattes: R cape, G hair (above y .45) and robe (below), B maple leaves
uniform sampler2D back;  // the sky behind the cloth, inside BACK
uniform float uTime;
uniform float uFocus;    // 1 = blurred, 0 = sharp
uniform float uScale;
uniform vec2 uOrigin;
const vec4 BACK = vec4(0.04, 0.28, 0.31, 0.63); // x0, y0, x1, y1

vec3 behind(vec2 p) {
  vec2 b = (p - BACK.xy) / (BACK.zw - BACK.xy);
  if (b.x > 0.0 && b.x < 1.0 && b.y > 0.0 && b.y < 1.0) return texture(back, b).rgb;
  return texture(tex, p).rgb;
}

void main() {
  vec2 p = uOrigin + (vUv - uOrigin) / uScale;
  float t = uTime;
  // the wind's breath: slow, uneven gusts, travelling with the wind (right to left), so a gust
  // reaches the cape a moment before it reaches the maple
  float tw = t + (p.x - 0.3) * 1.8;
  float gust = 0.72 + 0.2 * sin(tw * 0.61) + 0.12 * sin(tw * 1.53 + 1.1) + 0.06 * sin(tw * 3.7 + 0.4);

  // the cape is cloth, simulated and drawn as a mesh on top (see Cloth); here it's only lifted out
  float sC = clamp((0.285 - p.x) / 0.22, 0.0, 1.0);

  // ── the hair: finer, faster strands ──
  float sH = clamp((0.262 - p.x) / 0.11, 0.0, 1.0);
  float phH = (0.262 - p.x) * 90.0 + (p.y - 0.36) * 30.0 - t * 7.0;
  vec2 dH = vec2(-0.002 * (0.5 + 0.5 * sin(phH * 0.7)), 0.0055 * (sin(phH) + 0.4 * sin(phH * 1.9 + 2.0))) * sH * gust;

  // ── the torn robe: a heavier flap, mostly along the wind ──
  float sR = clamp((0.25 - p.x) / 0.09, 0.0, 1.0);
  float phR = (0.25 - p.x) * 50.0 + (p.y - 0.52) * 25.0 - t * 3.4;
  vec2 dR = vec2(-0.0045 * (0.6 + 0.4 * sin(phR)), 0.003 * sin(phR * 1.3 + 0.9)) * sR * gust;

  // which kind of cloth would arrive here, read at the source of each wave
  vec2 mG = vec2(texture(wind, p - dH).g, texture(wind, p - dR).g);
  float hair = p.y < 0.45 ? mG.x : 0.0;
  float robe = p.y >= 0.45 ? mG.y : 0.0;
  // the sky behind (or the painting, where nothing has moved)
  vec3 col = behind(p);
  // where the cloth is free to move, start from the sky behind it; where it's held, from the painting
  vec3 here = texture(wind, p).rgb;
  float freeG = p.y < 0.45 ? smoothstep(0.0, 0.3, sH) : smoothstep(0.0, 0.3, sR);
  float open = max(here.r * smoothstep(0.0, 0.25, sC), here.g * freeG);
  col = mix(texture(tex, p, uFocus * 6.0).rgb, col, open);
  // lay each moving piece over it, lit by the slope of its wave
  vec3 cR = texture(tex, p - dR, uFocus * 6.0).rgb * (1.0 + 0.12 * cos(phR) * sR);
  vec3 cH = texture(tex, p - dH, uFocus * 6.0).rgb;
  col = mix(col, cR, robe);
  col = mix(col, cH, hair);

  // ── the maple: leaves shiver and catch the light, the boughs barely move ──
  float leaf = texture(wind, p).b;
  if (leaf > 0.01) {
    float phL = p.x * 34.0 + p.y * 21.0 - t * 1.4;
    vec2 dL = vec2(sin(phL) + 0.5 * sin(phL * 3.1 + t * 2.3), cos(phL * 0.8) * 0.6 + 0.4 * sin(phL * 2.7 - t * 3.1)) * 0.0016 * gust;
    vec3 cL = texture(tex, p - dL * leaf, uFocus * 6.0).rgb;
    float glint = 1.0 + 0.1 * leaf * sin(p.x * 140.0 + p.y * 90.0 + t * 4.0) * gust;
    col = mix(col, cL * glint, leaf);
  }
  color = vec4(col, 1.0);
}`;

// ── the cape as cloth ──
// The painted cape is cut out (a tight alpha matte) and pinned to a grid of points. Each point
// is held toward where it was painted (firmly at the neck, loosely at the tip), pushed by a
// wind that gusts and travels out along the cloth, and tied to its neighbours so the sheet
// keeps its size. The grid is drawn with the painting's own pixels, lit by its folds.
const CVERT = `#version 300 es
in vec2 pos;     // where the point is now, in painting pixels
in vec2 rest;    // where it was painted (0..1)
in float light;
out vec2 vRest;
out float vLight;
uniform vec2 uSize;
uniform float uScale;
uniform vec2 uOrigin;
void main() {
  vec2 p = pos / uSize;
  vec2 s = uOrigin + (p - uOrigin) * uScale;
  vRest = rest;
  vLight = light;
  gl_Position = vec4(s.x * 2.0 - 1.0, 1.0 - s.y * 2.0, 0.0, 1.0);
}`;
const CFRAG = `#version 300 es
precision highp float;
in vec2 vRest;
in float vLight;
out vec4 color;
uniform sampler2D tex;
uniform sampler2D cape;
uniform float uFocus;
void main() {
  float a = texture(cape, vRest).r;
  if (a < 0.004) discard;
  vec3 c = texture(tex, vRest, uFocus * 6.0).rgb * vLight;
  color = vec4(c, a);
}`;

const BOX = { x0: 0.066, x1: 0.302, y0: 0.33, y1: 0.524 };
const NX = 60;
const NY = 26;
const NECK = 0.29; // where it's held (x, as a fraction of the painting)
const LEN = 0.21; // from the neck to the free end

class Cloth {
  n = NX * NY;
  rest: Float32Array;
  p: Float32Array;
  q: Float32Array; // previous positions
  free: Float32Array; // 0 held … 1 free
  light: Float32Array;
  links: Int32Array;
  len: Float32Array;
  index: Uint16Array;
  constructor(
    public W: number,
    public H: number,
  ) {
    const n = this.n;
    this.rest = new Float32Array(n * 2);
    this.p = new Float32Array(n * 2);
    this.q = new Float32Array(n * 2);
    this.free = new Float32Array(n);
    this.light = new Float32Array(n).fill(1);
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        const u = BOX.x0 + ((BOX.x1 - BOX.x0) * i) / (NX - 1);
        const v = BOX.y0 + ((BOX.y1 - BOX.y0) * j) / (NY - 1);
        this.rest[k * 2] = u;
        this.rest[k * 2 + 1] = v;
        this.p[k * 2] = this.q[k * 2] = u * W;
        this.p[k * 2 + 1] = this.q[k * 2 + 1] = v * H;
        this.free[k] = Math.min(1, Math.max(0, (NECK - u) / LEN));
      }
    const L: number[] = [];
    const add = (a: number, b: number) => L.push(a, b);
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        if (i < NX - 1) add(k, k + 1);
        if (j < NY - 1) add(k, k + NX);
        if (i < NX - 1 && j < NY - 1) {
          add(k, k + NX + 1);
          add(k + 1, k + NX);
        }
        if (i < NX - 2) add(k, k + 2); // bend: keeps it from crumpling
      }
    this.links = new Int32Array(L);
    this.len = new Float32Array(L.length / 2);
    for (let e = 0; e < this.len.length; e++) {
      const a = L[e * 2] * 2;
      const b = L[e * 2 + 1] * 2;
      this.len[e] = Math.hypot(this.p[a] - this.p[b], this.p[a + 1] - this.p[b + 1]);
    }
    const I: number[] = [];
    for (let j = 0; j < NY - 1; j++)
      for (let i = 0; i < NX - 1; i++) {
        const k = j * NX + i;
        I.push(k, k + 1, k + NX, k + 1, k + NX + 1, k + NX);
      }
    this.index = new Uint16Array(I);
  }

  // one fixed step
  step(t: number, dt: number) {
    const { p, q, rest, free, W, H } = this;
    const damp = Math.exp(-2.6 * dt);
    // the wind: uneven gusts, and waves that run from the neck out to the tip
    const gust = 0.72 + 0.2 * Math.sin(t * 0.61) + 0.12 * Math.sin(t * 1.53 + 1.1) + 0.06 * Math.sin(t * 3.7 + 0.4);
    for (let k = 0; k < this.n; k++) {
      const f = free[k];
      const x = k * 2;
      const rx = rest[x] * W;
      const ry = rest[x + 1] * H;
      if (f < 0.03) {
        p[x] = q[x] = rx;
        p[x + 1] = q[x + 1] = ry;
        continue;
      }
      const d = (NECK - rest[x]) * W; // px from the neck
      const ph = d * 0.034 + ry * 0.012 - t * 4.4;
      const ph2 = d * 0.081 - t * 7.3 + ry * 0.03;
      const pull = 120 - 112 * Math.pow(f, 0.45); // firm at the neck, loose at the tip
      let ax = (rx - p[x]) * pull;
      let ay = (ry - p[x + 1]) * pull;
      const fp = Math.pow(f, 1.25) * gust * WIND;
      ay += fp * (520 * Math.sin(ph) + 170 * Math.sin(ph * 2.13 + 1.7)) + Math.pow(f, 3) * gust * WIND * 420 * Math.sin(ph2);
      ax += -fp * 200 * (0.6 + 0.4 * Math.sin(ph * 0.6 - 0.8)) + Math.pow(f, 3) * WIND * 120 * Math.sin(ph2 * 1.3 + 0.5);
      // a gust lifts the free end a little
      ay -= 160 * WIND * Math.pow(f, 1.6) * Math.max(0, gust - 0.75);
      const vx = (p[x] - q[x]) * damp;
      const vy = (p[x + 1] - q[x + 1]) * damp;
      q[x] = p[x];
      q[x + 1] = p[x + 1];
      p[x] += vx + ax * dt * dt;
      p[x + 1] += vy + ay * dt * dt;
    }
    // keep the sheet its own size
    const { links, len } = this;
    for (let it = 0; it < 3; it++)
      for (let e = 0; e < len.length; e++) {
        const a = links[e * 2];
        const b = links[e * 2 + 1];
        const wa = free[a] < 0.03 ? 0 : 1;
        const wb = free[b] < 0.03 ? 0 : 1;
        if (wa + wb === 0) continue;
        const dx = p[b * 2] - p[a * 2];
        const dy = p[b * 2 + 1] - p[a * 2 + 1];
        const dist = Math.hypot(dx, dy) || 1e-6;
        const c = ((dist - len[e]) / dist / (wa + wb)) * 0.9;
        p[a * 2] += dx * c * wa;
        p[a * 2 + 1] += dy * c * wa;
        p[b * 2] -= dx * c * wb;
        p[b * 2 + 1] -= dy * c * wb;
      }
  }

  // folds catch the light: where the cloth tilts up toward the sun (right) it brightens
  shade() {
    const { p, rest, light, W, H } = this;
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        const a = j * NX + Math.max(0, i - 1);
        const b = j * NX + Math.min(NX - 1, i + 1);
        const da = p[a * 2 + 1] - rest[a * 2 + 1] * H;
        const db = p[b * 2 + 1] - rest[b * 2 + 1] * H;
        const span = (rest[b * 2] - rest[a * 2]) * W || 1;
        const slope = (db - da) / span;
        // bunched cloth (shorter than painted) sits in shadow
        const sx = (p[b * 2] - p[a * 2]) / span;
        light[k] = Math.min(1.35, Math.max(0.7, 1 + slope * 1.4 - (1 - Math.min(1, sx)) * 0.5));
      }
  }
}
const WIND = 3; // overall strength

export class Painter {
  private gl: WebGL2RenderingContext;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private base!: WebGLProgram;
  private cprog: WebGLProgram | null = null;
  private cu: Record<string, WebGLUniformLocation | null> = {};
  private cvao: WebGLVertexArrayObject | null = null;
  private bvao: WebGLVertexArrayObject | null = null;
  private posBuf: WebGLBuffer | null = null;
  private lightBuf: WebGLBuffer | null = null;
  private cloth: Cloth | null = null;
  private simT = 0;
  private raf = 0;
  private last = 0;
  private ro: ResizeObserver;
  time = 0;
  rate = 1; // the projector speed (slowed for the breath before the cut)
  focus = 1;
  scale = 1.14;
  running = false;

  static ok() {
    try {
      return !!document.createElement('canvas').getContext('webgl2');
    } catch {
      return false;
    }
  }

  constructor(
    private canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    wind: HTMLImageElement,
    back: HTMLImageElement,
    cape?: HTMLImageElement,
  ) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' })!;
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const link = (v: string, f: string) => {
      const pr = gl.createProgram()!;
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, v));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, f));
      gl.linkProgram(pr);
      return pr;
    };
    const prog = link(VERT, FRAG);
    this.base = prog;
    gl.useProgram(prog);
    this.bvao = gl.createVertexArray();
    gl.bindVertexArray(this.bvao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = (unit: number, image: HTMLImageElement, mips: boolean) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      if (mips) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    texture(0, img, true);
    texture(1, wind, false);
    texture(2, back, false);
    gl.uniform1i(gl.getUniformLocation(prog, 'tex'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'wind'), 1);
    gl.uniform1i(gl.getUniformLocation(prog, 'back'), 2);
    for (const n of ['uTime', 'uFocus', 'uScale', 'uOrigin']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.uniform2f(this.u.uOrigin, 0.38, 0.56);

    // the cape, as cloth
    if (cape && cape.naturalWidth) {
      texture(3, cape, false);
      const cp = link(CVERT, CFRAG);
      if (gl.getProgramParameter(cp, gl.LINK_STATUS)) {
        const cloth = new Cloth(img.naturalWidth, img.naturalHeight);
        this.cloth = cloth;
        this.cprog = cp;
        gl.useProgram(cp);
        this.cvao = gl.createVertexArray();
        gl.bindVertexArray(this.cvao);
        const attr = (name: string, data: Float32Array, size: number, usage: number) => {
          const b = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, data, usage);
          const l = gl.getAttribLocation(cp, name);
          gl.enableVertexAttribArray(l);
          gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
          return b;
        };
        this.posBuf = attr('pos', cloth.p, 2, gl.DYNAMIC_DRAW);
        attr('rest', cloth.rest, 2, gl.STATIC_DRAW);
        this.lightBuf = attr('light', cloth.light, 1, gl.DYNAMIC_DRAW);
        const ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloth.index, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        gl.uniform1i(gl.getUniformLocation(cp, 'tex'), 0);
        gl.uniform1i(gl.getUniformLocation(cp, 'cape'), 3);
        gl.uniform2f(gl.getUniformLocation(cp, 'uSize'), img.naturalWidth, img.naturalHeight);
        gl.uniform2f(gl.getUniformLocation(cp, 'uOrigin'), 0.38, 0.56);
        for (const n of ['uScale', 'uFocus']) this.cu[n] = gl.getUniformLocation(cp, n);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // let it settle into the wind before anyone sees it
        for (let i = 0; i < 240; i++) cloth.step(i / 120, 1 / 120);
        this.simT = 2;
      }
    }

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.round(r.width * d));
    this.canvas.height = Math.max(1, Math.round(r.height * d));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.draw();
  }

  draw() {
    const gl = this.gl;
    gl.useProgram(this.base);
    gl.bindVertexArray(this.bvao);
    gl.uniform1f(this.u.uTime, this.time);
    gl.uniform1f(this.u.uFocus, this.focus);
    gl.uniform1f(this.u.uScale, this.scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const c = this.cloth;
    if (c && this.cprog) {
      // run the cloth on the opening's clock, in fixed steps (after a stall, don't try to catch up)
      const t0 = this.time + 2;
      if (t0 - this.simT > 0.25) this.simT = t0 - 0.25;
      while (this.simT < t0) {
        this.simT += 1 / 120;
        c.step(this.simT, 1 / 120);
      }
      c.shade();
      gl.useProgram(this.cprog);
      gl.bindVertexArray(this.cvao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, c.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lightBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, c.light);
      gl.uniform1f(this.cu.uScale, this.scale);
      gl.uniform1f(this.cu.uFocus, this.focus);
      gl.enable(gl.BLEND);
      gl.drawElements(gl.TRIANGLES, c.index.length, gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.BLEND);
    }
  }


  // tick: called with the opening's own clock
  start(tick: (now: number) => void) {
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
      this.last = now;
      this.time += dt * this.rate;
      tick(now);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.ro.disconnect();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
