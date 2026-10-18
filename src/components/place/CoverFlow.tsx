'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motionOn } from '@/components/motion/motion';
import { ignoreKey } from '@/lib/keys';
import { Lightbox } from './Lightbox';
import './cover-flow.css';

// The wall as a cover flow: one design in front, large and lit, the rest fanned behind it on
// either side, turned a little toward the middle. Every card carries its name. It moves on
// its own until you touch it; arrows, a drag or a click on a side card bring another to the
// front, and clicking the front card opens it full size (where ← and → keep going).

export type FlowItem = { src: string; alt: string; w: number; h: number };
// a card-sized copy from the image optimiser (the full file only loads when one is opened)
const sized = (p: string, w: number) => `/_next/image?url=${encodeURIComponent(p)}&w=${w}&q=75`;
const VISIBLE = 3; // cards shown on each side of the front one

// "Realpolitik, event poster" -> title "Realpolitik", kind "Event poster"
function parts(alt: string) {
  const i = alt.indexOf(', ');
  if (i < 0) return { title: alt, kind: 'Design' };
  const kind = alt.slice(i + 2);
  return { title: alt.slice(0, i), kind: kind[0].toUpperCase() + kind.slice(1) };
}
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};
const DUST = Array.from({ length: 34 }, (_, i) => ({
  x: rnd(i) * 100,
  y: rnd(i + 40) * 100,
  s: 1 + rnd(i + 80) * 2.2,
  d: 2 + rnd(i + 120) * 4,
  delay: -rnd(i + 160) * 6,
}));

export function CoverFlow({ items }: { items: FlowItem[] }) {
  const n = items.length;
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [w, setW] = useState(1200);
  const wrap = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  // the caption is only read out to screen readers once you start using the carousel,
  // not on every automatic turn
  const [heard, setHeard] = useState(false);
  const drag = useRef<{ x: number; moved: number } | null>(null);

  const go = useCallback((d: number) => setAt((a) => (a + d + n) % n), [n]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // moves on its own while you're not touching it and it's on screen
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (wrap.current) io.observe(wrap.current);
    const t = window.setInterval(() => {
      if (visible && !held.current && open === null && motionOn()) go(1);
    }, 2300);
    return () => {
      window.clearInterval(t);
      io.disconnect();
    };
  }, [go, open]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (open !== null) return; // the full-size view has its own keys
      if (ignoreKey(e)) return;
      const r = wrap.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, open]);

  // the front card's width follows the stage; side cards step out from it
  const cardW = Math.max(190, Math.min(300, w * 0.26));
  const step1 = cardW * 0.78;
  const stepN = cardW * 0.42;

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, moved: 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (Math.abs(dx) > 60) {
      go(dx < 0 ? 1 : -1);
      drag.current = { x: e.clientX, moved: d.moved };
    }
  };
  const onUp = () => {
    window.setTimeout(() => (drag.current = null), 0);
  };

  const { title, kind } = parts(items[at].alt);

  return (
    <>
      <div
        ref={wrap}
        className="cf"
        onPointerEnter={() => (held.current = true)}
        onPointerLeave={() => {
          held.current = false;
          drag.current = null;
        }}
        onFocus={() => {
          held.current = true;
          setHeard(true);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) held.current = false;
        }}
        onPointerDown={(e) => {
          setHeard(true);
          onDown(e);
        }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ ['--card' as string]: `${cardW}px` }}
      >
        <div className="cf__dust" aria-hidden="true">
          {DUST.map((p, i) => (
            <i key={i} style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }} />
          ))}
        </div>
        <div className="cf__stage">
          {items.map((it, i) => {
            // the shortest way round from the front card to this one
            let k = i - at;
            if (k > n / 2) k -= n;
            if (k < -n / 2) k += n;
            const a = Math.abs(k);
            const hidden = a > VISIBLE;
            const x = k === 0 ? 0 : Math.sign(k) * (step1 + (a - 1) * stepN);
            const s = 1 - Math.min(a, VISIBLE + 1) * 0.12;
            const p = parts(it.alt);
            return (
              <button
                key={it.src}
                type="button"
                className={`cf__card ${k === 0 ? 'is-front' : ''}`}
                aria-label={`${k === 0 ? 'Open' : 'Show'} ${p.title} ${p.kind}`}
                tabIndex={hidden ? -1 : 0}
                style={{
                  transform: `translateX(${x}px) scale(${s}) rotateY(${-Math.sign(k) * Math.min(a, 2) * 9}deg)`,
                  zIndex: 20 - a,
                  opacity: hidden ? 0 : 1 - Math.max(0, a - 1) * 0.22,
                  filter: k === 0 ? 'none' : `brightness(${0.78 - a * 0.1})`,
                  pointerEvents: hidden ? 'none' : undefined,
                }}
                onClick={() => {
                  if (drag.current && drag.current.moved > 8) return;
                  if (k === 0) setOpen(i);
                  else go(k);
                }}
              >
                {/* every frame is the same size; the design sits whole inside it, on a soft blur of itself */}
                <span className="cf__img" style={{ ['--bg-img' as string]: `url("${sized(it.src, 64)}")` }}>
                  <img src={sized(it.src, 640)} alt="" loading="lazy" decoding="async" draggable={false} />
                </span>
                <span className="cf__cap">
                  <b>{p.title}</b> <small>{p.kind}</small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="cf__bar">
          <button type="button" className="cf__arrow" onClick={() => go(-1)} aria-label="Previous design">
            ←
          </button>
          <p className="cf__now" aria-live={heard ? 'polite' : 'off'}>
            <span>
              {String(at + 1).padStart(2, '0')} <i>/ {String(n).padStart(2, '0')}</i>
            </span>
            <em>
              {title} · {kind}
            </em>
          </p>
          <button type="button" className="cf__arrow" onClick={() => go(1)} aria-label="Next design">
            →
          </button>
        </div>
      </div>
      {open !== null && (
        <Lightbox
          items={items.map((x) => ({ src: x.src, alt: x.alt, caption: `${parts(x.alt).title} · ${parts(x.alt).kind}` }))}
          at={open}
          onAt={(i) => {
            setOpen(i);
            setAt(i); // the wall behind follows, so closing leaves you on the same design
          }}
          onClose={() => {
            setOpen(null);
            // after the viewer has handed focus back, move it to the design now in front
            window.setTimeout(() => wrap.current?.querySelector<HTMLElement>('.cf__card.is-front')?.focus(), 60);
          }}
        />
      )}
    </>
  );
}
