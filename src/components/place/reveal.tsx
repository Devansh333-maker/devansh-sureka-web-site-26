'use client';

import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { motionOn } from '@/components/motion/motion';

// Fades content up the first time it scrolls into view. Without JS, or with
// reduced motion, it is simply visible.
export function Reveal({ children, className = '', as = 'div' }: { children: ReactNode; className?: string; as?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'idle' | 'waiting' | 'in'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!motionOn()) {
      setState('in');
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      setState('in');
      return;
    }
    setState('waiting');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState('in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // tabbing onto something inside shows it at once (the browser may scroll it only just into
  // view, short of where it would fade in, which left a focused link invisible)
  return createElement(as, { ref, onFocus: () => setState('in'), className: `${className} reveal ${state === 'waiting' ? 'is-waiting' : ''} ${state === 'in' ? 'is-in' : ''}` }, children);
}
