'use client';

import { useEffect, useRef, useState } from 'react';

// The way into About: a loading screen on the haveli fountain with the name rising in,
// a gold line filling underneath, then the scene opens through an arch onto the golden
// haveli and the headline. The full loader plays once per visit; later it's quick.

const PRELOAD = [
  '/opt/about/fountain.webp',
  '/opt/about/golden.webp',
  '/opt/about/dawn.webp',
  '/opt/about/monsoon.webp',
  '/opt/about/dusk.webp',
  '/me/hill-jaipur.webp',
  '/me/formal.webp',
];

type Phase = 'load' | 'out' | 'done';

export function AboutOpening() {
  const [phase, setPhase] = useState<Phase>('load');
  const [go, setGo] = useState(false);
  const [on, setOn] = useState(false);
  const [pct, setPct] = useState(0);
  const bg = useRef<HTMLDivElement>(null);
  const arch = useRef<HTMLDivElement>(null);

  // the loader
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem('ab-seen') === '1';
      sessionStorage.setItem('ab-seen', '1');
    } catch {}
    if (reduce) {
      setPhase('done');
      setOn(true);
      return;
    }
    const root = document.documentElement;
    root.classList.add('ab-loading');
    const dur = seen ? 700 : 2600;
    // the loader waits only for what the opening shows (the fountain and the golden haveli);
    // the walkthrough's pictures keep loading behind it while you read
    const NEED = 2;
    let loaded = 0;
    // portrait phones get the centre strip of each painting, the part they show (as about.css does)
    const small = window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches;
    PRELOAD.forEach((s, i) => {
      const im = new Image();
      if (i < NEED) im.onload = im.onerror = () => loaded++;
      im.src = small && s.startsWith('/opt/about/') ? s.replace('.webp', '-sm.webp') : s;
    });
    const t0 = performance.now();
    const timers: number[] = [];
    let raf = requestAnimationFrame(() => setGo(true));
    const tick = () => {
      const v = Math.min(loaded / NEED, Math.min(1, (performance.now() - t0) / dur));
      setPct(v);
      if (v < 1) raf = requestAnimationFrame(tick);
      else
        timers.push(
          window.setTimeout(() => {
            setPhase('out');
            root.classList.remove('ab-loading');
            timers.push(window.setTimeout(() => setOn(true), 450));
            timers.push(window.setTimeout(() => setPhase('done'), 1350));
          }, 300),
        );
    };
    raf = requestAnimationFrame(tick);
    // never hold the page hostage to a slow image
    timers.push(window.setTimeout(() => (loaded = NEED), 4500));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      root.classList.remove('ab-loading');
    };
  }, []);

  // depth: the haveli and the arch drift against the pointer and the scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let mx = 0,
      my = 0,
      x = 0,
      y = 0,
      raf = 0;
    // runs only while the drift is catching up; a move or a scroll wakes it
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      wake();
    };
    const frame = () => {
      x += (mx - x) * 0.05;
      y += (my - y) * 0.05;
      if (scrollY < innerHeight * 1.2) {
        if (bg.current) bg.current.style.transform = `translate(${-x * 18}px, ${-y * 12 + scrollY * 0.25}px) scale(1.08)`;
        if (arch.current) arch.current.style.transform = `translate(${-x * 14}px, ${-y * 10}px) scale(1.05)`;
      }
      raf = Math.abs(mx - x) + Math.abs(my - y) > 0.002 ? requestAnimationFrame(frame) : 0;
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {phase !== 'done' && (
        <div className={`ab-loader ${go ? 'is-go' : ''} ${phase === 'out' ? 'is-out' : ''}`} aria-hidden="true">
          <div className="ab-loader__bg" />
          <div className="ab-loader__title">
            <div>
              <p>About · a story in three acts</p>
              {/* not a heading: the page's one h1 is the hero's line below */}
              <div className="ab-loader__h">
                <span className="w">
                  <i>Devansh</i>
                </span>{' '}
                <span className="w">
                  <i>
                    <em>Sureka</em>
                  </i>
                </span>
              </div>
              <p className="route">Jaipur → Pilani → Now</p>
            </div>
          </div>
          <div className="ab-loader__bar">
            <i>
              <b style={{ width: `${pct * 100}%` }} />
            </i>
            <span>Loading · {Math.round(pct * 100)}%</span>
          </div>
        </div>
      )}

      <section className="ab-open" aria-label="About">
        <div className="ab-open__bg" ref={bg} aria-hidden="true" />
        <div className={`ab-hero ${on ? 'is-on' : ''}`}>
          <div className="ab-hero__text">
            <p className="ab-hero__name">
              Devansh <em>Sureka</em>
            </p>
            <p className="ab-kicker">About · Jaipur → Pilani</p>
            <h1 className="ab-hero__title">
              Get into it properly.
              <br />
              Do the work <em>perfectly.</em>
            </h1>
            <p className="ab-lede">
              I’m <strong>Devansh Sureka</strong>, a civil engineering student at BITS Pilani with a minor in finance, from Jaipur. That line above is the one
              rule I keep. The words are maybe two percent of what I mean by it. The rest is in how the work gets done.
            </p>
          </div>
          <div className="ab-arch">
            <div className="ab-arch__img" ref={arch} role="img" aria-label="Devansh standing on a hilltop above Jaipur" />
            <span className="ab-arch__tag">Above Jaipur, home</span>
          </div>
        </div>
        <p className="ab-cue" aria-hidden="true">
          Scroll · the story in three acts ↓
        </p>
      </section>
    </>
  );
}
