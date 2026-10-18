'use client';

import { useEffect, useRef, useState } from 'react';
import { Lightbox, type LightItem } from './Lightbox';
import './designs.css';

// Small ways of showing design work, each opening into the full-size viewer:
// a grid of posts, a showcase, a pair of posters that spreads out, an Instagram carousel, and long sheets.

export type Design = { src: string; alt: string; w: number; h: number; caption?: string; note?: string };
const sized = (p: string, w: number) => `/_next/image?url=${encodeURIComponent(p)}&w=${w}&q=78`;
const light = (d: Design[]): LightItem[] => d.map((x) => ({ src: x.src, alt: x.alt, caption: x.caption ?? x.alt }));

// a set of posts side by side
export function DesignGrid({ items, label, pair = false }: { items: Design[]; label: string; pair?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul className={`dg ${pair ? 'dg--pair' : ''}`} aria-label={label}>
        {items.map((d, i) => (
          <li key={d.src}>
            <button type="button" onClick={() => setOpen(i)} aria-label={`Open ${d.alt}`}>
              <img src={sized(d.src, 640)} alt="" width={d.w} height={d.h} loading="lazy" decoding="async" />
            </button>
            {d.caption && <span>{d.caption}</span>}
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox items={light(items)} at={open} onAt={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

// two posters in a pile, the newer one on top; one click spreads them side by side, whole
export function PosterPair({ items }: { items: [Design, Design] }) {
  const [spread, setSpread] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={`pp ${spread ? 'is-spread' : ''}`}>
      <div className="pp__stage">
        {items.map((d, i) => (
          <button
            key={d.src}
            type="button"
            className={`pp__card pp__card--${i}`}
            style={{ aspectRatio: `${d.w} / ${d.h}` }}
            onClick={() => (spread ? setOpen(i) : setSpread(true))}
            aria-label={spread ? `Open ${d.alt}` : 'Spread the posters out'}
          >
            <img src={sized(d.src, 750)} alt={d.alt} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      <button type="button" className="pp__toggle" onClick={() => setSpread((s) => !s)}>
        {spread ? '↺ Stack them again' : '⇆ See both side by side'}
      </button>
      {open !== null && <Lightbox items={light(items)} at={open} onAt={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

// an Instagram carousel as it feels on the phone: slides in a row, the next one peeking in,
// swiped (or ← →) one at a time. "Join the slides" closes the gaps, and they become the one
// long picture they were designed as.
export function InstaCarousel({ slides, handle, title, note, ratio }: { slides: string[]; handle: string; title: string; note: string; ratio: string }) {
  const n = slides.length;
  const [at, setAt] = useState(0);
  const [whole, setWhole] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ prev: false, next: true });
  const items = slides.map((s, i) => ({ src: s, alt: `${title}, slide ${i + 1} of ${n}` }));
  // where the rail is: the slide nearest its left edge (the last one once it can't scroll further)
  const read = () => {
    const r = rail.current;
    if (!r) return;
    const max = r.scrollWidth - r.clientWidth;
    const lefts = [...r.children].map((c) => (c as HTMLElement).offsetLeft - r.offsetLeft);
    let i = lefts.reduce((best, l, j) => (Math.abs(l - r.scrollLeft) < Math.abs(lefts[best] - r.scrollLeft) ? j : best), 0);
    if (r.scrollLeft >= max - 2) i = n - 1;
    setAt(i);
    setEdge({ prev: r.scrollLeft > 2, next: r.scrollLeft < max - 2 });
  };
  useEffect(() => {
    read();
    const ro = new ResizeObserver(read);
    if (rail.current) ro.observe(rail.current);
    return () => ro.disconnect();
  }, [whole]);
  const to = (i: number) => {
    const r = rail.current;
    const el = r?.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement | undefined;
    if (r && el) r.scrollTo({ left: Math.min(el.offsetLeft - r.offsetLeft, r.scrollWidth - r.clientWidth), behavior: 'smooth' });
  };
  return (
    <figure className={`ic ${whole ? 'is-whole' : ''}`}>
      <figcaption className="ic__cap">
        <span className="ic__handle">
          <i aria-hidden="true" />
          {handle}
        </span>
        <strong>{title}</strong>
        <span>{note}</span>
      </figcaption>
      <div
        ref={rail}
        className="ic__rail"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${title}: ${n} slides. Use the arrow keys to move.`}
        style={{ ['--ratio' as string]: ratio, ['--n' as string]: n }}
        onScroll={read}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          // the keys belong to this carousel (nothing else on the page turns with them)
          e.preventDefault();
          if (whole) return;
          to(e.key === 'ArrowRight' ? at + 1 : at - 1);
        }}
      >
        {slides.map((s, i) => (
          // named by its picture ("Open" + the slide's description); the counter is decoration
          <button key={s} type="button" className="ic__slide" onClick={() => setOpen(i)}>
            <span className="sr-only">Open </span>
            <img src={sized(s, 750)} alt={items[i].alt} draggable={false} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
            {!whole && (
              <span className="ic__num" aria-hidden="true">
                {i + 1}/{n}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="ic__bar">
        {!whole && (edge.prev || edge.next) && (
          <>
            <button type="button" className="ic__arrow" onClick={() => to(at - 1)} disabled={!edge.prev} aria-label="Previous slide">
              ←
            </button>
            <span className="ic__dots" aria-hidden="true">
              {slides.map((s, i) => (
                <i key={s} className={i === at ? 'is-on' : ''} />
              ))}
            </span>
            <button type="button" className="ic__arrow" onClick={() => to(at + 1)} disabled={!edge.next} aria-label="Next slide">
              →
            </button>
          </>
        )}
        <button type="button" className="ic__join" onClick={() => setWhole((w) => !w)} aria-pressed={whole}>
          {whole ? '⇤ Back to slides' : '⇥ Join the slides'}
        </button>
      </div>
      {open !== null && <Lightbox items={items} at={open} onAt={setOpen} onClose={() => setOpen(null)} />}
    </figure>
  );
}

// a series of posts as a showcase: the lead post large, the rest beside it, each with the idea behind it
export function Showcase({ items, label }: { items: Design[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul className="sc" aria-label={label}>
        {items.map((d, i) => (
          <li key={d.src} className={i === 0 ? 'is-lead' : ''}>
            <button type="button" onClick={() => setOpen(i)} aria-label={`Open ${d.alt}`}>
              <img src={sized(d.src, i === 0 ? 1080 : 640)} alt="" width={d.w} height={d.h} loading="lazy" decoding="async" />
            </button>
            <p>
              <b>{d.caption}</b>
              {d.note}
            </p>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox items={light(items)} at={open} onAt={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

// a long presentation sheet: a tall preview that opens into the whole thing, scrolled
export function DesignSheets({ sheets }: { sheets: (Design & { title: string; note: string })[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul className="ds">
        {sheets.map((s, i) => (
          <li key={s.src}>
            <button type="button" onClick={() => setOpen(i)}>
              <span className="ds__img">
                <img src={sized(s.src, 640)} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="ds__cap">
                <b>{s.title}</b>
                <small>{s.note}</small>
                <em>Open the full sheet ↗</em>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox items={sheets.map((s) => ({ src: s.src, alt: s.alt, caption: s.title }))} at={open} onAt={setOpen} onClose={() => setOpen(null)} tall />}
    </>
  );
}
