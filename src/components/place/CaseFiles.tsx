'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CountUp } from './CountUp';

// Selected work as case files: a swipeable row of cards. Opening one lays out the
// whole story: the problem, what I did, and what came of it, in numbers.

export type CaseFile = {
  id: string;
  tag: string;
  title: string;
  problem: string;
  approach: string;
  detail?: string; // more on what I did
  img?: { src: string; alt: string };
  outcome: { value: string; label: string }[];
  href: string;
  place: string;
  tone: string; // card colour
};

// the window sits outside the page, so it carries the page's colours and type with it
const VARS = ['--bg', '--bg-2', '--ink', '--muted', '--rule', '--accent', '--display', '--display-weight', '--mono', '--sans'];
function themeVars(from: Element | null) {
  if (!from) return {};
  const cs = getComputedStyle(from);
  return Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(v)]).filter(([, x]) => x)) as React.CSSProperties;
}

export function CaseFiles({ cases }: { cases: CaseFile[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<CaseFile | null>(null);
  const [at, setAt] = useState(0);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => {
      const card = el.firstElementChild as HTMLElement | null;
      const w = card ? card.offsetWidth + 16 : 1;
      setAt(Math.round(el.scrollLeft / w));
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // focus moves into the file, and Tab can't wander to the page behind it
    const behind = [...document.body.children].filter((el) => !el.contains(sheet.current) && !el.hasAttribute('inert'));
    behind.forEach((el) => el.setAttribute('inert', ''));
    sheet.current?.querySelector<HTMLElement>('.case-sheet__close')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      behind.forEach((el) => el.removeAttribute('inert'));
      before?.focus?.();
    };
  }, [open]);

  const nudge = (dir: number) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  return (
    <div className="cases">
      <div className="cases__bar">
        <p className="cases__count">
          <span>{String(Math.min(at + 1, cases.length)).padStart(2, '0')}</span> / {String(cases.length).padStart(2, '0')}
        </p>
        <div className="cases__arrows">
          <button type="button" onClick={() => nudge(-1)} aria-label="Previous case file" disabled={at === 0}>
            ←
          </button>
          <button type="button" onClick={() => nudge(1)} aria-label="Next case file" disabled={at >= cases.length - 1}>
            →
          </button>
        </div>
      </div>
      <div className="cases__track" ref={track} role="list">
        {cases.map((c, i) => (
          <div key={c.id} className="case" role="listitem" style={{ ['--case' as string]: c.tone }}>
            <p className="case__file">
              Case file {String(i + 1).padStart(2, '0')} <span>· {c.tag}</span>
            </p>
            <h3 className="case__title">{c.title}</h3>
            <p className="case__problem">{c.problem}</p>
            <div className="case__nums">
              {c.outcome.slice(0, 2).map((o) => (
                <div key={o.label}>
                  <strong>
                    <CountUp value={o.value} />
                  </strong>
                  <span>{o.label}</span>
                </div>
              ))}
            </div>
            <button type="button" className="case__open" onClick={() => setOpen(c)}>
              Open the file <span aria-hidden="true">↗</span>
            </button>
          </div>
        ))}
      </div>
      <p className="cases__hint">Swipe, scroll sideways, or use the arrows · open a file for the full story</p>

      {/* over the whole page, outside it, so the page behind can be made inert */}
      {open &&
        createPortal(
          <div ref={sheet} className="case-sheet" role="dialog" aria-modal="true" aria-label={open.title} onMouseDown={() => setOpen(null)}>
            <div className="case-sheet__card" onMouseDown={(e) => e.stopPropagation()} style={{ ...themeVars(track.current), ['--case' as string]: open.tone }}>
              <button type="button" className="case-sheet__close" onClick={() => setOpen(null)} aria-label="Close">
                ×
              </button>
              <p className="case__file">
                Case file · <span>{open.tag}</span>
              </p>
              <h3 className="case-sheet__title">{open.title}</h3>
              {open.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="case-sheet__img" src={encodeURI(open.img.src)} alt={open.img.alt} />
              )}
              <div className="case-sheet__steps">
                <div className="case-sheet__step">
                  <p className="case-sheet__label">01 · The problem</p>
                  <p>{open.problem}</p>
                </div>
                <div className="case-sheet__step">
                  <p className="case-sheet__label">02 · What I did</p>
                  <p>{open.approach}</p>
                  {open.detail && <p className="case-sheet__more">{open.detail}</p>}
                </div>
                <div className="case-sheet__step case-sheet__step--wide">
                  <p className="case-sheet__label">03 · What came of it</p>
                  <div className="case-sheet__nums">
                    {open.outcome.map((o) => (
                      <div key={o.label}>
                        <strong>
                          <CountUp value={o.value} duration={1000} />
                        </strong>
                        <span>{o.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Link href={open.href} className="case-sheet__go" onClick={() => setOpen(null)}>
                The full story, in the {open.place} →
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
