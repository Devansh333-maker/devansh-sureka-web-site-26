'use client';

import { useEffect, useRef } from 'react';
import { ambience } from '@/components/sound/ambience';
import { Painter } from './painter';
import './ronin.css';

// The opening, painted: a ronin under a maple on the ridge above the valley at sunset.
//
// How it stays smooth:
//  · one live layer while it plays (the two halves of the cut only appear at the cut);
//  · the painting and the wind in the cloth are one GPU draw (painter.ts), not filters;
//  · every move is a Web Animation scheduled from a single start time, so the browser's
//    compositor runs them in step even while the island is loading on the main thread;
//  · the island only starts loading once the entrance is done, and the cut waits for it;
//  · the cut's sound, flash and split all start from the same instant.

// /opt is cached for a week, so bump V whenever these pictures change (or visitors keep the old ones)
const V = '?v=20261015';
export const PLATE = `/opt/opening/ronin.webp${V}`;
// mattes for the cloth and the leaves, and the sky behind the cloth (see painter.ts)
const WIND = `/opt/opening/ronin-wind.webp${V}`;
const BACK = `/opt/opening/ronin-back.webp${V}`;
const CAPE = `/opt/opening/ronin-cape.webp${V}`;
export const OPENING_IMAGES = [PLATE, WIND, BACK, CAPE];
const AMBIENT = '/audio/opening-ambient.mp3';
const CUT = '/audio/opening-cut.mp3';
// the painting at 48×27, inline: shows (blurred) the instant the page opens
const LQIP = 'data:image/webp;base64,UklGRuYBAABXRUJQVlA4INoBAAAwCQCdASowABsAPrFKnUmnJKKhKq344BYJbACdMvaAffmWTjPjcfctHgBVMad6OlXBSPI8MBf1qdINgahpKb2NrNS0lOs2memOAJ3h08U8C9EUAP74at7lxUl9kN6frLI1/4no17WTJ/PHv9Vcyn64864liCy0l68JX6jKbob7sJMK51v8u4cOisIpTieEsUj4k2C4UFtMJFPMybppiyycvX55cuBJOcEqJ+7bTbN7XsHw4vcu7xrQ8gIpa1xK9GH+E8lPN/2vZDHY9by2d3IzhFAqs+gTXvYG/B25T31Sg1ZEtpvUgMOsOUK4UZ4gRw6ptgvXM3LCdK1W/s13vs3qm7k1MpXtonzzkxp8imSXeQ8uVL9klRq0hxzJQSJ7WMjZrFaPZ+4RbdyE+z49p9KUCqh6nYekZ4nK9CBAMgD3S6nDVfJUce6Y2Cqx3uYV2+m2jOxB2Gd01/wGgUMvssdD1ZisYNilfZwxNu5uA1OXXv5JQBPvdMwocQacgDZxYz/A+bsoXtp7eWkMUYRBAoLV7PKFOrhcIwNhDM0UmeJVRmvz2P7lolJbb552dyFOKq6+TMcscECg6ARfCx5CeE2KK5ktW6zLjgSoedF23d6R63Hs4T+kJDfcAAA=';

// seeded, and rounded so the server and the browser agree to the last digit
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};

// a maple leaf: five pointed lobes, a stem, and its veins
const LEAF = 'M12 1 L13.5 6 L17.6 3.4 L16.6 8.3 L22.6 8.6 L18.4 12.2 L21 17.6 L15.2 16 L12.6 22.6 L12 20 L11.4 22.6 L8.8 16 L3 17.6 L5.6 12.2 L1.4 8.6 L7.4 8.3 L6.4 3.4 L10.5 6 Z';
const VEINS = 'M12 21 L12 6 M12 13 L18 9.5 M12 13 L6 9.5 M12 15 L17.5 16.5 M12 15 L6.5 16.5';
const LEAF_COLORS = ['#b8301b', '#d8452a', '#9c240f', '#e8622f', '#c93a1e', '#a83418'];
// the wind blows to the left: leaves come off the maple (top left) and from beyond the right edge
const LEAVES = Array.from({ length: 18 }, (_, i) => {
  const depth = i < 2 ? 2 : i < 8 ? 1 : 0; // near, middle, far
  const fromTree = rnd(i + 21) < 0.62;
  return {
    x: fromTree ? 4 + rnd(i) * 50 : 45 + rnd(i) * 62,
    size: [10, 16, 34][depth] * (0.8 + rnd(i + 3) * 0.45),
    dur: [15, 11, 7][depth] * (0.85 + rnd(i + 5) * 0.35),
    delay: -rnd(i + 7) * 15,
    drift: -(10 + rnd(i + 9) * 26),
    sway: 1.8 + rnd(i + 15) * 1.6,
    swayX: 18 + rnd(i + 19) * 30,
    spin: 2.6 + rnd(i + 11) * 3.4,
    tilt: rnd(i + 13) * 60 - 30,
    color: LEAF_COLORS[Math.floor(rnd(i + 17) * LEAF_COLORS.length)],
    depth,
  };
});
// birds: they start where the painting had them, and glide on into the wind; distant ones are
// smaller, paler and slower. They mostly glide, with an occasional run of wing beats.
const BIRDS = [
  { x: 46.8, y: 24.8, s: 1, dur: 58, beat: 3.6, delay: -0.4, far: false },
  { x: 52.3, y: 38.3, s: 1.18, dur: 64, beat: 4.4, delay: -2.1, far: false },
  { x: 44.4, y: 40.4, s: 0.72, dur: 52, beat: 3.1, delay: -1.2, far: false },
  { x: 63, y: 17.5, s: 0.42, dur: 80, beat: 2.8, delay: -0.7, far: true },
  { x: 66.5, y: 19.8, s: 0.36, dur: 86, beat: 3.3, delay: -1.9, far: true },
  // one low over the valley, small against the mist
  { x: 60, y: 47, s: 0.4, dur: 70, beat: 3.9, delay: -3.2, far: true },
  // a loose flock riding the wind the other way, quicker, flapping more
  { x: 80, y: 13, s: 0.44, dur: 30, beat: 1.7, delay: -0.3, far: true, left: true },
  { x: 83.4, y: 15.6, s: 0.4, dur: 31, beat: 1.5, delay: -0.9, far: true, left: true },
  { x: 86.8, y: 12.2, s: 0.38, dur: 29, beat: 1.8, delay: -0.6, far: true, left: true },
  { x: 89.6, y: 16.8, s: 0.34, dur: 32, beat: 1.6, delay: -1.3, far: true, left: true },
  { x: 84.6, y: 9.6, s: 0.32, dur: 30, beat: 1.9, delay: -0.2, far: true, left: true },
];
const LIGHTS = Array.from({ length: 34 }, (_, i) => ({
  x: 47 + rnd(i + 40) * 49,
  y: 62 + rnd(i + 41) * 17 - (rnd(i + 40) > 0.75 ? 6 : 0),
  s: 2 + rnd(i + 42) * 3,
  on: 0.6 + rnd(i + 43) * 1.8,
  tw: 1.4 + rnd(i + 44) * 2.6,
}));

function Rule() {
  return (
    <>
      <div className="intro-meta ro-meta">
        <span>DEVANSH SUREKA</span>
        <span>PILANI · JAIPUR — 2026</span>
      </div>
      <div className="intro-rule ro-rule">
        <p className="intro-line">
          <span className="intro-word">Get</span> <span className="intro-word">into</span> <span className="intro-word">it</span>{' '}
          <span className="intro-word">properly.</span>
        </p>
        <p className="intro-line">
          <span className="intro-word">Do</span> <span className="intro-word">the</span> <span className="intro-word">work</span>{' '}
          <span className="intro-word is-accent">perfectly.</span>
        </p>
        <p className="intro-sig">— the one rule I keep</p>
      </div>
    </>
  );
}

function Glows({ lit }: { lit?: boolean }) {
  return (
    <>
      <div className="ro-sun" />
      {LIGHTS.map((l, i) => (
        <i
          key={i}
          className={`ro-light ${lit ? 'is-lit' : ''}`}
          style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, ['--on' as string]: `${l.on}s`, ['--tw' as string]: `${l.tw}s` }}
        />
      ))}
      <div className="ro-lantern" />
    </>
  );
}

// The live opening: everything that moves, drawn once.
export function RoninLive() {
  return (
    <div className="intro-art ro-art ro-live">
      <div className="ro-stage">
        <div className="ro-lqip" style={{ backgroundImage: `url(${LQIP})` }} />
        <canvas className="ro-gl" aria-hidden="true" />
        <div className="ro-plate ro-plate--fallback" style={{ backgroundImage: `url(${PLATE})` }} />
        <div className="ro-fx">
          <div className="ro-mist ro-mist--a" />
          <div className="ro-mist ro-mist--b" />
          <Glows />
          <svg className="ro-blade" viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
            <line className="ro-glint" x1="566" y1="534" x2="654" y2="716" pathLength={1} />
          </svg>
          <span className="ro-spark" />
          {BIRDS.map((b, i) => (
            <div
              key={i}
              className={`ro-bird ${b.far ? 'is-far' : ''} ${'left' in b && b.left ? 'is-left' : ''}`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                ['--s' as string]: b.s,
                ['--fly' as string]: `${b.dur}s`,
                ['--beat' as string]: `${b.beat}s`,
                ['--delay' as string]: `${b.delay}s`,
              }}
            >
              <svg viewBox="0 0 60 30" aria-hidden="true">
                <g transform={'left' in b && b.left ? 'translate(60 0) scale(-1 1)' : undefined}>
                <path className="ro-wing ro-wing--far" d="M33 14 C36 8 41 4 49 2 C46 6 44.5 8 43 9.5 C41 11.5 38.5 13.5 36 15 Z" />
                <path className="ro-bird__body" d="M22 15 C27 12.6 36 12.4 41 14.2 L46.5 13.4 L42.5 15.6 C36.5 17.8 27.5 17.8 22 15 Z M22.5 15 L14.5 12.4 L16.5 15 L14.5 17.6 Z" />
                <path className="ro-wing ro-wing--near" d="M33 14.5 C28 9.5 21 4.5 10 1.5 C14 5 16 7 18.5 8.6 C21.5 10.6 25.5 13.5 29 16.4 Z" />
                </g>
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div className="ro-leaves" aria-hidden="true">
        {LEAVES.map((l, i) => (
          <span
            key={i}
            className={`ro-leaf ro-leaf--d${l.depth}`}
            style={{
              left: `${l.x}%`,
              ['--dur' as string]: `${l.dur}s`,
              ['--delay' as string]: `${l.delay}s`,
              ['--dx' as string]: `${l.drift}vw`,
              ['--sway' as string]: `${l.sway}s`,
              ['--swx' as string]: `${l.swayX}px`,
              ['--spin' as string]: `${l.spin}s`,
              ['--tilt' as string]: `${l.tilt}deg`,
            }}
          >
            <i className="ro-leaf__sway">
              <svg className="ro-leaf__spin" viewBox="0 0 24 24" width={l.size} height={l.size}>
                <path d={LEAF} fill={l.color} />
                <path d={VEINS} stroke="rgba(70,12,4,.45)" strokeWidth="0.7" fill="none" />
              </svg>
            </i>
          </span>
        ))}
      </div>
      <div className="ro-grade" />
      <div className="ro-tight" />
      <Rule />
    </div>
  );
}

// One half of the cut: the painting as it stands at that instant, held still.
export function RoninHalf() {
  return (
    <div className="intro-art ro-art ro-still">
      <div className="ro-stage">
        <div className="ro-plate" style={{ backgroundImage: `url(${PLATE})` }} />
        <Glows lit />
      </div>
      <div className="ro-grade" />
      <div className="ro-tight" />
      <Rule />
    </div>
  );
}

// ── sound: follows the site's own Sound switch (bottom-left) ──
let audio: { ctx: AudioContext; gain: GainNode; cut?: AudioBuffer } | null = null;
// bumped on every start, so a pending sleep from an earlier stop knows it's stale
let wake = 0;
// when the cut's sound ends (context time), so the sleep doesn't clip it
let cutEnds = 0;
async function loadBuffer(ctx: AudioContext, url: string) {
  const r = await fetch(url);
  return ctx.decodeAudioData(await r.arrayBuffer());
}
async function startAmbient() {
  wake += 1;
  if (!audio) {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    audio = { ctx, gain };
    const [amb, cut] = await Promise.all([loadBuffer(ctx, AMBIENT), loadBuffer(ctx, CUT)]);
    audio.cut = cut;
    const src = ctx.createBufferSource();
    src.buffer = amb;
    src.loop = true;
    src.connect(gain);
    src.start();
  }
  await audio.ctx.resume();
  audio.gain.gain.setTargetAtTime(0.7, audio.ctx.currentTime, 0.4);
}
function stopAmbient(fade = 0.4) {
  if (!audio) return;
  audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, fade);
  // once it has faded (and the cut has played out), put the context to sleep so the
  // looping ambient stops costing the audio thread; startAmbient() resumes it
  const a = audio;
  const w = wake;
  const sleep = () => {
    if (w !== wake || a.ctx.state !== 'running') return;
    const left = cutEnds - a.ctx.currentTime;
    if (left > 0) window.setTimeout(sleep, left * 1000 + 100);
    else a.ctx.suspend().catch(() => {});
  };
  window.setTimeout(sleep, fade * 5000);
}
function playCut() {
  if (!audio?.cut || !ambience().on) return;
  const s = audio.ctx.createBufferSource();
  s.buffer = audio.cut;
  s.connect(audio.ctx.destination);
  s.start();
  cutEnds = audio.ctx.currentTime + audio.cut.duration;
  audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime + 1.2, 0.8);
}

// the loading line under the painting, and the sound kept in step with the site's switch
export function IntroBar({ progress }: { progress: React.MutableRefObject<number> }) {
  const bar = useRef<HTMLElement>(null);
  const pct = useRef<HTMLElement>(null);
  useEffect(() => {
    let raf = 0;
    let shown = 0;
    let lastPct = -1;
    let playing = false;
    let frame = 0;
    const tick = () => {
      shown += (progress.current - shown) * 0.08;
      if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.02, shown)})`;
      const n = Math.min(100, Math.round(shown * 100 + (progress.current >= 1 && shown > 0.985 ? 1 : 0)));
      if (n !== lastPct && pct.current) {
        lastPct = n;
        pct.current.textContent = `${String(n).padStart(2, '0')}%`;
      }
      if (++frame % 10 === 0) {
        const on = ambience().on;
        if (on && !playing) startAmbient().catch(() => {});
        if (!on && playing) stopAmbient();
        playing = on;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stopAmbient(0.8);
    };
  }, [progress]);
  return (
    <div className="ro-bar">
      <span className="ro-load" role="progressbar" aria-label="Loading the world">
        <i ref={bar} />
      </span>
      <span className="ro-pct" ref={pct} aria-hidden="true">
        00%
      </span>
    </div>
  );
}

// ── the director ──
const OUT3 = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
const INOUT3 = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
const IN4 = 'cubic-bezier(0.895, 0.03, 0.685, 0.22)';
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export type RoninHooks = {
  mount3D: () => void; // start loading the island
  isReady: () => boolean; // the island has drawn its first frame
  build: () => void; // the cut has landed: build the island
  done: () => void; // the opening is over: remove it
};
export type RoninCtl = { ready: () => void; skip: () => void; dispose: () => void };

export function runRonin(root: HTMLElement, hooks: RoninHooks, progress: React.MutableRefObject<number>): RoninCtl {
  const anims: Animation[] = [];
  const timers: number[] = [];
  let painter: Painter | null = null;
  let disposed = false;
  let cutStarted = false;
  let waitReady: (() => void) | null = null;
  const q = (s: string) => root.querySelector<HTMLElement>(s);
  const anim = (el: Element | null | undefined, frames: Keyframe[], o: KeyframeAnimationOptions) => {
    if (!el) return;
    const a = el.animate(frames, { fill: 'both', ...o });
    anims.push(a);
    return a;
  };
  const later = (ms: number, f: () => void) => timers.push(window.setTimeout(() => !disposed && f(), ms));
  const live = q('.ro-live');

  // 1 · the painting arrives (its blurred stand-in shows until then)
  const img = new Image();
  img.decoding = 'async';
  let begun = false;
  const begin = () => {
    if (begun || disposed) return;
    begun = true;
    // set the GPU painting up (shader, texture) while the blurred stand-in still shows, and
    // only start the clock once that one-time work is behind us
    const canvas = q('.ro-gl') as HTMLCanvasElement | null;
    if (canvas && img.naturalWidth && wind.naturalWidth && back.naturalWidth && Painter.ok()) {
      try {
        painter = new Painter(canvas, img, wind, back, cape);
        root.classList.add('ro-has-gl');
      } catch {
        painter = null;
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => !disposed && entrance()));
  };
  const wind = new Image();
  const back = new Image();
  const cape = new Image();
  const loads = [img, wind, back, cape].map(
    (im, i) =>
      new Promise<void>((res) => {
        im.decoding = 'async';
        im.onload = () => (im.decode ? im.decode().catch(() => {}).then(() => res()) : res());
        im.onerror = () => res();
        im.src = OPENING_IMAGES[i];
      }),
  );
  Promise.all(loads).then(begin);
  later(3000, begin);

  function entrance() {
    const t0 = performance.now();
    const canvas = q('.ro-gl');
    if (painter && canvas) {
      // the focus pull and the slow drift in, on the opening's own clock
      painter.start((now) => {
        const k = (now - t0) / 1000;
        painter!.focus = 1 - outCubic(clamp01(k / 1.5));
        painter!.scale = 1.14 - (1.14 - 1.045) * outCubic(clamp01(k / 3.6));
        if (!cutStarted) progress.current = hooks.isReady() ? 1 : Math.min(0.9, 0.35 + k / 5);
      });
      anim(canvas, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' });
    } else {
      anim(q('.ro-plate--fallback'), [{ opacity: 0, transform: 'scale(1.14)' }, { opacity: 1, transform: 'scale(1.045)' }], { duration: 2400, easing: OUT3 });
    }
    anim(live?.querySelector('.ro-fx'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 550, easing: 'ease-out' });
    anim(live?.querySelector('.ro-leaves'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 500 });
    anim(live?.querySelector('.ro-rule'), [{ opacity: 1 }, { opacity: 1 }], { duration: 1 });
    live?.querySelectorAll('.ro-meta span').forEach((el, i) => anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 400 + i * 100 }));
    live?.querySelectorAll('.intro-word').forEach((el, i) =>
      anim(el, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 650, delay: 700 + i * 70, easing: OUT3 }),
    );
    anim(live?.querySelector('.intro-sig'), [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 1450 });

    // 2 · once the entrance is on screen, start loading the island behind it
    later(1700, hooks.mount3D);

    // 3 · the cut: no earlier than 3 s in, and only once the island is ready (6.5 s at most)
    // (while developing, ?holdintro stops here for a closer look)
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).has('holdintro')) return;
    later(3000, () => {
      if (hooks.isReady()) return cut();
      waitReady = () => requestAnimationFrame(() => requestAnimationFrame(cut));
      later(3500, cut);
    });
  }

  function slowTime(rate: number, ms: number) {
    const from = performance.now();
    const targets = [...(live?.querySelectorAll<HTMLElement>('.ro-leaf, .ro-leaf__sway, .ro-leaf__spin, .ro-bird, .ro-bird svg, .ro-wing, .ro-mist') ?? [])].flatMap((el) => el.getAnimations());
    const step = () => {
      const k = clamp01((performance.now() - from) / ms);
      const r = 1 + (rate - 1) * outCubic(k);
      targets.forEach((a) => a.updatePlaybackRate(r));
      if (painter) painter.rate = r;
      if (k < 1 && !disposed) requestAnimationFrame(step);
    };
    step();
  }

  function cut() {
    if (cutStarted || disposed) return;
    cutStarted = true;
    waitReady = null;
    progress.current = 1;
    // the breath: time slows, the frame closes in on him, light runs down the blade
    slowTime(0.12, 350);
    playCut(); // its scrape starts now, the whoosh lands at +0.62 s and the impact at +0.82 s
    anim(live?.querySelector('.ro-tight'), [{ opacity: 0 }, { opacity: 1 }], { duration: 550, easing: OUT3 });
    anim(q('.ro-glint'), [{ opacity: 1, strokeDashoffset: 0.2 }, { opacity: 1, strokeDashoffset: -1.1 }], { duration: 450, delay: 130, easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)', fill: 'forwards' });
    anim(q('.ro-spark'), [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.4)' }], { duration: 220, delay: 500, fill: 'forwards' });
    // one cut
    const slash = q('.intro-slash-wrap');
    anim(slash, [{ clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], { duration: 160, delay: 620, easing: IN4, fill: 'forwards' });
    anim(slash, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 920, fill: 'forwards' });
    anim(q('.intro-flash'), [{ opacity: 0 }, { opacity: 0.85 }, { opacity: 0 }], { duration: 110, delay: 770, fill: 'forwards' });
    // under the flash: the live painting gives way to its two still halves, which part
    anim(live, [{ visibility: 'visible' }, { visibility: 'hidden' }], { duration: 1, delay: 820, fill: 'forwards' });
    anim(q('.intro-backing'), [{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay: 820, fill: 'forwards' });
    anim(q('.intro-half--top'), [{ visibility: 'visible', transform: 'none' }, { visibility: 'visible', transform: 'translate(-6%, -108%) rotate(-2.5deg)' }], { duration: 950, delay: 820, easing: INOUT3, fill: 'forwards' });
    anim(q('.intro-half--bottom'), [{ visibility: 'visible', transform: 'none' }, { visibility: 'visible', transform: 'translate(6%, 108%) rotate(2.5deg)' }], { duration: 950, delay: 820, easing: INOUT3, fill: 'forwards' });
    anim(document.querySelector('.section-mark'), [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 1, offset: 0.59 }, { opacity: 0 }], { duration: 1930, delay: 870, fill: 'forwards' });
    later(820, () => {
      painter?.dispose();
      painter = null;
      hooks.build();
    });
    later(1850, hooks.done);
  }

  return {
    ready() {
      waitReady?.();
    },
    skip() {
      disposed = true;
      anims.forEach((a) => a.cancel());
      timers.forEach(clearTimeout);
      painter?.dispose();
      const mark = document.querySelector<HTMLElement>('.section-mark');
      if (mark) mark.style.opacity = '0';
    },
    dispose() {
      disposed = true;
      timers.forEach(clearTimeout);
      painter?.dispose();
    },
  };
}
