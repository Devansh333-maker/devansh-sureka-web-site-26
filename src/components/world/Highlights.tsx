'use client';

import { useEffect, useRef, useState } from 'react';
import type { ZoneId } from './zones';
import { useMotion } from '@/components/motion/motion';

// Under the intro: one headline result at a time, cycling slowly. Each is a doorway:
// click it and the island flies to the place where that story lives.

const ITEMS: { fact: string; place: string; id: ZoneId }[] = [
  { fact: '11.38M Google impressions, 57,941 clicks', place: 'The Systems Studio', id: 'studio' },
  { fact: 'First-ever team gold at InterBITS', place: 'The Arena', id: 'arena' },
  { fact: '6.5 MPa bricks from farm waste', place: 'The Workshop', id: 'workshop' },
  { fact: '200+ volunteers across 7 villages', place: 'The Chaupal', id: 'commons' },
  { fact: 'A magazine revived after five years', place: 'The Press', id: 'press' },
];

const EVERY = 4200;

export function Highlights({ onPick, className = '' }: { onPick: (id: ZoneId) => void; className?: string }) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  // with motion off it stays on one result instead of cycling on its own
  const moving = useMotion();

  useEffect(() => {
    if (held || !moving) return;
    const t = window.setTimeout(() => setI((k) => (k + 1) % ITEMS.length), EVERY);
    // restart the little progress line for this item
    const b = bar.current;
    if (b) {
      b.style.transition = 'none';
      b.style.transform = 'scaleX(0)';
      void b.offsetWidth;
      b.style.transition = `transform ${EVERY}ms linear`;
      b.style.transform = 'scaleX(1)';
    }
    return () => window.clearTimeout(t);
  }, [i, held, moving]);

  const it = ITEMS[i];
  return (
    <div className={`highlights ${className}`} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <button type="button" className="highlights__item" key={i} onClick={() => onPick(it.id)}>
        <span className="highlights__index" aria-hidden="true">
          {String(i + 1).padStart(2, '0')}/{String(ITEMS.length).padStart(2, '0')}
        </span>
        <span className="highlights__fact">{it.fact}</span>
        <span className="highlights__place">
          {it.place} <span aria-hidden="true">→</span>
        </span>
      </button>
      <span className="highlights__track" aria-hidden="true">
        <span ref={bar} />
      </span>
    </div>
  );
}
