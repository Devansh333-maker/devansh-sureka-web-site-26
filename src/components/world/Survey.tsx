'use client';

import { useEffect, useRef } from 'react';
import { motionOn } from '@/components/motion/motion';

// The paper behind the island is a civil engineer's survey sheet: contour lines of a
// made-up Aravalli hillside, index contours labelled with their height, bench marks,
// a north arrow, a scale bar, grid ticks with Pilani's coordinates and a title block.
// It's drawn once per screen size and drifts a little with the cursor.

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function terrain(x: number, y: number) {
  let f = 0;
  let amp = 1;
  let freq = 1;
  for (let o = 0; o < 4; o++) {
    f += noise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  // a ridge running across the sheet, like the hills behind Jaipur
  return f + Math.exp(-(((y - 3.2 - Math.sin(x * 0.6) * 0.8) / 1.3) ** 2)) * 0.9;
}

function draw(canvas: HTMLCanvasElement, night: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const ink = night ? '226, 220, 240' : '74, 52, 34';

  // sample the terrain on a grid and trace contours (marching squares)
  const step = 9;
  const cols = Math.ceil(W / step) + 2;
  const rows = Math.ceil(H / step) + 2;
  const scale = 1 / 230;
  const field = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) field[j * cols + i] = terrain(i * step * scale, j * step * scale);
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of field) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  const LEVELS = 22;
  const labels: { x: number; y: number; a: number; h: number }[] = [];
  for (let k = 1; k < LEVELS; k++) {
    const iso = lo + ((hi - lo) * k) / LEVELS;
    const index = k % 5 === 0;
    g.strokeStyle = `rgba(${ink}, ${index ? 0.2 : 0.09})`;
    g.lineWidth = index ? 1.1 : 0.7;
    g.beginPath();
    let found = 0;
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i];
        const b = field[j * cols + i + 1];
        const c = field[(j + 1) * cols + i + 1];
        const d = field[(j + 1) * cols + i];
        const code = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
        if (code === 0 || code === 15) continue;
        const x = i * step;
        const y = j * step;
        const lerp = (p: number, q: number) => (iso - p) / (q - p);
        const top = [x + step * lerp(a, b), y];
        const right = [x + step, y + step * lerp(b, c)];
        const bottom = [x + step * lerp(d, c), y + step];
        const left = [x, y + step * lerp(a, d)];
        const segs: number[][][] = [];
        switch (code) {
          case 1: case 14: segs.push([left, bottom]); break;
          case 2: case 13: segs.push([bottom, right]); break;
          case 3: case 12: segs.push([left, right]); break;
          case 4: case 11: segs.push([top, right]); break;
          case 5: segs.push([left, top], [bottom, right]); break;
          case 6: case 9: segs.push([top, bottom]); break;
          case 7: case 8: segs.push([left, top]); break;
          case 10: segs.push([left, bottom], [top, right]); break;
        }
        for (const [p, q] of segs) {
          g.moveTo(p[0], p[1]);
          g.lineTo(q[0], q[1]);
          // an occasional height label on index contours, kept apart from each other
          if (index && found < 3 && hash(i, j + k) > 0.996 && labels.every((l) => Math.hypot(l.x - p[0], l.y - p[1]) > 160)) {
            labels.push({ x: p[0], y: p[1], a: Math.atan2(q[1] - p[1], q[0] - p[0]), h: Math.round(280 + k * 5) });
            found++;
          }
        }
      }
    }
    g.stroke();
  }

  g.font = '500 9px ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const l of labels) {
    g.save();
    g.translate(l.x, l.y);
    let a = l.a;
    if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;
    g.rotate(a);
    const t = `${l.h}`;
    g.fillStyle = night ? 'rgba(23, 26, 51, 0.9)' : 'rgba(243, 235, 221, 0.95)';
    g.fillRect(-12, -6, 24, 12);
    g.fillStyle = `rgba(${ink}, 0.45)`;
    g.fillText(t, 0, 0.5);
    g.restore();
  }

  // grid ticks along the edges, with coordinates near BITS Pilani (28°21′N, 75°35′E)
  g.strokeStyle = `rgba(${ink}, 0.22)`;
  g.fillStyle = `rgba(${ink}, 0.4)`;
  g.lineWidth = 1;
  g.textAlign = 'left';
  const gridX = Math.max(160, W / 8);
  const gridY = Math.max(140, H / 6);
  for (let n = 1, x = gridX; x < W; x += gridX, n++) {
    g.beginPath();
    g.moveTo(x, H - 1);
    g.lineTo(x, H - 9);
    g.stroke();
    g.fillText(`75°${(33 + n).toString().padStart(2, '0')}′E`, x + 4, H - 12);
  }
  for (let n = 1, y = gridY; y < H; y += gridY, n++) {
    g.beginPath();
    g.moveTo(W - 1, y);
    g.lineTo(W - 9, y);
    g.stroke();
    g.textAlign = 'right';
    g.fillText(`28°${(24 - n).toString().padStart(2, '0')}′N`, W - 12, y + 3);
    g.textAlign = 'left';
  }
  // faint grid crosses
  for (let x = gridX; x < W; x += gridX)
    for (let y = gridY; y < H; y += gridY) {
      g.beginPath();
      g.moveTo(x - 4, y);
      g.lineTo(x + 4, y);
      g.moveTo(x, y - 4);
      g.lineTo(x, y + 4);
      g.stroke();
    }
}

export function Survey({ night = false }: { night?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let t = 0;
    const redraw = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => draw(c, night), 120);
    };
    draw(c, night);
    window.addEventListener('resize', redraw);
    return () => {
      window.removeEventListener('resize', redraw);
      window.clearTimeout(t);
    };
  }, [night]);

  // drifts against the cursor, a touch slower than the island, for depth
  useEffect(() => {
    if (!motionOn()) return;
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -14;
      ty = (e.clientY / window.innerHeight - 0.5) * -10;
      // wake the loop if it was resting
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(1.03)`;
      // rest once caught up (so it never runs on a phone, where nothing moves it)
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', move);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrap} className="survey" aria-hidden="true">
      <canvas ref={canvas} className="survey__lines" />
      {/* north arrow */}
      <svg className="survey__north" viewBox="0 0 40 64">
        <path d="M20 4 L29 40 L20 33 L11 40 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M20 4 L20 33 L11 40 Z" fill="currentColor" />
        <text x="20" y="58" textAnchor="middle">N</text>
      </svg>
      {/* scale bar */}
      <svg className="survey__scale" viewBox="0 0 170 30">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={6 + i * 38} y={8} width={38} height={5} fill={i % 2 ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="0.8" />
        ))}
        {[0, 100, 200, 300, 400].map((m, i) => (
          <text key={m} x={6 + i * 38} y={26} textAnchor="middle">
            {m}
          </text>
        ))}
      </svg>
      {/* bench marks */}
      {/* kept clear of the header, the intro text and the places panel */}
      <span className="survey__bm" style={{ left: '36%', top: '91%' }}>
        <i /> BM 312.40
      </span>
      <span className="survey__bm" style={{ left: '62%', top: '91%' }}>
        <i /> BM 341.15
      </span>
      {/* title block, like the corner of a drawing sheet */}
      <div className="survey__title">
        <span>Survey sheet 01 · Pilani, Rajasthan</span>
        <span>Contours at 5 m · Datum MSL</span>
        <span>Drawn D.S. · Checked D.S.</span>
      </div>
    </div>
  );
}
