'use client';

import { useEffect, useRef } from 'react';

// a hairline across the top that fills as you read
export function ReadProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const k = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${k})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      ref={bar}
      aria-hidden="true"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: '#b8352a', transformOrigin: '0 50%', transform: 'scaleX(0)', zIndex: 120 }}
    />
  );
}
