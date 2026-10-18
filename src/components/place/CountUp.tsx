'use client';

import { useEffect, useRef, useState } from 'react';
import { motionOn } from '@/components/motion/motion';

// Numbers count up from zero the first time they scroll into view: 6,001 · 11–2 ·
// 6.5 MPa · ₹28.5L+. Words and symbols stay put; only the digits run. Without JS or
// with reduced motion, the final value simply shows.

const NUM = /\d[\d,]*(?:\.\d+)?/g;

function render(text: string, k: number) {
  return text.replace(NUM, (m) => {
    const decimals = (m.split('.')[1] ?? '').length;
    const target = Number(m.replace(/,/g, ''));
    const v = target * k;
    const s = decimals ? v.toFixed(decimals) : Math.round(v).toString();
    // keep thousands separators where the original had them
    return m.includes(',') ? Number(s).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
  });
}

export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !NUM.test(value)) return;
    NUM.lastIndex = 0;
    if (!motionOn()) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          setShown(render(value, eased));
          if (t < 1) raf = requestAnimationFrame(step);
          else setShown(value);
        };
        setShown(render(value, 0));
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    // screen readers get the final value as plain text (a label isn't allowed on a bare span)
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
