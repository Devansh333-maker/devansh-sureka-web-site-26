'use client';

import { useEffect, useRef } from 'react';
import { motionOn } from '@/components/motion/motion';

// The old oak the island floats under. The painting is split into its trunk and its
// crown: the crown sways about the fork where the great branch leaves the trunk (so the
// far leaves travel furthest, as on a real branch), sunlight flickers through it by day,
// it leans a little with the cursor for depth, at night it's moonlit with fireflies about it, and now and then (or when you sweep the
// mouse across) a gust runs through it and shakes a few leaves loose.

// where the crown pivots, in the painting's own pixels (1852 × 849)
const IMG_W = 1852;
const IMG_H = 849;
const FORK = { x: 1640, y: 210 };
// the crown image carries extra mirrored foliage above and to the right of the painting, kept
// just off-screen, so the swaying crown never pulls a strip of bare paper into view

export function OakTree() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // the painting is drawn "cover", anchored top-right: map the fork onto the screen
    const place = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.max(w / IMG_W, h / IMG_H);
      el.style.setProperty('--s', s.toFixed(5));
      el.style.setProperty('--ox', `${(w - IMG_W * s + FORK.x * s).toFixed(1)}px`);
      el.style.setProperty('--oy', `${(FORK.y * s).toFixed(1)}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);

    let lastGust = 0;
    const gust = () => {
      const now = performance.now();
      if (!motionOn() || now - lastGust < 6000) return;
      lastGust = now;
      el.classList.remove('is-gust');
      void el.offsetWidth; // restart the animations
      el.classList.add('is-gust');
      window.setTimeout(() => el.classList.remove('is-gust'), 3200);
    };

    // depth: the crown leans further than the trunk; a fast sweep of the mouse is a gust
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let lx = 0;
    let lt = 0;
    const tick = () => {
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? window.requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf && motionOn()) raf = window.requestAnimationFrame(tick);
      const now = performance.now();
      const speed = Math.abs(e.clientX - lx) / Math.max(1, now - lt);
      lx = e.clientX;
      lt = now;
      if (speed > 3) gust();
    };
    window.addEventListener('pointermove', move, { passive: true });

    // and the wind picks up on its own every so often
    let timer = 0;
    const breeze = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === 'visible') gust();
        breeze();
      }, 16000 + Math.random() * 14000);
    };
    breeze();

    return () => {
      ro.disconnect();
      window.removeEventListener('pointermove', move);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={root} className="oak" aria-hidden="true">
      <div className="oak__trunk" />
      {/* night: the moon behind the crown, its light on the leaves, fireflies in the dark */}
      <div className="oak__moon" />
      <div className="oak__crown">
        <div className="oak__sway">
          <div className="oak__gust">
            <div className="oak__canopy" />
          </div>
        </div>
      </div>
      <div className="oak__moonlight" />
      <div className="oak__fireflies">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="oak__light">
        <i />
        <i />
        <i />
      </div>
      <div className="oak__leaves">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} className={i < 4 ? 'is-drift' : 'is-shaken'} />
        ))}
      </div>
    </div>
  );
}
