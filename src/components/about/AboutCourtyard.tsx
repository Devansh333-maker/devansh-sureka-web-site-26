'use client';

import { useEffect, useRef } from 'react';

// The story in three acts, told in one courtyard whose light changes as you scroll:
// dawn for Jaipur, monsoon for the Pilani years, dusk for now. A carved window opens
// onto it first, the portrait hangs in the monsoon light, and the header turns light
// while you're in the dark scenes.

const CAPTIONS = [
  { at: 0.06, k: 'Act I · Jaipur · dawn', h: <>Skates before <em>school.</em></>, p: 'A silver at the Rajasthan district skating championship in 2016. The National Championships the year after.' },
  { at: 0.15, k: 'Act I · Jaipur · dawn', h: <>NCC, and <em>maths.</em></>, p: 'NCC cadet with the 1 Raj Boys Battalion. School topper in maths at DPS Jaipur, then maths and chemistry in Class 12.' },
  { at: 0.25, k: 'Act I · Jaipur · dawn', h: <>Then, <em>JEE.</em></>, p: 'JEE Advanced opened IIT (ISM) Dhanbad. BITSAT, and a gut feeling, chose BITS Pilani for civil engineering.' },
  { at: 0.38, k: 'Act II · Pilani · monsoon', h: <>Saying yes, then <em>doing it properly.</em></>, p: 'Civil engineering with a minor in finance.' },
  {
    at: 0.5,
    k: 'Act II · Pilani · monsoon',
    h: <>Villages, a court, <em>a magazine.</em></>,
    p: 'NSS Secretary across seven villages, captain of skating and roll ball, Editor-in-Chief of L.I.T.E., and research on bricks made from crop waste and plastic.',
  },
  { at: 0.7, k: 'Act III · Now · dusk', h: <>Systems that run <em>on their own.</em></>, p: 'AI automation at Univest: systems that publish market articles on their own, seen 11.38 million times on Google.' },
  { at: 0.84, k: 'Act III · Now · dusk', h: <>Mostly, <em>plumbing.</em></>, p: 'Most problems I enjoy are really plumbing problems: something should happen on its own, and it doesn’t yet.' },
];
const ACTS = [
  ['Act I', 'Jaipur', 'dawn'],
  ['Act II', 'Pilani', 'monsoon'],
  ['Act III', 'Now', 'dusk'],
];
const LIGHTS = ['/opt/about/dawn.webp', '/opt/about/monsoon.webp', '/opt/about/dusk.webp'];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));

export function AboutCourtyard() {
  const sec = useRef<HTMLElement>(null);

  useEffect(() => {
    const s = sec.current;
    if (!s) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = <T extends HTMLElement>(sel: string) => s.querySelector(sel) as T;
    const lights = [...s.querySelectorAll<HTMLElement>('.ab-light')];
    const caps = [...s.querySelectorAll<HTMLElement>('.ab-caption')];
    const ticks = [...s.querySelectorAll<HTMLElement>('.ab-ticks b')];
    const sweep = q('.ab-sweep');
    const gilt = q('.ab-gilt');
    const plaque = q('.ab-plaque');
    const win = q('.ab-window');
    const [actNo, actName, actLight] = [q('[data-act-no]'), q('[data-act-name]'), q('[data-act-light]')];
    const root = document.documentElement;
    let mx = 0,
      my = 0,
      x = 0,
      y = 0,
      raf = 0,
      lastAct = -1;
    let near = true; // the courtyard is on or close to the screen
    // a frame runs on a scroll, a resize or (near the courtyard) a pointer move, and keeps
    // going only while the light is still drifting after the pointer
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      if (near && !reduce) wake();
    };
    const frame = () => {
      raf = 0;
      const vh = innerHeight;
      // the header is light over the dark scenes (the opening and the courtyard) and the footer
      const r = s.getBoundingClientRect();
      const close = document.querySelector('.site-foot')?.getBoundingClientRect();
      const dark = r.bottom > 70 || (close && close.top < 70) ? '1' : '0';
      if (root.dataset.abDark !== dark) root.dataset.abDark = dark;
      if (r.bottom < 0 || r.top > vh) return;
      if (!reduce) {
        x += (mx - x) * 0.05;
        y += (my - y) * 0.05;
        if (Math.abs(mx - x) + Math.abs(my - y) > 0.002) raf = requestAnimationFrame(frame);
      }
      const p = clamp(-r.top / (s.offsetHeight - vh));
      // the light: dawn → monsoon → dusk, dissolving at about a third and two thirds
      const w1 = ease(clamp((p - 0.31) / 0.06));
      const w2 = ease(clamp((p - 0.62) / 0.06));
      lights[0].style.opacity = String(1 - w1);
      lights[1].style.opacity = String(w1 * (1 - w2));
      lights[2].style.opacity = String(w2);
      if (!reduce) lights.forEach((el) => (el.style.transform = `translate(${-x * 22}px, ${-y * 14 - p * 30}px) scale(${1.1 - p * 0.05})`));
      // a band of light sweeps across as the day turns
      sweep.style.opacity = String(Math.max(bump(p, 0.29, 0.39), bump(p, 0.6, 0.7)));
      sweep.style.backgroundPosition = `${(1 - (p % 0.33) / 0.33) * 100}% 0`;
      const act = p < 0.34 ? 0 : p < 0.65 ? 1 : 2;
      if (act !== lastAct) {
        lastAct = act;
        actNo.textContent = ACTS[act][0];
        actName.textContent = ACTS[act][1];
        actLight.textContent = ACTS[act][2];
      }
      ticks.forEach((t, i) => (t.style.width = clamp((p - [0, 0.34, 0.65][i]) / [0.34, 0.31, 0.35][i]) * 100 + '%'));
      // the portrait hangs in the monsoon light for Act II
      const gp = bump(p, 0.36, 0.64);
      gilt.style.opacity = plaque.style.opacity = String(clamp(gp * 2.2));
      gilt.style.transform = `translateY(${(1 - clamp(gp * 2)) * 40}px) scale(${0.94 + gp * 0.06})`;
      // the carved window opens out onto the courtyard
      const o = clamp(p / 0.12);
      win.style.transform = `translate3d(0, ${(-o * 10).toFixed(2)}vh, 0) scale(${(1 + ease(o) * 2.2).toFixed(4)})`;
      win.style.opacity = String(1 - clamp((o - 0.85) / 0.15));
      caps.forEach((c, i) => {
        const at = CAPTIONS[i].at;
        const next = CAPTIONS[i + 1]?.at ?? 1.01;
        c.classList.toggle('is-on', p >= at && p < next);
      });
    };
    // only follow the pointer while the courtyard is close to the screen
    const io = new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: '50% 0px' });
    io.observe(s);
    // the page above can still grow (pictures arriving), which moves the courtyard
    const ro = new ResizeObserver(wake);
    ro.observe(document.body);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      delete root.dataset.abDark;
    };
  }, []);

  return (
    <section ref={sec} className="ab-court" aria-label="The story in three acts">
      <div className="ab-pin">
        {LIGHTS.map((src, i) => (
          <div
            key={src}
            className="ab-light"
            style={{ ['--img' as string]: `url(${src})`, ['--img-sm' as string]: `url(${src.replace('.webp', '-sm.webp')})`, opacity: i === 0 ? 1 : 0 }}
            aria-hidden="true"
          />
        ))}
        <div className="ab-sweep" aria-hidden="true" />
        <div className="ab-shade" aria-hidden="true" />
        <div className="ab-gilt" aria-hidden="true">
          <div className="ab-gilt__canvas" />
        </div>
        <div className="ab-plaque" aria-hidden="true">
          Devansh Sureka · BITS Pilani
        </div>
        <div className="ab-window-layer" aria-hidden="true">
          <div className="ab-window" />
        </div>
        <div className="ab-acts" aria-hidden="true">
          <b data-act-no>Act I</b>
          <span data-act-name>Jaipur</span>
          <i data-act-light>dawn</i>
        </div>
        <div className="ab-ticks" aria-hidden="true">
          <u>
            <b />
          </u>
          <u>
            <b />
          </u>
          <u>
            <b />
          </u>
        </div>
        {CAPTIONS.map((c) => (
          <div key={c.at} className="ab-caption">
            <p className="ab-caption__k">{c.k}</p>
            <h2>{c.h}</h2>
            <p>{c.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
