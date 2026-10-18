'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Block, Note } from '@/content/notebook';
import { ThenNow } from './ThenNow';
import './note-accordion.css';

// The notebook as a list you can read without leaving it: each entry opens in place, like
// a page lifted out of the book, and folds away again. Every entry still has its own page.

function block(b: Block, i: number) {
  if (typeof b === 'string')
    // a line in brackets is an editor's note, set apart from the story
    return /^\(.*\)$/.test(b.trim()) ? (
      <p key={i} className="na__aside">
        {b.trim().slice(1, -1)}
      </p>
    ) : (
      <p key={i}>{b}</p>
    );
  if ('compare' in b) return <ThenNow key={i} />;
  if ('h' in b) return <h3 key={i}>{b.h}</h3>;
  if ('quote' in b)
    return (
      <blockquote key={i}>
        <p>{b.quote}</p>
        {b.by && <cite>{b.by}</cite>}
      </blockquote>
    );
  return (
    <figure key={i}>
      <Image src={b.img} alt={b.alt} width={1200} height={800} sizes="(max-width: 800px) 100vw, 40rem" style={{ width: '100%', height: 'auto' }} />
      {b.caption && <figcaption>{b.caption}</figcaption>}
    </figure>
  );
}
const words = (n: Note) =>
  n.body.reduce<number>((s, b) => s + (typeof b === 'string' ? b.split(/\s+/).length : 'quote' in b ? b.quote.split(/\s+/).length : 0), 0);

export function NoteAccordion({ notes, dates, from }: { notes: Note[]; dates: string[]; from: (string | null)[] }) {
  const [open, setOpen] = useState<string | null>(null);
  // an entry's page is only built the first time it's opened (so closed entries don't
  // download their pictures), and stays built so it can fold away smoothly
  const [seen, setSeen] = useState<string[]>([]);
  return (
    <ol
      className="na"
      onKeyDown={(e) => {
        // ↑ and ↓ move between the entries' titles (Enter opens one)
        const dir = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        const at = (e.target as HTMLElement).closest('.na__row');
        if (!dir || !at) return;
        const rows = [...e.currentTarget.querySelectorAll<HTMLElement>('.na__row')];
        const next = rows[rows.indexOf(at as HTMLElement) + dir];
        if (!next) return;
        e.preventDefault();
        next.focus();
      }}
    >
      {notes.map((n, i) => {
        const on = open === n.slug;
        const mins = Math.max(1, Math.round(words(n) / 200));
        return (
          <li key={n.slug} className={`na__item ${on ? 'is-open' : ''}`}>
            <button
              type="button"
              className="na__row"
              aria-expanded={on}
              aria-controls={`na-${n.slug}`}
              onClick={() => {
                setOpen(on ? null : n.slug);
                if (!seen.includes(n.slug)) setSeen([...seen, n.slug]);
              }}
            >
              <span className="na__n">{String(notes.length - i).padStart(2, '0')}</span>
              <span className="na__main">
                <span className="na__title">{n.title}</span>
                <span className="na__summary">{n.summary}</span>
              </span>
              <span className="na__meta">
                <span>{n.kind}</span>
                <span>{dates[i]}</span>
                <span>
                  {mins} min read{from[i] ? ` · from ${from[i]}` : ''}
                </span>
              </span>
              <span className="na__toggle" aria-hidden="true">
                <span>{on ? 'Close' : 'Read'}</span>
                <i />
              </span>
            </button>
            {/* a closed entry is out of the Tab order and hidden from screen readers */}
            <div className="na__panel" id={`na-${n.slug}`} role="region" aria-label={n.title} inert={!on}>
              <div className="na__inner">
                {seen.includes(n.slug) && (
                  <article className="na__page">
                    {n.cover && (
                      <div className="na__cover">
                        <Image src={n.cover} alt="" fill sizes="(max-width: 800px) 100vw, 46rem" style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                    <div className="na__body">{n.body.map(block)}</div>
                    <footer className="na__foot">
                      <Link href={`/notebook/${n.slug}`}>Open as its own page ↗</Link>
                      <button type="button" onClick={() => setOpen(null)}>
                        Fold it away ↑
                      </button>
                    </footer>
                  </article>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
