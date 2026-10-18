import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { zones, type ZoneId } from '@/components/world/zones';
import { CountUp } from './CountUp';
import { HeroParticles } from './HeroParticles';
import { Reveal } from './reveal';
import { Emblem } from './emblems';
import { CineArch } from './CineArch';
import { CINE } from './cine';

// Building blocks for the inside of each place. Each page sets `data-place`
// and the theme (colour, pattern, display face) comes from place.css.

export function PlacePage({ place, children }: { place: ZoneId | 'about' | 'work'; children: ReactNode }) {
  return (
    <div className="place" data-place={place} id="main">
      {children}
    </div>
  );
}

export function Hero({
  place,
  kicker,
  title,
  lede,
  aside,
  meta,
  badge,
}: {
  place?: ZoneId;
  kicker?: string;
  title: ReactNode;
  lede: ReactNode;
  aside?: ReactNode;
  meta?: { label: string; value: string }[];
  badge?: ReactNode;
}) {
  const zone = place ? zones.find((z) => z.id === place) : undefined;
  const cine = zone ? CINE[zone.id] : undefined;
  return (
    <section className="p-hero">
      <div className="p-hero__pattern" aria-hidden="true" />
      <HeroParticles />
      <div className="p-wrap p-hero__grid">
        <div className="p-hero__text">
          {/* the place's emblem and its name in its own script, as one lockup */}
          {zone && (
            <div className="p-hero__mark p-rise">
              <Emblem place={zone.id} className="p-hero__emblem" />
              {zone.native && (
                <p className="p-native" lang={zone.native.lang}>
                  <span className="p-native__word">{zone.native.text}</span>
                  <span className="p-native__gloss" lang="en">
                    {zone.native.gloss}
                  </span>
                </p>
              )}
            </div>
          )}
          {badge && <div className="p-rise">{badge}</div>}
          <p className="p-kicker p-rise">
            {zone ? (
              <>
                <span className="p-kicker__idx">{zone.index}</span> {zone.culture}
              </>
            ) : (
              kicker
            )}
          </p>
          <h1 className="p-hero__title p-rise">{title}</h1>
          <div className="p-hero__lede p-rise">{lede}</div>
          {meta && (
            <dl className="p-hero__meta p-rise">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        {zone && cine ? (
          // the place through an arch, with whatever this page shows pinned over its corner
          <div className="p-hero__aside p-rise p-cine">
            <CineArch src={cine} tag={`${zone.index} · ${zone.culture.split(' · ')[0]}`} />
            {aside && <div className="p-cine__pin">{aside}</div>}
          </div>
        ) : (
          aside && <div className="p-hero__aside p-rise">{aside}</div>
        )}
      </div>
    </section>
  );
}

export function Section({
  id,
  num,
  label,
  title,
  intro,
  children,
  tone,
}: {
  id?: string;
  num: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  tone?: 'deep' | 'plain';
}) {
  return (
    <section id={id} className={`p-sec ${tone === 'deep' ? 'p-sec--deep' : ''}`}>
      <div className="p-wrap">
        <Reveal className="p-sec__head">
          <p className="p-sec__label">
            <span>{num}</span> {label}
          </p>
          <h2 className="p-sec__title">{title}</h2>
          {intro && <div className="p-sec__intro">{intro}</div>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export function Stats({ items }: { items: { value: string; label: string; note?: string }[] }) {
  return (
    <Reveal className="p-stats">
      {items.map((s) => (
        <div key={s.label} className="p-stat">
          <p className="p-stat__value">
            <CountUp value={s.value} />
          </p>
          <p className="p-stat__label">{s.label}</p>
          {s.note && <p className="p-stat__note">{s.note}</p>}
        </div>
      ))}
    </Reveal>
  );
}

export function Quote({ children, by }: { children: ReactNode; by?: string }) {
  return (
    <Reveal as="figure" className="p-quote">
      <blockquote>{children}</blockquote>
      {by && <figcaption>{by}</figcaption>}
    </Reveal>
  );
}

export function Photo({
  src,
  alt,
  caption,
  ratio = '4 / 5',
  priority,
  position,
}: {
  src: string;
  alt: string;
  caption?: string;
  ratio?: string;
  priority?: boolean;
  position?: string;
}) {
  return (
    <figure className="p-photo">
      <div className="p-photo__frame" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 50vw" priority={priority} style={{ objectFit: 'cover', objectPosition: position }} />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// Two columns of prose and a side note, the default way a story is told
export function Story({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <Reveal className="p-story">
      <div className="p-prose">{children}</div>
      {side && <aside className="p-story__side">{side}</aside>}
    </Reveal>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <Reveal as="ol" className="p-steps">
      {items.map((it, i) => (
        <li key={it.title}>
          <span className="p-steps__n">{String(i + 1).padStart(2, '0')}</span>
          <h3>{it.title}</h3>
          <div>{it.body}</div>
        </li>
      ))}
    </Reveal>
  );
}

// The way out: on to the next place, or back to the world
export function NextPlace({ current }: { current: ZoneId }) {
  const i = zones.findIndex((z) => z.id === current);
  const next = zones[(i + 1) % zones.length];
  return (
    <section className="p-next">
      <div className="p-wrap p-next__grid">
        <Link href="/" className="p-next__back">
          ↖ Back to the world
        </Link>
        <Link href={next.href} className="p-next__link">
          <Emblem place={next.id} className="p-next__emblem" />
          <span className="p-next__label">Next place · {next.index}</span>
          <span className="p-next__name">{next.name}</span>
          <span className="p-next__culture">{next.culture} →</span>
        </Link>
      </div>
    </section>
  );
}
