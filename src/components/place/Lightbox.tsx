'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './lightbox.css';

// One design, full size, over the whole page. ← and → (or the buttons) move to the next one
// without closing it, Esc or a click outside closes it. `tall` is for long sheets: the
// picture fills the width and you scroll down it.

export type LightItem = { src: string; alt: string; caption?: string };

export function Lightbox({ items, at, onAt, onClose, tall = false }: { items: LightItem[]; at: number; onAt: (i: number) => void; onClose: () => void; tall?: boolean }) {
  const n = items.length;
  const it = items[at];
  const box = useRef<HTMLDivElement>(null);
  const go = (d: number) => onAt((at + d + n) % n);

  // its keys win over the page's own (carousels behind it shouldn't turn as well)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      // search (Ctrl K) opened over it: its keys are search's now
      if (box.current?.hasAttribute('inert')) return;
      // Tab goes round the viewer's own buttons rather than out to the browser
      if (e.key === 'Tab') {
        const f = [...(box.current?.querySelectorAll<HTMLElement>('button, [tabindex="0"]') ?? [])];
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (f.length && (e.shiftKey ? i <= 0 : i === f.length - 1)) {
          e.preventDefault();
          f[e.shiftKey ? f.length - 1 : 0].focus();
        }
        return;
      }
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && n > 1) go(1);
      else if (e.key === 'ArrowLeft' && n > 1) go(-1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  });

  // the page behind stays put and out of the Tab order; focus comes back where it was
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const was = root.style.overflow;
    root.style.overflow = 'hidden';
    const behind = [...document.body.children].filter((el) => !el.contains(box.current) && !el.hasAttribute('inert'));
    behind.forEach((el) => el.setAttribute('inert', ''));
    // a long sheet takes focus itself, so ↑ ↓ and Page Down scroll it
    box.current?.querySelector<HTMLElement>(tall ? '.lb__scroll' : '.lb__close')?.focus();
    return () => {
      root.style.overflow = was;
      behind.forEach((el) => el.removeAttribute('inert'));
      requestAnimationFrame(() => before?.focus?.());
    };
  }, []);

  // a long sheet starts from its top each time
  useEffect(() => {
    if (tall) box.current?.querySelector('.lb__scroll')?.scrollTo(0, 0);
  }, [at, tall]);

  return createPortal(
    <div ref={box} className={`lb ${tall ? 'is-tall' : ''}`} role="dialog" aria-modal="true" aria-label={it.alt} onClick={onClose}>
      <div className="lb__scroll" tabIndex={tall ? 0 : undefined}>
        <img key={it.src} src={encodeURI(it.src)} alt={it.alt} onClick={(e) => e.stopPropagation()} />
      </div>
      <div className="lb__bar" onClick={(e) => e.stopPropagation()}>
        {n > 1 && (
          <button type="button" className="lb__btn" onClick={() => go(-1)} aria-label="Previous">
            ←
          </button>
        )}
        <p>
          {n > 1 && (
            <span>
              {String(at + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </span>
          )}
          {it.caption ?? it.alt}
        </p>
        {n > 1 && (
          <button type="button" className="lb__btn" onClick={() => go(1)} aria-label="Next">
            →
          </button>
        )}
      </div>
      <button type="button" className="lb__close" onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>,
    document.body,
  );
}
