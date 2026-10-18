'use client';

import { useState } from 'react';

// "Personal file": a dossier card with a pinned photo, the facts at a
// glance, and the story in three chapters you can page through.

const CHAPTERS = [
  {
    tag: 'Origin · Jaipur',
    title: 'Skates before school.',
    body: 'I have been on skates since I was a kid: a silver at the Rajasthan district skating championship in 2016, the Nationals the year after. NCC cadet, school topper in maths at DPS Jaipur, and JEE Advanced, which got me IIT (ISM) Dhanbad. BITSAT, and my gut, brought me to Pilani instead.',
  },
  {
    tag: 'BITS · Pilani',
    title: 'Saying yes, then doing it properly.',
    body: 'Civil engineering with a minor in finance. NSS Secretary across 7 villages, captain of skating and roll ball, Editor-in-Chief of L.I.T.E., and research on bricks made from crop waste and plastic.',
  },
  {
    tag: 'Now · Univest',
    title: 'Systems that run on their own.',
    body: 'AI automation at Univest: systems that publish market articles on their own, seen 11.38 million times on Google. Most problems I enjoy are really plumbing problems: something should happen on its own, and it doesn’t yet.',
  },
];

const FACTS: [string, string][] = [
  ['Name', 'Devansh Sureka'],
  ['From', 'Jaipur, Rajasthan'],
  ['Studying', 'B.E. Civil + Finance minor, BITS Pilani ’27'],
  ['Currently', 'AI Automation, Univest'],
  ['Jersey', '#5'],
  ['The rule', 'Get into it properly. Do the work perfectly.'],
];

export function Dossier() {
  const [i, setI] = useState(0);
  const c = CHAPTERS[i];
  return (
    <section className="dossier p-wrap" aria-label="Personal file">
      <header className="dossier__strip">
        <h2 className="dossier__label">Personal file</h2>
        <span>DS / 2026</span>
      </header>
      <div className="dossier__body">
        <figure className="dossier__photo">
          <img src="/me/white-shirt.webp" width={1200} height={1200} alt="Devansh in a white shirt and glasses" loading="lazy" decoding="async" />
          <span className="dossier__clip" aria-hidden="true" />
        </figure>
        <div className="dossier__facts">
          <dl>
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="dossier__chapter" aria-live="polite">
            <div className="dossier__pager">
              <p>
                <strong>{String(i + 1).padStart(2, '0')}</strong> / {String(CHAPTERS.length).padStart(2, '0')}
              </p>
              <div role="tablist" aria-label="Chapters">
                {CHAPTERS.map((ch, k) => (
                  <button key={ch.tag} type="button" role="tab" aria-selected={k === i} className={k === i ? 'is-on' : ''} onClick={() => setI(k)}>
                    {ch.tag}
                  </button>
                ))}
              </div>
            </div>
            <h3 key={`t${i}`}>{c.title}</h3>
            <p key={`b${i}`}>{c.body}</p>
            <div className="dossier__nav">
              <button type="button" onClick={() => setI((k) => (k + CHAPTERS.length - 1) % CHAPTERS.length)} aria-label="Previous chapter">
                ←
              </button>
              <button type="button" onClick={() => setI((k) => (k + 1) % CHAPTERS.length)} aria-label="Next chapter">
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
