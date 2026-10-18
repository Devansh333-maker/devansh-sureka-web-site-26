'use client';

import { useRef, useState } from 'react';
import './then-now.css';

// This site, a year apart: the same page from the first version and from this one, one on
// top of the other. Drag the line (or use the arrow keys) to wipe from then to now.

const DIR = '/opt/then';
const PAIRS = [
  { key: 'home', then: 'Home', now: 'Home', ratio: 1440 / 900 },
  { key: 'design', then: 'Design', now: 'The Press', ratio: 1440 / 900 },
  { key: '3d', then: '3D Modeling', now: 'The Workshop', ratio: 1440 / 900 },
  { key: 'research', then: 'Strategic Research', now: 'The Systems Studio', ratio: 1440 / 900 },
  { key: 'experience', then: 'Experience', now: 'About', ratio: 1440 / 900 },
  { key: 'blog', then: 'Blog', now: 'The Notebook', ratio: 1440 / 900 },
  { key: 'home-phone', then: 'On a phone', now: 'On a phone', ratio: 390 / 844 },
];

export function ThenNow() {
  const [at, setAt] = useState(0);
  const [x, setX] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const p = PAIRS[at];

  const moveTo = (clientX: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setX(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <figure className="tn">
      <div
        className="tn__tabs"
        role="tablist"
        aria-label="Which page"
        onKeyDown={(e) => {
          // ← and → step through the pages, like tabs anywhere else
          const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          const next = (at + dir + PAIRS.length) % PAIRS.length;
          setAt(next);
          setX(50);
          (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
        }}
      >
        {PAIRS.map((q, i) => (
          <button
            key={q.key}
            type="button"
            role="tab"
            aria-selected={i === at}
            tabIndex={i === at ? 0 : -1}
            className={i === at ? 'is-on' : ''}
            onClick={() => {
              setAt(i);
              setX(50);
            }}
          >
            {q.now}
          </button>
        ))}
      </div>

      <div
        ref={frame}
        className={`tn__frame ${p.ratio < 1 ? 'is-phone' : ''}`}
        style={{ aspectRatio: String(p.ratio) }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          moveTo(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* now underneath, then on top, cut at the line */}
        <img className="tn__img" src={`${DIR}/new-${p.key}.webp`} alt={`This site now: ${p.now}`} draggable={false} />
        <div className="tn__then" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
          <img className="tn__img" src={`${DIR}/old-${p.key}.webp`} alt={`The first version: ${p.then}`} draggable={false} />
        </div>
        <span className="tn__tag tn__tag--then" style={{ opacity: x > 12 ? 1 : 0 }}>
          A year ago · {p.then}
        </span>
        <span className="tn__tag tn__tag--now" style={{ opacity: x < 88 ? 1 : 0 }}>
          Now · {p.now}
        </span>
        <div className="tn__line" style={{ left: `${x}%` }} aria-hidden="true">
          <i>
            <svg viewBox="0 0 24 24">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
            </svg>
          </i>
        </div>
        <input
          className="tn__range"
          type="range"
          min={0}
          max={100}
          value={Math.round(x)}
          onChange={(e) => setX(Number(e.target.value))}
          aria-label="Wipe between the first version and now"
        />
      </div>
      <figcaption>Drag the line to wipe between the first version of this site and this one.</figcaption>
    </figure>
  );
}
