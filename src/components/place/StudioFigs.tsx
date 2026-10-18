'use client';

import { useEffect, useRef, useState } from 'react';
import { Reveal } from './reveal';
import './studio-figs.css';

// The Univest work, shown rather than listed. Figures are from the work report
// (Jul–13 Oct 2026); the reach is rounded, and the system's inner workings stay general.

// ── before / after ─────────────────────────────────────────────
const SHIFT = [
  { what: 'Blogs a day', before: '~200', after: '800+', note: 'automated; ~1,150 with the SEO team’s publishing', dir: 'up', b: 0.17, a: 0.7 },
  { what: 'From market event to live article', before: '2–3 hours', after: '2–3 minutes', note: 'unattended', dir: 'down', b: 1, a: 0.04 },
  { what: 'AI cost per published blog', before: '₹4.1', after: '₹1.6', note: 'about $18 per 1,000 blogs', dir: 'down', b: 1, a: 0.39 },
  { what: 'Articles that fail', before: '4.5%', after: '0.04%', note: '30–70 a day down to 0–2', dir: 'down', b: 1, a: 0.02 },
  { what: 'Banner image', before: '₹1.50–3.00, 800 KB', after: '₹0.10–0.30, 50 KB', note: 'from an asset library instead of AI art', dir: 'down', b: 1, a: 0.08 },
];
export function BeforeAfter() {
  return (
    <Reveal className="ba">
      <div className="ba__head" aria-hidden="true">
        <span />
        <span>July, by hand</span>
        <span>October, automated</span>
      </div>
      {SHIFT.map((s) => (
        <div key={s.what} className={`ba__row ba__row--${s.dir}`}>
          <p className="ba__what">{s.what}</p>
          <div className="ba__cell">
            <b>{s.before}</b>
            <i style={{ ['--w' as string]: s.b }} />
          </div>
          <div className="ba__cell ba__cell--after">
            <b>{s.after}</b>
            <i style={{ ['--w' as string]: s.a }} />
            <small>{s.note}</small>
          </div>
        </div>
      ))}
    </Reveal>
  );
}

// ── growth, and the size of the build ───────────────────────────
const MONTHS = [
  { m: 'July', n: 200, note: 'by hand' },
  { m: 'August', n: 400, note: 'first systems live' },
  { m: 'September', n: 1030, note: '' },
  { m: 'October', n: 1210, note: 'so far' },
];
const BUILD = [
  { n: '46', l: 'automated workflows, 40 of them running live' },
  { n: '26', l: 'kinds of article across 15+ systems' },
  { n: '3', l: 'internal web apps, including the BlogDesk dashboard' },
  { n: '75', l: 'quality checks run on every kind of article' },
  { n: '24,912', l: 'articles published in five weeks (8 Sep – 12 Oct)' },
  { n: '~10,400 h', l: 'of manual writing saved over those five weeks' },
];
export function Growth() {
  const max = 1300;
  return (
    <Reveal className="gr">
      <figure className="gr__chart">
        <p className="gr__k">Articles published a day</p>
        <div className="gr__bars">
          {MONTHS.map((x, i) => (
            <div key={x.m} className="gr__col" style={{ ['--h' as string]: x.n / max, ['--i' as string]: i }}>
              <b>{x.n === 200 ? '~200' : `~${x.n.toLocaleString('en-IN')}`}</b>
              <span className="gr__bar" />
              <span className="gr__m">{x.m}</span>
              {x.note && <small>{x.note}</small>}
            </div>
          ))}
        </div>
        <figcaption>
          <b>6×</b> the output in three months, while the cost of each article fell by more than half.
        </figcaption>
      </figure>
      <div className="gr__build">
        <p className="gr__k">What I built to get there</p>
        <ul>
          {BUILD.map((b) => (
            <li key={b.l}>
              <b>{b.n}</b>
              <span>{b.l}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

// ── reach ───────────────────────────────────────────────────────
function Count({ to, fmt = (n: number) => n.toLocaleString('en-IN') }: { to: number; fmt?: (n: number) => string }) {
  const el = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const e = el.current;
    if (!e) return;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        setV(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(e);
    return () => io.disconnect();
  }, [to]);
  return <span ref={el}>{fmt(v)}</span>;
}
export function Reach() {
  return (
    <Reveal className="rc">
      <div className="rc__lead">
        <p className="rc__big">
          <Count to={11.38} fmt={(n) => `${n.toFixed(2)}M`} />
        </p>
        <p>
          Google search impressions from <b>13,000+</b> automated pages, 1 Jul – 14 Oct. About 20% of everything univest.in’s blog was shown for.
        </p>
      </div>
      <div className="rc__grid">
        <div>
          <b>
            <Count to={57941} fmt={(n) => Math.round(n).toLocaleString('en-IN')} />
          </b>
          <span>clicks from search</span>
        </div>
        <div>
          <b>1.3 lakh+</b>
          <span>people who came to read</span>
        </div>
        <div>
          <b>0 → 1.4 lakh+</b>
          <span>Google News impressions; there were none before August</span>
        </div>
        <div>
          <b>+51%</b>
          <span>univest.in pages indexed by Google, from about 77,000 (24 Jul to 9 Oct)</span>
        </div>
      </div>
    </Reveal>
  );
}

// ── Spotify: how big the market really is ──────────────────────
const FUNNEL = [
  { n: '140 crore', l: 'people in India' },
  { n: '35 crore', l: 'aged 16–30' },
  { n: '12.2 crore', l: 'in cities with venues' },
  { n: '4.9 crore', l: 'who can afford a ₹2–5k ticket' },
  { n: '73.5 lakh', l: 'who actually buy, 1–2 in 10' },
];
export function TamFunnel() {
  return (
    <Reveal as="figure" className="tf">
      <ol>
        {FUNNEL.map((f, i) => (
          <li key={f.l} style={{ ['--w' as string]: `${100 - i * 15}%`, ['--i' as string]: i }}>
            <b>{f.n}</b>
            <span>{f.l}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        Counting buyers gives <b>₹26.5B</b> of demand; counting seats gives only <b>₹4.7B</b> of capacity. Demand is more than five times the seats: people who want tickets and can’t get them, which is the opening.
      </figcaption>
    </Reveal>
  );
}
