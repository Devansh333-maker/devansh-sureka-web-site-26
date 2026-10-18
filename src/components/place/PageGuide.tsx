'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { motionOn } from '@/components/motion/motion';
import './page-guide.css';

// A little cartoon me, walking the page with you: left to right along the bottom as you read,
// so where I am is how far through the page you are. I walk while you scroll (back the other
// way when you scroll up), and when you stop I turn to you and say, in plain words, what the
// part you're looking at is about.

export type GuideLines = { hero: string; sections: Record<string, string>; end: string; kit?: Kit; kits?: Record<string, Kit> };

// px kept clear at each side: the sound and search buttons live there on a wide screen; on a
// phone the whole guide rides above those buttons instead (see page-guide.css)
const margin = () => (typeof window !== 'undefined' && window.innerWidth < 700 ? 36 : 190);

// what I'm carrying, to suit the part of the page I'm explaining
export type Kit = 'none' | 'magazine' | 'badge' | 'pencil' | 'poster' | 'hardhat' | 'laptop' | 'medal';

const SKIN = '#e8bc96';
const SKIN_SH = '#d9a57f';
const SHIRT = '#fbfaf6';
const SHIRT_SH = '#e7e3da';
const JEANS = '#26365a';
const JEANS_SH = '#1f2c4a';

// one leg: the thigh swings at the hip, the shin bends at the knee
function Leg({ side }: { side: 'f' | 'b' }) {
  const x = side === 'f' ? 0.6 : -8;
  const c = side === 'f' ? JEANS : JEANS_SH;
  return (
    <g className={`pg-me__thigh pg-me__thigh--${side}`}>
      <rect x={x} y="65" width="7.4" height="15" rx="3.5" fill={c} />
      <g className="pg-me__shin">
        <rect x={x + 0.2} y="77" width="7" height="16" rx="3.2" fill={c} />
        <path d={`M${x - 1.2} 91.5 h10.5 a4 4 0 0 1 0.5 7 h-10.5 a2.6 2.6 0 0 1 -0.5 -7z`} fill={side === 'f' ? '#fbf9f4' : '#ece8e0'} stroke="#b9b3a8" strokeWidth="0.8" />
      </g>
    </g>
  );
}

function Prop({ kit }: { kit: Kit }) {
  // drawn in the front hand (at 13.3, 69.5), so it swings with my arm
  if (kit === 'magazine')
    return (
      <g className="pg-me__prop">
        <rect x="9" y="61" width="11" height="14.5" rx="1" fill="#c2402a" transform="rotate(-10 14 68)" />
        <g transform="rotate(-10 14 68)" fill="#fbe9d6">
          <rect x="10.5" y="63" width="8" height="2" rx="0.5" />
          <rect x="10.5" y="66.5" width="5.5" height="1" rx="0.5" opacity="0.8" />
          <rect x="10.5" y="71" width="8" height="3" rx="0.6" opacity="0.5" />
        </g>
      </g>
    );
  if (kit === 'pencil')
    return (
      <g className="pg-me__prop">
        <g transform="rotate(-35 13.3 69.5)">
          <rect x="12" y="56" width="2.8" height="14" rx="0.6" fill="#f2b632" />
          <rect x="12" y="56" width="2.8" height="2.2" fill="#e88b8b" />
          <path d="M12 70 l1.4 3.4 l1.4 -3.4z" fill="#f1d7b0" />
        </g>
      </g>
    );
  if (kit === 'poster')
    return (
      <g className="pg-me__prop">
        <g transform="rotate(-25 13.3 69.5)">
          <rect x="11" y="54" width="5" height="22" rx="2.4" fill="#f3ead8" stroke="#c9bda5" strokeWidth="0.7" />
          <ellipse cx="13.5" cy="54.4" rx="2.5" ry="1" fill="#c2402a" />
        </g>
      </g>
    );
  if (kit === 'laptop')
    return (
      <g className="pg-me__prop">
        <rect x="7" y="66" width="15" height="10" rx="1.2" fill="#3a3f4a" />
        <circle cx="14.5" cy="71" r="1.4" fill="#cfd4de" />
      </g>
    );
  return null;
}

// memo: the progress bar re-renders me as you scroll, but the drawing only changes with these
const Me = memo(function Me({ talking, kit }: { talking: boolean; kit: Kit }) {
  return (
    <svg className="pg-me__svg" viewBox="-30 0 60 104" aria-hidden="true">
      <ellipse className="pg-me__shadow" cx="0" cy="101" rx="14" ry="2.4" />
      <g className="pg-me__bob">
        <Leg side="b" />
        {/* back arm */}
        <g className="pg-me__arm pg-me__arm--b">
          <rect x="-16.5" y="51" width="6.5" height="17" rx="3.2" fill={SHIRT_SH} />
          <circle cx="-13.3" cy="69.5" r="3.2" fill={SKIN_SH} />
        </g>
        <Leg side="f" />
        {/* body: white shirt, navy tie */}
        <path d="M-13 54 q0 -6 7 -7 h12 q7 1 7 7 v14 q0 3 -3 3 h-20 q-3 0 -3 -3z" fill={SHIRT} />
        <path d="M-5 47.5 l5 6 l5 -6" fill="none" stroke="#d9d5cc" strokeWidth="1.2" />
        <path d="M0 53 l-2 2.2 l1.4 12 l0.6 1.2 l0.6 -1.2 l1.4 -12z" fill="#22305a" />
        <rect x="-13" y="67" width="26" height="2.6" rx="1" fill="#2a2320" />
        {kit === 'badge' && (
          <g className="pg-me__prop">
            <path d="M-5.5 48 L-2 60 M5.5 48 L2 60" stroke="#c2402a" strokeWidth="1.3" fill="none" />
            <rect x="-4.5" y="59.5" width="9" height="7.5" rx="1.2" fill="#fff" stroke="#c9c3b8" strokeWidth="0.6" />
            <rect x="-4.5" y="59.5" width="9" height="2.3" rx="1" fill="#2a4b9a" />
            <rect x="-2.6" y="63.2" width="5.2" height="0.9" rx="0.4" fill="#9aa3b5" />
          </g>
        )}
        {kit === 'medal' && (
          <g className="pg-me__prop">
            <path d="M-5 48 L0 60 L5 48" stroke="#2a4b9a" strokeWidth="1.6" fill="none" />
            <circle cx="0" cy="62.5" r="3.6" fill="#f2c14e" stroke="#c9952b" strokeWidth="0.8" />
          </g>
        )}
        {/* front arm (waves when I start talking) */}
        <g className="pg-me__arm pg-me__arm--f">
          <rect x="10" y="51" width="6.5" height="17" rx="3.2" fill="#f2efe8" />
          <circle cx="13.3" cy="69.5" r="3.2" fill={SKIN} />
          <Prop kit={kit} />
        </g>
        {/* head */}
        <g className="pg-me__head">
          <rect x="-3.5" y="42" width="7" height="7" rx="2" fill={SKIN_SH} />
          <ellipse cx="-17.5" cy="30" rx="3" ry="4" fill={SKIN_SH} />
          <ellipse cx="17.5" cy="30" rx="3" ry="4" fill={SKIN_SH} />
          <path d="M-17 26 q0 -18 17 -18 q17 0 17 18 v4 q0 15 -17 15 q-17 0 -17 -15z" fill={SKIN} />
          {/* hair: short, swept up in front */}
          <path d="M-17.5 26 q-2 -15 8 -19 q9 -5 19 -1 q9 4 8 14 l-0.5 5 q-2 -6 -6 -8.5 q-8 3.5 -17 1.5 q-6 -1 -8 3 q-2 2 -3.5 5z" fill="#1a1311" />
          <path d="M-9 13 q6 -6 17 -3" fill="none" stroke="#3a2c28" strokeWidth="1.1" strokeLinecap="round" />
          {kit === 'hardhat' && (
            <g className="pg-me__prop">
              <path d="M-15 17 q0 -13 15 -13 q15 0 15 13z" fill="#f2b632" />
              <rect x="-19" y="15.5" width="38" height="3.4" rx="1.6" fill="#e0a21f" />
            </g>
          )}
          {/* the face turns the way I'm walking */}
          <g className="pg-me__face">
            <g className="pg-me__eyes">
              <ellipse cx="-6.5" cy="29.5" rx="1.7" ry="2.1" fill="#1a1311" />
              <ellipse cx="6.5" cy="29.5" rx="1.7" ry="2.1" fill="#1a1311" />
            </g>
            <g fill="rgba(170,160,220,0.22)" stroke="#2b1d18" strokeWidth="1.7">
              <rect x="-12.5" y="25" width="11" height="9" rx="2.6" />
              <rect x="1.5" y="25" width="11" height="9" rx="2.6" />
            </g>
            <path d="M-1.5 28.5 q1.5 -1.2 3 0 M-12.5 28 h-4 M12.5 28 h4" fill="none" stroke="#2b1d18" strokeWidth="1.4" />
            <path d="M-5 38 q2.5 -2 5 -0.4 q2.5 -1.6 5 0.4 q-2.5 1 -5 0.2 q-2.5 0.8 -5 -0.2z" fill="#1f1714" />
            <ellipse className={`pg-me__mouth ${talking ? 'is-talking' : ''}`} cx="0" cy="41.2" rx="2.6" ry="1.1" fill="#7a3a2e" />
            <ellipse cx="-11" cy="36" rx="2.6" ry="1.4" fill="#e58a6a" opacity="0.35" />
            <ellipse cx="11" cy="36" rx="2.6" ry="1.4" fill="#e58a6a" opacity="0.35" />
          </g>
        </g>
      </g>
    </svg>
  );
});

export function PageGuide({ lines }: { lines: GuideLines }) {
  const me = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const target = useRef(190);
  const scrolled = useRef(0); // when you last scrolled: I keep walking while you do
  const dir = useRef(1); // which way you last scrolled
  const lastY = useRef(0);
  const wake = useRef(() => {}); // starts the walk loop again if it's resting
  const [walking, setWalking] = useState(false);
  const [left, setLeft] = useState(false);
  const [title, setTitle] = useState('Start here');
  const [line, setLine] = useState(lines.hero);
  const [kit, setKit] = useState<Kit>(lines.kits?.hero ?? lines.kit ?? 'none');
  const [typed, setTyped] = useState(0);
  const [marks, setMarks] = useState<{ at: number; label: string }[]>([]);
  const [p, setP] = useState(0);
  const [away, setAway] = useState(true); // out of sight until you start reading

  // where I should be, and what I should be talking about
  useEffect(() => {
    let last = '';
    // the page's measurements, taken in place() (on load, resize, and whenever the page's
    // height changes) rather than on every scroll
    let max = 1;
    let heroH = 600;
    let secs: { top: number; key: string | undefined; head: string | undefined; label: string }[] = [];
    // quiet: a re-measure, not you scrolling, so it doesn't set me walking
    const update = (quiet = false) => {
      if (!quiet) scrolled.current = performance.now();
      if (scrollY !== lastY.current) dir.current = scrollY < lastY.current ? -1 : 1;
      lastY.current = scrollY;
      const prog = Math.min(1, Math.max(0, scrollY / max));
      setP(prog);
      // stay out of the way of the page's opening: walk in once you scroll past its top part
      setAway(scrollY < Math.min(260, heroH * 0.3));
      target.current = margin() + prog * (innerWidth - margin() * 2);
      wake.current();
      let key = 'hero';
      let head = 'Start here';
      for (const s of secs) {
        if (s.top - scrollY < innerHeight * 0.55) {
          key = s.key ?? key;
          head = s.head ?? key;
        }
      }
      if (prog > 0.97) {
        key = 'end';
        head = 'That’s it';
      }
      if (key !== last) {
        last = key;
        const next = key === 'hero' ? lines.hero : key === 'end' ? lines.end : lines.sections[key];
        if (next) {
          setTitle(head);
          setLine(next);
          setKit(lines.kits?.[key] ?? lines.kit ?? 'none');
          setTyped(0);
        }
      }
    };
    const place = (quiet = false) => {
      max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      heroH = document.querySelector<HTMLElement>('.p-hero')?.offsetHeight ?? 600;
      secs = [...document.querySelectorAll<HTMLElement>('.p-sec')].map((s) => {
        const lab = s.querySelector('.p-sec__label');
        return {
          top: s.getBoundingClientRect().top + scrollY,
          key: lab?.querySelector('span')?.textContent?.trim(),
          head: lab?.textContent?.replace(/\s+/g, ' ').trim().replace(/^(\S+) /, '$1 · '),
          label: lab?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        };
      });
      setMarks(secs.map((s) => ({ at: Math.min(1, Math.max(0, (s.top - innerHeight * 0.55) / max)), label: s.label })));
      update(quiet);
    };
    const onResize = () => place();
    // at most one update a frame: the first scroll in a frame runs straight away, any more
    // in that frame are folded into one at the next
    let pending = 0;
    let again = false;
    const onScroll = () => {
      if (pending) {
        again = true;
        return;
      }
      update();
      pending = requestAnimationFrame(() => {
        pending = 0;
        if (again) {
          again = false;
          update();
        }
      });
    };
    // re-measure when the page changes height (pictures and fonts arriving), once a frame
    let measuring = 0;
    const remeasure = () => {
      if (!measuring) measuring = requestAnimationFrame(() => ((measuring = 0), place(true)));
    };
    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    document.fonts?.ready.then(remeasure);
    const t = window.setTimeout(() => place(), 1500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      cancelAnimationFrame(pending);
      cancelAnimationFrame(measuring);
      measuring = -1; // a late fonts.ready does nothing once I'm gone
      window.clearTimeout(t);
    };
  }, [lines]);

  // the bubble's width, read only when it changes size (new words, folding, a resize) rather
  // than every frame; it re-seats itself beside me then too
  const bubbleW = useRef(0);

  // walk toward that spot at a walking pace (a jog to catch up), and carry the bubble along;
  // once I've arrived and you've stopped scrolling the loop rests until the next scroll
  useEffect(() => {
    let raf = 0;
    let x = target.current;
    let prev = performance.now();
    let moving = false;
    let still = 0;
    const place = () => {
      if (!bubble.current) return;
      // beside me rather than above, so it covers as little of the page as it can: to my
      // right, or to my left once I'm near the right edge
      const w = bubbleW.current;
      const right = x + 34 + w < innerWidth - 12;
      const l = right ? x + 34 : Math.max(12, x - 34 - w);
      bubble.current.style.transform = `translateX(${l}px)`;
      bubble.current.dataset.side = right ? 'r' : 'l';
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      // with motion off I don't walk: I'm simply where you've read to
      if (!motionOn()) x = target.current;
      const gap = target.current - x;
      const step = Math.sign(gap) * Math.min(Math.abs(gap), dt * Math.max(90, Math.abs(gap) * 2.4));
      x += step;
      // walking while I'm catching up, and while you're still scrolling (even slowly)
      const m = motionOn() && (Math.abs(gap) > 1.5 || now - scrolled.current < 180);
      if (m) still = 0;
      else still += dt;
      // a short pause before I count as stopped, so a scroll's little gaps don't flicker
      const nowMoving = m || still < 0.25;
      if (nowMoving !== moving) {
        moving = nowMoving;
        setWalking(moving);
      }
      if (m) setLeft(Math.abs(gap) > 1.5 ? gap < 0 : dir.current < 0);
      if (me.current) {
        me.current.style.transform = `translateX(${x}px)`;
      }
      place();
      // arrived, stood still, and nothing left to do: rest
      raf = moving || Math.abs(target.current - x) > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    wake.current = () => {
      if (raf) return;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const b = bubble.current;
    if (b) bubbleW.current = b.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (!b) return;
      bubbleW.current = b.offsetWidth;
      place();
    });
    if (b) ro.observe(b, { box: 'border-box' });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wake.current = () => {};
    };
  }, []);

  // type the line out once I've stopped
  useEffect(() => {
    if (walking || typed >= line.length) return;
    // with motion off the whole line just appears
    if (!motionOn()) return setTyped(line.length);
    const t = window.setTimeout(() => setTyped((n) => n + 2), 22);
    return () => window.clearTimeout(t);
  }, [typed, line, walking]);

  // at the end of the page I say my last line, then step out of the way of the footer
  const [quiet, setQuiet] = useState(false);
  const atEnd = line === lines.end;
  useEffect(() => {
    setQuiet(false);
    if (!atEnd) return;
    const t = window.setTimeout(() => setQuiet(true), 4500);
    return () => window.clearTimeout(t);
  }, [atEnd]);

  // once you've had time to read it, the bubble folds down to just the section's name
  const [resting, setResting] = useState(false);
  const done = typed >= line.length;
  useEffect(() => {
    setResting(false);
    if (walking || !done) return;
    const t = window.setTimeout(() => setResting(true), 2500 + line.length * 45);
    return () => window.clearTimeout(t);
  }, [walking, done, line]);

  const talking = !walking && typed < line.length;

  return (
    <div className={`pg ${walking ? 'is-walking' : ''} ${away ? 'is-away' : ''}`} aria-hidden="true">
      <div className="pg__track">
        <i className="pg__fill" style={{ transform: `scaleX(${p})` }} />
        {marks.map((m, i) => (
          <b key={i} className={p >= m.at ? 'is-past' : ''} style={{ left: `calc(var(--m) + (100% - 2 * var(--m)) * ${m.at})` }} title={m.label} />
        ))}
        <span className="pg__pct" style={{ left: `calc(var(--m) + (100% - 2 * var(--m)) * ${p})` }}>
          {Math.round(p * 100)}%
        </span>
      </div>
      <div ref={bubble} className={`pg__say ${walking ? 'is-hushed' : ''} ${resting && !walking ? 'is-resting' : ''} ${quiet ? 'is-quiet' : ''}`}>
        <span className="pg__kicker">{title}</span>
        <p>
          {line.slice(0, typed)}
        </p>
        <span className="pg__dots">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div ref={me} className="pg-me">
        <div className={`pg-me__body ${left ? 'is-left' : ''} ${walking ? 'is-walking' : ''} ${talking ? 'is-talking' : ''}`}>
          <Me talking={talking} kit={kit} key={kit} />
        </div>
      </div>
    </div>
  );
}
