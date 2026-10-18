import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';
import { PlacePage } from '@/components/place/kit';
import { ReadProgress } from '@/components/place/ReadProgress';
import { Deck, PrintButton } from '@/components/place/StudyParts';
import { archive, getStudy, studies, type StudyBlock } from '@/content/studies';
import { shareMeta } from '@/lib/share';
import '@/components/place/study.css';

// Every study, report and deck read the same way: what it is and the three things to take
// away, then the work itself, on screen. "Save as PDF" prints this same page, so the
// downloads match too.

type Params = { slug: string };

// only the pages built from the files; any other address is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return studies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const s = getStudy((await params).slug);
  return s ? shareMeta(s.title, s.summary, '/og/studio.jpg') : {};
}

// **bold** inside a line
function rich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>));
}

function block(b: StudyBlock, i: number) {
  if ('h' in b) return <h2 key={i}>{b.h}</h2>;
  if ('p' in b) return <p key={i}>{rich(b.p)}</p>;
  if ('list' in b)
    return (
      <ul key={i}>
        {b.list.map((li, j) => (
          <li key={j}>{rich(li)}</li>
        ))}
      </ul>
    );
  if ('table' in b)
    return (
      <div key={i} className="st-table">
        <table>
          <thead>
            <tr>
              {b.table.head.map((h, j) => (
                <th key={j}>{rich(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map((r, j) => (
              <tr key={j}>
                {r.map((c, k) => (
                  <td key={k}>{rich(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <figure key={i}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={encodeURI(b.img)} alt={b.alt} loading="lazy" />
      {b.caption && <figcaption>{b.caption}</figcaption>}
    </figure>
  );
}

export default async function StudyPage({ params }: { params: Promise<Params> }) {
  const s = getStudy((await params).slug);
  if (!s) notFound();
  const i = archive.findIndex((a) => a.slug === s.slug);
  const prev = i > 0 ? archive[i - 1] : undefined;
  const next = i >= 0 && i < archive.length - 1 ? archive[i + 1] : undefined;
  const count = s.pages?.length;
  const home = s.place === 'workshop' ? { href: '/workshop#hydrology', name: 'The Workshop' } : { href: '/studio#archive', name: 'The Systems Studio' };

  return (
    <PlacePage place={s.place ?? 'studio'}>
      <ReadProgress />
      <article className="st">
        <header className="st__head">
          <div className="st__top">
            <Link href={home.href} className="st__back">
              ← {home.name}
            </Link>
            {(prev || next) && (
              <nav className="st__step" aria-label="Previous and next study">
                {prev ? (
                  <Link href={`/studies/${prev.slug}`} title={prev.title} aria-label={`Previous study: ${prev.title}`}>
                    ←
                  </Link>
                ) : (
                  <span aria-hidden="true">←</span>
                )}
                <small>
                  {i + 1} / {archive.length}
                </small>
                {next ? (
                  <Link href={`/studies/${next.slug}`} title={next.title} aria-label={`Next study: ${next.title}`}>
                    →
                  </Link>
                ) : (
                  <span aria-hidden="true">→</span>
                )}
              </nav>
            )}
          </div>
          <p className="st__kind">
            {s.kind}
            {s.year && <span> · {s.year}</span>}
            {count && (
              <span>
                {' '}
                · {count} {s.mode === 'deck' ? 'slides' : 'pages'}
              </span>
            )}
          </p>
          <h1 className="st__title">{s.title}</h1>
          {s.context && <p className="st__context">{s.context}</p>}
          <p className="st__summary">{s.summary}</p>
          <ol className="st__points">
            {s.points.map((p, j) => (
              <li key={j}>
                <span>{String(j + 1).padStart(2, '0')}</span>
                {rich(p)}
              </li>
            ))}
          </ol>
          <div className="st__actions">
            <PrintButton />
          </div>
        </header>

        {s.mode === 'deck' && s.pages && <Deck title={s.title} pages={s.pages} />}
        {s.body && s.body.length > 0 && <div className="st__body">{s.body.map(block)}</div>}
        {s.mode === 'pages' && s.pages && (
          <div className="st__pages">
            {s.pages.map((p, j) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.src} src={p.src} alt={`${s.title}, page ${j + 1}`} width={p.w} height={p.h} loading={j < 2 ? 'eager' : 'lazy'} />
            ))}
          </div>
        )}

        {(prev || next) && (
          <nav className="st__nav" aria-label="More studies">
            {prev ? (
              <Link href={`/studies/${prev.slug}`}>
                <small>← Previous study</small>
                {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/studies/${next.slug}`} className="is-next">
                <small>Next study →</small>
                {next.title}
              </Link>
            )}
          </nav>
        )}
      </article>
    </PlacePage>
  );
}
