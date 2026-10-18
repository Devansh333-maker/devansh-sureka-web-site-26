'use client';

import { useEffect, useRef } from 'react';

// A surveyor's crosshair for a civil engineer's site: four fine ticks around an open
// centre with a vermilion point, and a tiny readout of where you are, like a total
// station's display. Over anything clickable the crosshair turns and opens, and the
// readout says what a click will do. It is drawn with a halo, never blended, so it stays
// visible on paper, photos and night skies alike. Mouse-only; off with reduced motion.
export function Cursor() {
  const cross = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    let x = -100;
    let y = -100;
    let lx = x;
    let ly = y;
    let raf = 0;
    let shown = false;
    let text = '';
    const verb = (el: HTMLElement) => {
      if (el.closest('video, [aria-label*="play" i]')) return 'play';
      if (el.closest('a[href^="mailto:"]')) return 'write';
      if (el.closest('a[target="_blank"]')) return 'open ↗';
      if (el.closest('a')) return 'go';
      if (el.closest('[role="tab"], [role="option"], select')) return 'select';
      return 'click';
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        lx = x;
        ly = y;
        root.classList.add('cursor-in');
      }
      const t = e.target as HTMLElement | null;
      const hot = t?.closest('a, button, [role="button"], [role="tab"], [role="option"], summary, label, select, video') as HTMLElement | null;
      const typing = !!t?.closest('input, textarea, [contenteditable="true"]');
      cross.current?.classList.toggle('is-hot', !!hot);
      label.current?.classList.toggle('is-hot', !!hot);
      root.classList.toggle('cursor-text', typing);
      // the readout: what a click does, or the position (in "metres" of the survey grid)
      const next = hot ? verb(hot) : `E ${(x / 10).toFixed(1)}  N ${((window.innerHeight - y) / 10).toFixed(1)}`;
      if (next !== text && label.current) {
        text = next;
        label.current.textContent = next;
      }
      // wake the loop if it was resting
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      shown = false;
      root.classList.remove('cursor-in');
    };
    const down = () => cross.current?.classList.add('is-down');
    const up = () => cross.current?.classList.remove('is-down');
    const tick = () => {
      // the crosshair is exact; the readout trails a touch behind
      lx += (x - lx) * 0.25;
      ly += (y - ly) * 0.25;
      if (cross.current) cross.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (label.current) label.current.style.transform = `translate3d(${lx + 16}px, ${ly + 14}px, 0)`;
      // rest once the readout has caught up; the next move wakes it
      raf = Math.abs(x - lx) + Math.abs(y - ly) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(tick);
    return () => {
      root.classList.remove('has-cursor', 'cursor-in', 'cursor-text');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={cross} className="cursor-cross" aria-hidden="true">
        {/* the ticks turn inside their own frame; turning the outer one would swing its
            on-screen position round too and throw the crosshair off the page */}
        <span className="cursor-cross__in">
          <i className="cursor-cross__t" />
          <i className="cursor-cross__r" />
          <i className="cursor-cross__b" />
          <i className="cursor-cross__l" />
          <b />
        </span>
      </div>
      <span ref={label} className="cursor-read" aria-hidden="true" />
    </>
  );
}
