'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motionOn } from '@/components/motion/motion';
import { ignoreKey } from '@/lib/keys';
import './info-stack.css';

// The explainer series as a story file: the carousel is a tactile stack of its own slides
// (the next ones peek out behind), and beside it the story is told as data: which road
// this slide is, how high it climbs and where, on an altitude profile of all five, so the
// series reads as a ranking, not just seven pictures.

type Road = { rank: number; name: string; country: string; alt: number; where: string; note: string };
const ROADS: Road[] = [
  { rank: 1, name: 'Umling La', country: 'India', alt: 5882, where: 'Ladakh, India', note: 'The highest motorable road in the world, built by the Border Roads Organisation.' },
  { rank: 2, name: 'Uturuncu Road', country: 'Bolivia', alt: 5777, where: 'Andes Mountains, Bolivia', note: 'Built for sulphur mining; rugged, and now used mostly by adventurers and cyclists.' },
  { rank: 3, name: 'Mana Pass (Dungri La)', country: 'India', alt: 5610, where: 'Uttarakhand, India', note: 'Near the India–Tibet border, used mostly by the military; you need a special permit.' },
  { rank: 4, name: 'Marsimik La', country: 'India', alt: 5582, where: 'Ladakh, India', note: 'Remote and unpaved near Pangong Lake, for experienced drivers only.' },
  { rank: 5, name: 'Semo La', country: 'Tibet (China)', alt: 5566, where: 'Tibetan Plateau, China', note: 'Crosses the barren Tibetan plateau on an alternate route to Mount Kailash.' },
];
// slide i shows: 0 cover, 1–5 the roads, 6 the sign-off
const SLIDES = Array.from({ length: 7 }, (_, i) => `/opt/Infographics/Civil/${i + 1}.webp`);
const road = (i: number) => (i >= 1 && i <= 5 ? ROADS[i - 1] : null);
const LO = 5400;
const HI = 5950;

export function InfoStack() {
  const n = SLIDES.length;
  const [at, setAt] = useState(0);
  const [leaving, setLeaving] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      setLeaving({ i: at, dir });
      setAt((a) => (a + dir + n) % n);
      window.setTimeout(() => setLeaving(null), 520);
    },
    [at, n],
  );

  // moves on to the next slide on its own while it's on screen, unless you're pointing at it
  // or reading one full size
  const held = useRef(false);
  // the slide text is only read out to screen readers once you start using the stack,
  // not on every automatic turn
  const [heard, setHeard] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    if (box.current) io.observe(box.current);
    const t = window.setInterval(() => {
      if (visible && !held.current && !open && motionOn()) go(1);
    }, 2500);
    return () => {
      window.clearInterval(t);
      io.disconnect();
    };
  }, [go, open]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === 'Escape') setOpen(false);
        if (ignoreKey(e)) return;
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
        return;
      }
      if (ignoreKey(e)) return;
      const r = box.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, open]);

  // the full-size view: the page behind leaves the Tab order, focus goes to its close button,
  // and comes back to where it was when it closes
  const view = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const behind = [...document.body.children].filter((el) => !el.contains(view.current) && !el.hasAttribute('inert'));
    behind.forEach((el) => el.setAttribute('inert', ''));
    view.current?.querySelector<HTMLElement>('.is-view__close')?.focus();
    return () => {
      behind.forEach((el) => el.removeAttribute('inert'));
      requestAnimationFrame(() => before?.focus?.());
    };
  }, [open]);

  const r = road(at);
  const label = at === 0 ? 'Cover' : at === n - 1 ? 'Sign-off' : `#${r!.rank} · ${r!.name}`;

  return (
    <div
      ref={box}
      className="is"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onPointerDown={() => setHeard(true)}
      onFocus={() => {
        held.current = true;
        setHeard(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) held.current = false;
      }}
    >
      <div className="is__panel">
        <p className="is__file">
          SERIES <b>01</b> / 01
        </p>
        <h3 className="is__title">World’s top 5 highest motorable roads</h3>
        <p className="is__lede">An Instagram carousel for the Civil Engineering Association, BITS Pilani: one road per slide, from the highest down.</p>

        {/* what this slide is about */}
        <div className="is__now" aria-live={heard ? 'polite' : 'off'}>
          <span className="is__now-k">{String(at + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
          <strong>{label}</strong>
          {r ? (
            <p>
              <b>{r.alt.toLocaleString('en-IN')} m</b> · {r.where}
              <br />
              {r.note}
            </p>
          ) : (
            <p>{at === 0 ? 'The cover: five roads, ranked by how high they climb.' : 'The last slide asks readers for their favourite road.'}</p>
          )}
        </div>

        {/* the five, as an altitude profile */}
        <div className="is__alt" aria-hidden="true">
          {ROADS.map((x) => {
            const h = ((x.alt - LO) / (HI - LO)) * 100;
            const on = r?.rank === x.rank;
            return (
              <button key={x.rank} type="button" tabIndex={-1} className={`is__peak ${on ? 'is-on' : ''}`} onClick={() => setAt(x.rank)} style={{ ['--h' as string]: `${h}%` }}>
                <i />
                <span>{x.alt.toLocaleString('en-IN')}</span>
                <small>#{x.rank}</small>
              </button>
            );
          })}
        </div>

        <dl className="is__meta">
          <div>
            <dt>Slides</dt>
            <dd>07</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>4:5 carousel</dd>
          </div>
          <div>
            <dt>For</dt>
            <dd>CEA, BITS Pilani</dd>
          </div>
        </dl>

        <div className="is__ctrl">
          <button type="button" className="is__arrow" onClick={() => go(-1)} aria-label="Previous slide">
            ←
          </button>
          <button type="button" className="is__arrow" onClick={() => go(1)} aria-label="Next slide">
            →
          </button>
          <button type="button" className="is__open" onClick={() => setOpen(true)}>
            Open full size <i>↗</i>
          </button>
        </div>
      </div>

      <div
        className="is__stage"
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerUp={(e) => {
          if (drag.current === null) return;
          const dx = e.clientX - drag.current;
          drag.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          else setOpen(true);
        }}
      >
        <span className="is__stage-k">SEQUENCE / CAROUSEL</span>
        <div className="is__stack">
          {SLIDES.map((src, i) => {
            const k = (i - at + n) % n; // 0 = on top, 1, 2 … behind
            const out = leaving?.i === i;
            if (k > 3 && !out) return null;
            return (
              <img
                key={src}
                src={`/_next/image?url=${encodeURIComponent(src)}&w=750&q=78`}
                alt={i === at ? `Slide ${i + 1}: ${label}` : ''}
                draggable={false}
                className={`is__card ${out ? (leaving!.dir > 0 ? 'is-out' : 'is-back') : ''}`}
                style={{
                  ['--k' as string]: out ? 0 : k,
                  zIndex: out ? 20 : 10 - k,
                }}
              />
            );
          })}
          <span className="is__badge">{String(n).padStart(2, '0')} SLIDES</span>
        </div>
        <span className="is__stage-f">STACK = COMPLETE SEQUENCE</span>
      </div>

      {open &&
        createPortal(
          <div ref={view} className="is-view" role="dialog" aria-modal="true" aria-label={label} onClick={() => setOpen(false)}>
            <img src={SLIDES[at]} alt={label} onClick={(e) => e.stopPropagation()} />
            <div className="is-view__bar" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => go(-1)} aria-label="Previous slide">
                ←
              </button>
              <span>
                {at + 1} / {n}
              </span>
              <button type="button" onClick={() => go(1)} aria-label="Next slide">
                →
              </button>
            </div>
            <button type="button" className="is-view__close" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
