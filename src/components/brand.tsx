'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import './brand.css';
import { motionOn } from '@/components/motion/motion';

// The DS seal: a hanko pressed in vermilion ink. Rough inked edge, a carved
// inner frame, D over S, and a few voids where the ink didn't take.
export function Monogram({ size = 36, stampKey = 0 }: { size?: number; stampKey?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg key={stampKey} className="monogram" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id={`edge-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* ink voids: high-frequency noise thresholded into small holes */}
        <filter id={`voids-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="9" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  14 0 0 0 -9.4" />
        </filter>
        <mask id={`ink-${id}`}>
          <rect width="100" height="100" fill="#fff" />
          <rect width="100" height="100" filter={`url(#voids-${id})`} opacity="0.7" />
        </mask>
      </defs>
      <g className="monogram__seal" mask={`url(#ink-${id})`}>
        <g filter={`url(#edge-${id})`}>
          <rect x="6" y="6" width="88" height="88" rx="9" fill="#c2402a" />
          <rect x="14" y="14" width="72" height="72" rx="5" fill="none" stroke="#f8e9de" strokeWidth="2.6" />
          <text x="50" y="49" textAnchor="middle" className="monogram__letter">
            D
          </text>
          <text x="50" y="80" textAnchor="middle" className="monogram__letter">
            S
          </text>
        </g>
      </g>
    </svg>
  );
}

// Latin, Devanagari and Katakana: the three worlds the site moves through
const GLYPHS = 'ABCDEFGHKMNRSTVWXYZ0123456789कखगचजतदनपमरसहアイウカキサシタナハマヤラ';

export function ScrambleText({ text, trigger }: { text: string; trigger: number }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);

  useEffect(() => {
    if (trigger === 0) return;
    if (!motionOn()) return;
    const start = performance.now();
    const dur = 650;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const settled = Math.floor(k * text.length);
      setOut(
        text
          .split('')
          .map((ch, i) => (ch === ' ' || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      );
      if (k < 1) raf.current = requestAnimationFrame(step);
      else setOut(text);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [trigger, text]);

  return (
    // the real name for screen readers, as text (a label isn't allowed on a bare span)
    <span className="scramble">
      <span aria-hidden="true">{out}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

// My mark: a screen-printed portrait in the site's inks (made from my own 3D avatar),
// looking toward my name. It presses in like a stamp; hovering re-stamps it.
export function PortraitMark({ size = 36, stampKey = 0 }: { size?: number; stampKey?: number }) {
  return (
    <span key={stampKey} className="portrait-mark" style={{ width: size, height: size }} aria-hidden="true">
      <img src="/brand/portrait-mark.webp" width={size} height={size} alt="" decoding="async" />
    </span>
  );
}

// Mark + name. Hovering anywhere on it re-stamps the mark and scrambles the name.
export function BrandMark({ size = 36, nameClassName }: { size?: number; nameClassName?: string }) {
  const [n, setN] = useState(0);
  const last = useRef(0);
  const again = useCallback(() => {
    const now = performance.now();
    if (now - last.current < 700) return;
    last.current = now;
    setN((v) => v + 1);
  }, []);
  return (
    <span className="brand-mark" onMouseEnter={again} onFocus={again}>
      <PortraitMark size={size} stampKey={n} />
      <span className={nameClassName}>
        <ScrambleText text="Devansh Sureka" trigger={n} />
      </span>
    </span>
  );
}
