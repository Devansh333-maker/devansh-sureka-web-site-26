'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ignoreKey } from '@/lib/keys';
import './magazine.css';

// L.I.T.E., the magazine itself, read on the site like the printed copy: the cover sits as
// a book on the table; open it and the pages turn on their spine, two at a time, with the
// paper curling over as it goes. On a phone it's one page at a time.

const N = 68; // pages
const DIR = '/opt/lite';
const page = (n: number) => `${DIR}/p${String(n).padStart(2, '0')}.webp`;
const thumb = (n: number) => `${DIR}/t${String(n).padStart(2, '0')}.webp`;
// spreads: 0 is the cover alone on the right; spread k shows pages 2k (left) and 2k+1 (right)
const LAST = Math.floor(N / 2);
const leftOf = (s: number) => (s === 0 ? 0 : 2 * s);
const rightOf = (s: number) => (2 * s + 1 <= N ? 2 * s + 1 : 0);
const TURN = 760;

function Page({ n, eager }: { n: number; eager?: boolean }) {
  if (!n) return <span className="fb__blank" />;
  return <img src={page(n)} alt={`Page ${n}`} draggable={false} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

function Book({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(0);
  const [turn, setTurn] = useState<{ dir: 1 | -1; from: number } | null>(null);
  const [single, setSingle] = useState(false);
  const [one, setOne] = useState(1); // phone: the page on screen
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const [grid, setGrid] = useState(false);
  const [zoom, setZoom] = useState(false);

  // while the magazine is open, the little walking guide steps aside
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('is-reading');
    const was = root.style.overflow;
    root.style.overflow = 'hidden'; // the page behind stays put while you read
    // keyboard focus moves into the reader, and Tab can't wander into the page behind it
    // (everything beside it: the page, and the skip link and sound button outside the page)
    const theatre = box.current?.closest('.fb-theatre');
    const behind = [...document.body.children].filter((el) => !el.contains(theatre ?? null) && !el.hasAttribute('inert'));
    behind.forEach((el) => el.setAttribute('inert', ''));
    theatre?.querySelector<HTMLElement>('.fb__tool')?.focus();
    return () => {
      root.classList.remove('is-reading');
      root.style.overflow = was;
      behind.forEach((el) => el.removeAttribute('inert'));
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const f = () => setSingle(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (single) {
        setOne((p) => Math.min(N, Math.max(1, p + dir)));
        return;
      }
      if (turn) return;
      const to = s + dir;
      if (to < 0 || to > LAST) return;
      setTurn({ dir, from: s });
      setS(to);
      window.setTimeout(() => setTurn(null), TURN);
    },
    [s, turn, single],
  );
  const jump = (n: number) => {
    if (single) setOne(n);
    else setS(Math.floor(n / 2));
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!ignoreKey(e)) {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (zoom) setZoom(false);
        else if (grid) setGrid(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, zoom, grid, onClose]);

  // while a page turns, the halves underneath already show where it's going; the leaf
  // carries the page being turned on its front and the one revealed on its back
  const from = turn ? turn.from : s;
  const underL = turn && turn.dir < 0 ? leftOf(s) : leftOf(from);
  const underR = turn && turn.dir > 0 ? rightOf(s) : rightOf(from);
  const leafFront = turn ? (turn.dir > 0 ? rightOf(from) : leftOf(from)) : 0;
  const leafBack = turn ? (turn.dir > 0 ? leftOf(s) : rightOf(s)) : 0;
  const label = single ? `${one}` : s === 0 ? 'Cover' : rightOf(s) ? `${leftOf(s)}–${rightOf(s)}` : `${leftOf(s)}`;
  const at = single ? one : Math.max(1, leftOf(s));
  // what to fetch ahead
  const ahead = single ? [one + 1, one + 2] : [leftOf(s + 1), rightOf(s + 1), leftOf(s - 1), rightOf(s - 1)];

  const full = () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div ref={box} className={`fb ${single ? 'is-single' : ''}`}>
      <div className="fb__top">
        <p className="fb__title">
          L.I.T.E. <span>2025 issue</span>
        </p>
        <div className="fb__tools">
          <button type="button" className="fb__tool" onClick={() => setGrid(true)} aria-label="All pages">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
              <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" />
              <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" />
              <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" />
            </svg>
            <span>Pages</span>
          </button>
          <button type="button" className={`fb__tool ${zoom ? 'is-on' : ''}`} onClick={() => setZoom((z) => !z)} aria-label={zoom ? 'Zoom out' : 'Zoom in'}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5" />
              <path d={zoom ? 'M6.5 8.5h4M13 13l4 4' : 'M6.5 8.5h4M8.5 6.5v4M13 13l4 4'} />
            </svg>
            <span>{zoom ? 'Zoom out' : 'Zoom'}</span>
          </button>
          <button type="button" className="fb__tool" onClick={full} aria-label="Full screen">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5" />
            </svg>
          </button>
          <button type="button" className="fb__tool" onClick={onClose} aria-label="Close the magazine">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`fb__stage ${zoom ? 'is-zoom' : ''}`}>
        <button type="button" className="fb__arrow fb__arrow--prev" onClick={() => go(-1)} aria-label="Previous page" disabled={single ? one <= 1 : s <= 0}>
          ←
        </button>
        <div
          className="fb__desk"
          onDoubleClick={() => setZoom((z) => !z)}
          onPointerDown={(e) => (drag.current = zoom ? null : e.clientX)}
          onPointerUp={(e) => {
            if (drag.current === null) return;
            const dx = e.clientX - drag.current;
            drag.current = null;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            else {
              const r = e.currentTarget.getBoundingClientRect();
              go(e.clientX > r.left + r.width / 2 ? 1 : -1);
            }
          }}
        >
          {single ? (
            <div className="fb__one">
              <img key={one} src={page(one)} alt={`Page ${one}`} draggable={false} className="fb__onepage" />
            </div>
          ) : (
            <div
              className={`fb__book ${s === 0 && !turn ? 'is-closed' : ''} ${s === LAST && !rightOf(s) && !turn ? 'is-end' : ''}`}
              style={{ ['--done' as string]: (Math.max(0, leftOf(s)) / N).toFixed(3) }}
            >
              <div className="fb__half fb__half--l">{underL ? <Page n={underL} eager /> : null}</div>
              <div className="fb__half fb__half--r">{underR ? <Page n={underR} eager /> : null}</div>
              {turn && (
                <div className={`fb__leaf ${turn.dir > 0 ? 'is-next' : 'is-prev'}`} style={{ animationDuration: `${TURN}ms` }}>
                  <div className="fb__face fb__face--front">
                    <Page n={leafFront} eager />
                    <i className="fb__shade" />
                  </div>
                  <div className="fb__face fb__face--back">
                    <Page n={leafBack} eager />
                    <i className="fb__shade" />
                  </div>
                </div>
              )}
              <i className="fb__spine" aria-hidden="true" />
            </div>
          )}
          <div className="fb__prefetch" aria-hidden="true">
            {ahead.filter((n) => n > 0 && n <= N).map((n) => (
              <img key={n} src={page(n)} alt="" />
            ))}
          </div>
        </div>
        <button type="button" className="fb__arrow fb__arrow--next" onClick={() => go(1)} aria-label="Next page" disabled={single ? one >= N : s >= LAST}>
          →
        </button>
      </div>

      <div className="fb__foot">
        <span className="fb__where" aria-live="polite">
          {label} <i>/ {N}</i>
        </span>
        <input
          className="fb__scrub"
          type="range"
          min={1}
          max={N}
          value={at}
          onChange={(e) => jump(Number(e.target.value))}
          aria-label="Go to page"
          style={{ ['--p' as string]: `${((at - 1) / (N - 1)) * 100}%` }}
        />
        <span className="fb__hint">
          {zoom ? 'Scroll to look around · double-click to zoom out' : at === 1 && !single ? 'Click the cover to open it' : 'Click a page or use ← → · double-click to zoom'}
        </span>
      </div>

      {grid && (
        <div className="fb__grid" role="dialog" aria-label="All pages" onClick={() => setGrid(false)}>
          <div className="fb__grid-in" onClick={(e) => e.stopPropagation()}>
            <div className="fb__grid-head">
              <p>All {N} pages</p>
              <button type="button" className="fb__tool" onClick={() => setGrid(false)} aria-label="Close">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>
            <div className="fb__grid-list">
              {Array.from({ length: N }, (_, i) => i + 1).map((n) => {
                const on = single ? n === one : n === leftOf(s) || n === rightOf(s) || (s === 0 && n === 1);
                return (
                  <button
                    key={n}
                    type="button"
                    className={`fb__thumb ${on ? 'is-on' : ''}`}
                    onClick={() => {
                      jump(n);
                      setGrid(false);
                    }}
                    aria-label={`Go to page ${n}`}
                  >
                    <img src={thumb(n)} alt="" loading="lazy" />
                    <span>{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Magazine() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <div className="mag">
      <button ref={opener} type="button" className="mag__closed" onClick={() => setOpen(true)}>
        <span className="mag__book">
          <img src={page(1)} alt="Cover of L.I.T.E., the magazine of the Department of Civil Engineering, BITS Pilani" />
          <i className="mag__spine" aria-hidden="true" />
          <i className="mag__pages" aria-hidden="true" />
        </span>
        <span className="mag__cta">
          <span className="mag__kicker">L.I.T.E. · 2025 issue · {N} pages</span>
          <strong>Read the magazine</strong>
          <span>Legacy, Infrastructure, Technology, Excellence. Opens full screen: turn the pages like the printed copy.</span>
          <span className="mag__go">
            Open it <i>→</i>
          </span>
        </span>
      </button>
      {/* the reader opens over the whole page, outside it, so nothing on the page can box it in */}
      {open &&
        createPortal(
          <div className="fb-theatre" role="dialog" aria-modal="true" aria-label="L.I.T.E. magazine">
            <Book
              onClose={() => {
                setOpen(false);
                // once the reader has gone and the page is usable again
                requestAnimationFrame(() => opener.current?.focus());
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
