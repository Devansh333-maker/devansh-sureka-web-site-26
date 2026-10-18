'use client';

import { useEffect, useRef } from 'react';
import { motionOn } from '@/components/motion/motion';

// A quiet particle field behind each place's hero: motes in the place's accent colour
// drifting upward, faintly linked when they pass close, parting around the cursor.
export function HeroParticles() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let color = '194, 64, 42';
    const N = 70;
    const ps = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, v: 0.02 + Math.random() * 0.05, ox: 0, oy: 0 }));
    let mx = -9999;
    let my = -9999;
    // resizing a canvas wipes it, so a paused field needs drawing again afterwards
    let redraw = () => {};

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      // the place's accent, read from the page's theme
      const raw = getComputedStyle(c).getPropertyValue('--accent').trim();
      const m = raw.match(/^#([0-9a-f]{6})$/i);
      if (m) {
        const n = parseInt(m[1], 16);
        color = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      }
      redraw();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const onTheme = () => window.setTimeout(size, 60);
    window.addEventListener('themechange', onTheme);
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    window.addEventListener('pointermove', move, { passive: true });

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let frozen = !motionOn();
    let drawnOnce = false;
    // no frames at all while I'm off-screen or paused; coming back starts them again
    const resting = () => !visible || (frozen && drawnOnce);
    const wake = () => {
      if (raf || resting()) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      wake();
    });
    io.observe(c);
    const onMotion = () => {
      frozen = !motionOn();
      wake();
    };
    window.addEventListener('motionchange', onMotion);
    redraw = () => {
      drawnOnce = false;
      wake();
    };
    const tick = (now: number) => {
      const dt = frozen ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (resting()) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
      drawnOnce = true;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const pts = ps.map((p) => {
        p.y -= p.v * dt;
        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        }
        let x = p.x * W + Math.sin(now / 2400 + p.r * 9) * 8;
        let y = p.y * H;
        // part around the cursor
        const dx = x - mx;
        const dy = y - my;
        const d = Math.hypot(dx, dy);
        const push = d < 120 ? (1 - d / 120) * 26 : 0;
        p.ox += ((d ? (dx / d) * push : 0) - p.ox) * 0.12;
        p.oy += ((d ? (dy / d) * push : 0) - p.oy) * 0.12;
        x += p.ox;
        y += p.oy;
        return { x, y, r: p.r };
      });
      g.lineWidth = 0.6;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 90) {
            g.strokeStyle = `rgba(${color}, ${0.12 * (1 - d / 90)})`;
            g.beginPath();
            g.moveTo(pts[i].x, pts[i].y);
            g.lineTo(pts[j].x, pts[j].y);
            g.stroke();
          }
        }
      }
      g.fillStyle = `rgba(${color}, 0.42)`;
      for (const p of pts) {
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('themechange', onTheme);
      window.removeEventListener('motionchange', onMotion);
    };
  }, []);

  return <canvas ref={canvas} className="p-hero__particles" aria-hidden="true" />;
}
