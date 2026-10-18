'use client';

import { useEffect, useRef, useState } from 'react';
import { ignoreKey } from '@/lib/keys';
import { Lightbox } from './Lightbox';

// w must be one of the image optimiser's widths (640, 750, 828, 1080, 1200, 1920… or 256, 384)
const sized = (p: string, w: number) => `/_next/image?url=${encodeURIComponent(p)}&w=${w}&q=80`;

// a slide deck, one slide at a time: ← → (or the buttons, or a thumbnail), click to see it full screen
export function Deck({ title, pages }: { title: string; pages: { src: string; w: number; h: number }[] }) {
  const n = pages.length;
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const go = (d: number) => setAt((a) => Math.max(0, Math.min(n - 1, a + d)));

  // the arrow keys turn the slides while the deck is on screen
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (open || ignoreKey(e)) return;
      const r = box.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  // keep the current thumbnail in view, scrolling only the strip (never the page)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const s = strip.current;
    const t = s?.children[at] as HTMLElement | undefined;
    if (s && t) s.scrollTo({ left: t.offsetLeft - s.offsetLeft - (s.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
  }, [at]);

  const p = pages[at];
  return (
    <div ref={box} className="dk">
      <div className="dk__stage" style={{ aspectRatio: `${p.w} / ${p.h}` }}>
        <button type="button" className="dk__slide" onClick={() => setOpen(true)} aria-label={`Open slide ${at + 1} full screen`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={p.src} src={sized(p.src, 1920)} alt={`${title}, slide ${at + 1} of ${n}`} />
        </button>
      </div>
      <div className="dk__bar">
        <button type="button" onClick={() => go(-1)} disabled={at === 0} aria-label="Previous slide">
          ←
        </button>
        <span>
          {String(at + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
        <button type="button" onClick={() => go(1)} disabled={at === n - 1} aria-label="Next slide">
          →
        </button>
      </div>
      <div ref={strip} className="dk__strip" aria-label="All slides">
        {pages.map((q, i) => (
          <button key={q.src} type="button" aria-current={i === at ? 'true' : undefined} className={i === at ? 'is-on' : ''} onClick={() => setAt(i)} aria-label={`Slide ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sized(q.src, 256)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {/* printed, every slide comes out, one under the other */}
      <div className="dk__print" aria-hidden="true">
        {pages.map((q) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={q.src} src={q.src} alt="" loading="lazy" />
        ))}
      </div>
      {open && <Lightbox items={pages.map((q, i) => ({ src: q.src, alt: `${title}, slide ${i + 1} of ${n}` }))} at={at} onAt={setAt} onClose={() => setOpen(false)} />}
    </div>
  );
}

// the same page, as a clean PDF: the browser's print dialog, with "Save as PDF"
export function PrintButton() {
  return (
    <button
      type="button"
      className="st__print"
      onClick={async () => {
        // the full-size slides for the PDF only load now, so wait for them before printing
        const imgs = [...document.querySelectorAll<HTMLImageElement>('.dk__print img')];
        imgs.forEach((im) => (im.loading = 'eager'));
        await Promise.all(imgs.map((im) => (im.complete ? null : new Promise((r) => ((im.onload = r), (im.onerror = r))))));
        window.print();
      }}
    >
      Save as PDF ↓
    </button>
  );
}
