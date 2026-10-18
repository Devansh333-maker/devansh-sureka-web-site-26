'use client';

import { useEffect, useRef } from 'react';
import { ARCH_READY } from './cine';
import { motionOn } from '@/components/motion/motion';

// The place, for real, through a jharokha arch: the photo drifts slowly behind warm
// light and dust and leans against the cursor.
export function CineArch({ src, tag }: { src: string; tag: string }) {
  const arch = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const dust = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = arch.current;
    if (!el) return;
    // arriving through the portal: the portal is the reveal, so the arch just sits there
    const arriving = !!window.__archArrival;
    if (arriving) {
      el.classList.add('is-arrived');
      const aside = el.closest<HTMLElement>('.p-hero__aside');
      if (aside) aside.style.animation = 'none';
    }
    const report = () => window.dispatchEvent(new CustomEvent(ARCH_READY, { detail: el.getBoundingClientRect() }));
    const ready = window.requestAnimationFrame(report);

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    // dust motes drifting up through the light
    const cv = dust.current;
    const g = cv?.getContext('2d');
    const motes = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.4, s: Math.random() * 0.25 + 0.05, a: Math.random() * 0.6 + 0.2, p: Math.random() * 6 }));
    const tick = (t: number) => {
      raf = window.requestAnimationFrame(tick);
      // follow the cursor, but only touch the page while there's still distance to cover
      // (the filled watermark is large, and repainting it every frame for nothing is waste)
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.0008) {
        x += (tx - x) * 0.06;
        y += (ty - y) * 0.06;
        if (layer.current) layer.current.style.translate = `${(-x * 22).toFixed(2)}px ${(-y * 16).toFixed(2)}px`;
      }
      if (!cv || !g) return;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== w) cv.width = w;
      if (cv.height !== h) cv.height = h;
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#ffe2b0';
      for (const m of motes) {
        m.y -= (m.s / Math.max(h, 1)) * 6;
        m.x += Math.sin(t / 1600 + m.p) * 0.0003;
        if (m.y < -0.02) m.y = 1.02;
        g.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(t / 900 + m.p));
        g.beginPath();
        g.arc(m.x * w - x * 30, m.y * h - y * 30, m.r, 0, 7);
        g.fill();
      }
    };
    // only run while the arch is on screen and motion is on (the site's pause switch,
    // which also covers the system's reduced-motion setting)
    let visible = false;
    const sync = () => {
      window.cancelAnimationFrame(raf);
      if (visible && motionOn()) raf = window.requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('motionchange', sync);
    return () => {
      window.cancelAnimationFrame(ready);
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('motionchange', sync);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={arch} className="p-arch" aria-hidden="true">
      <div ref={layer} className="p-arch__img" style={{ backgroundImage: `url(${src})` }} />
      <div className="p-arch__glow" />
      <canvas ref={dust} className="p-arch__dust" />
      <div className="p-arch__shade" />
      <span className="p-arch__tag">{tag}</span>
    </div>
  );
}
