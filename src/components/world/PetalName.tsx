'use client';

import { useEffect, useRef } from 'react';

// The name, arriving on the wind: a swirl of maple petals blows in from the lower left,
// settles into the shape of the letters, and dissolves on the breeze as the real type
// appears beneath it. It plays once, when the world has built; with reduced motion the
// name is simply there.

type Petal = {
  sx: number;
  sy: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  tx: number;
  ty: number;
  delay: number;
  dur: number;
  rx: number;
  ry: number;
  spin: number;
  rot: number;
  color: string;
  drift: number;
};

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

// where the type actually is: draw each character where the browser drew it, then sample it
function sampleTitle(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  const c = document.createElement('canvas');
  c.width = Math.ceil(box.width);
  c.height = Math.ceil(box.height);
  // read back on the CPU: a GPU canvas would make the read wait for the 3D island's frames
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const colors: string[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node: Node | null;
  const colorAt: { x0: number; x1: number; color: string }[] = [];
  while ((node = walker.nextNode())) {
    const parent = node.parentElement!;
    const cs = getComputedStyle(parent);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.fillStyle = '#fff';
    g.textBaseline = 'alphabetic';
    const text = node.textContent ?? '';
    for (let i = 0; i < text.length; i++) {
      if (!text[i].trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      const m = g.measureText(text[i]);
      g.fillText(text[i], r.left - box.left, r.top - box.top + m.fontBoundingBoxAscent);
      colorAt.push({ x0: r.left - box.left, x1: r.right - box.left, color: cs.color });
    }
  }
  const data = g.getImageData(0, 0, c.width, c.height).data;
  const fs = parseFloat(getComputedStyle(el).fontSize) || 60;
  const step = Math.max(3, Math.round(fs / 24));
  const pts: { x: number; y: number; color: string }[] = [];
  for (let y = 0; y < c.height; y += step)
    for (let x = 0; x < c.width; x += step)
      if (data[(y * c.width + x) * 4 + 3] > 140) {
        const col = colorAt.find((k) => x >= k.x0 - 1 && x <= k.x1 + 1)?.color ?? '#f3ebdd';
        pts.push({ x: box.left + x, y: box.top + y, color: col });
      }
  colors.length = 0;
  return { pts, step, box };
}

export function PetalName({ run, target }: { run: boolean; target: string }) {
  const done = useRef(false);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;
    if (!run || done.current) return;
    done.current = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const show = () => el.classList.add('is-named');
    if (reduce) return show();

    // wait a frame so the title has its final layout
    let raf = requestAnimationFrame(() => {
      const { pts, step, box } = sampleTitle(el);
      if (!pts.length) return show();
      const max = 650;
      const picked = pts.length > max ? pts.filter((_, i) => i % Math.ceil(pts.length / max) === 0) : pts;
      const canvas = document.createElement('canvas');
      canvas.className = 'petal-name';
      // petals are soft shapes: full resolution would only cost frames
      const d = Math.min(1.25, window.devicePixelRatio || 1);
      canvas.width = innerWidth * d;
      canvas.height = innerHeight * d;
      document.body.appendChild(canvas);
      const g = canvas.getContext('2d')!;
      g.scale(d, d);
      const W = box.width;
      const petals: Petal[] = picked.map((p, i) => {
        const r = Math.random;
        // blown in from the lower left, on a curl
        const sx = -80 - r() * innerWidth * 0.25;
        const sy = innerHeight * (0.55 + r() * 0.5);
        return {
          sx,
          sy,
          c1x: sx + innerWidth * (0.25 + r() * 0.2),
          c1y: sy - innerHeight * (0.25 + r() * 0.3),
          c2x: p.x - 120 + r() * 240,
          c2y: p.y + 80 + r() * 140,
          tx: p.x + (r() - 0.5) * 1.2,
          ty: p.y + (r() - 0.5) * 1.2,
          delay: ((p.x - box.left) / W) * 360 + r() * 170 + (i % 7) * 4,
          dur: 760 + r() * 300,
          rx: step * (0.55 + r() * 0.35),
          ry: step * (0.3 + r() * 0.2),
          spin: (r() - 0.5) * 12,
          rot: r() * Math.PI,
          color: p.color,
          drift: 20 + r() * 60,
        };
      });
      const t0 = performance.now();
      const settle = 360 + 170 + 1060 + 80; // the last petal has landed
      let shown = false;
      const draw = (now: number) => {
        const t = now - t0;
        g.clearRect(0, 0, innerWidth, innerHeight);
        // the type appears as the petals finish settling; then they dissolve on the breeze
        if (!shown && t > settle - 250) {
          shown = true;
          show();
        }
        const gone = Math.min(1, Math.max(0, (t - settle) / 650));
        for (const p of petals) {
          const k = Math.min(1, Math.max(0, (t - p.delay) / p.dur));
          if (k <= 0) continue;
          const e = ease(k);
          let x = bez(p.sx, p.c1x, p.c2x, p.tx, e);
          let y = bez(p.sy, p.c1y, p.c2y, p.ty, e);
          const rot = p.rot + p.spin * (1 - e);
          // shrink as it settles into the letter, then lift away to the left as it dissolves
          let a = Math.min(1, k * 4);
          let s = 1 - e * 0.35;
          if (gone > 0) {
            const q = Math.min(1, gone * (1.2 + (p.tx - box.left) / W));
            x -= q * q * p.drift;
            y -= q * q * p.drift * 0.35;
            a *= 1 - q;
            s *= 1 - q * 0.6;
          }
          if (a <= 0.01) continue;
          const cr = Math.cos(rot) * d;
          const sr = Math.sin(rot) * d;
          g.setTransform(cr, sr, -sr, cr, x * d, y * d);
          g.globalAlpha = a;
          g.fillStyle = p.color;
          g.beginPath();
          g.ellipse(0, 0, p.rx * s, p.ry * s, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.setTransform(d, 0, 0, d, 0, 0);
        g.globalAlpha = 1;
        if (gone < 1) raf = requestAnimationFrame(draw);
        else canvas.remove();
      };
      raf = requestAnimationFrame(draw);
    });
    return () => {
      // interrupted (or React re-running the effect in development): tidy up, allow a fresh start
      cancelAnimationFrame(raf);
      document.querySelector('.petal-name')?.remove();
      done.current = false;
    };
  }, [run, target]);
  return null;
}
