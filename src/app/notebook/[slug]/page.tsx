import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlacePage } from '@/components/place/kit';
import { formatDate, notes, sortedNotes, type Block } from '@/content/notebook';
import { Monogram } from '@/components/brand';
import { ReadProgress } from '@/components/place/ReadProgress';
import { ThenNow } from '@/components/place/ThenNow';

type Params = { slug: string };

// only the pages built from the files; any other address is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const note = notes.find((n) => n.slug === slug);
  // shared, a post shows its own cover when it's a .jpg or .png (LinkedIn can't show .webp),
  // otherwise the Notebook's card
  const card = note?.cover && /\.(jpe?g|png)$/i.test(note.cover) ? note.cover : '/og/notebook.jpg';
  return note ? shareMeta(note.title, note.summary, card) : {};
}

function renderBlock(b: Block, i: number) {
  if (typeof b === 'string') return <p key={i}>{b}</p>;
  if ('compare' in b) return <ThenNow key={i} />;
  if ('h' in b) return <h2 key={i}>{b.h}</h2>;
  if ('quote' in b)
    return (
      <blockquote key={i}>
        <p>{b.quote}</p>
        {b.by && <cite>{b.by}</cite>}
      </blockquote>
    );
  return (
    <figure key={i}>
      <Image src={b.img} alt={b.alt} width={1400} height={900} sizes="(max-width: 800px) 100vw, 42rem" style={{ width: '100%', height: 'auto' }} />
      {b.caption && <figcaption>{b.caption}</figcaption>}
    </figure>
  );
}

export default async function NotePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const note = notes.find((n) => n.slug === slug);
  if (!note) notFound();

  const i = sortedNotes.findIndex((n) => n.slug === slug);
  const older = sortedNotes[i + 1];
  const newer = sortedNotes[i - 1];

  return (
    <PlacePage place="notebook">
      <ReadProgress />
      <article className="note">
        <header className="note__head p-wrap">
          {/* the way back on the left, the next read on the right, as at the bottom */}
          <div className="note__top">
            <Link href="/notebook" className="note__back">
              ← The Notebook
            </Link>
            {(newer || older) && (
              <nav className="note__top-nav" aria-label="More notes">
                {newer && <Link href={`/notebook/${newer.slug}`}>← {newer.title}</Link>}
                {older && <Link href={`/notebook/${older.slug}`}>{older.title} →</Link>}
              </nav>
            )}
          </div>
          <p className="p-kicker">
            <span className="p-kicker__idx">{note.kind}</span> {formatDate(note.date)}
          </p>
          <h1 className="note__title">{note.title}</h1>
          <p className="note__summary">{note.summary}</p>
        </header>
        <div className="note__body">{note.body.map(renderBlock)}</div>
        <footer className="note__foot">
          <Monogram size={40} />
          <nav aria-label="Next and previous notes">
            {newer && <Link href={`/notebook/${newer.slug}`}>← {newer.title}</Link>}
            {older && <Link href={`/notebook/${older.slug}`}>{older.title} →</Link>}
          </nav>
        </footer>
      </article>
    </PlacePage>
  );
}
