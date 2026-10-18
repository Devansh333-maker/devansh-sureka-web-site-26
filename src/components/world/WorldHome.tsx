'use client';

import { SayHello } from '@/components/SayHello';
import { CONTACT } from '@/lib/contact';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { BuildClock } from './build';
import { preload } from 'react-dom';
import { PetalName } from './PetalName';
import { IntroBar, OPENING_IMAGES, RoninHalf, RoninLive, runRonin, type RoninCtl } from './RoninIntro';
import { Highlights } from './Highlights';
import { ContactBlock } from './ContactBlock';
import { OakTree } from './OakTree';
import { preload3D } from '@/components/three/preload';
import { useSky } from './sky';
import { Survey } from './Survey';
import { zones, type ZoneId } from './zones';
import { ARCH_TRAVEL, CINE, cineSmall, type ArchTravel } from '@/components/place/cine';
import { BrandMark } from '@/components/brand';
import { QuickTravelChip } from '@/components/QuickTravel';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MotionToggle } from '@/components/motion/motion';
import './world.css';
import { motionOn } from '@/components/motion/motion';

const Diorama = dynamic(() => import('./Diorama'), { ssr: false });

const BUILD_SECONDS = 3.1;
const EXPLORED_KEY = 'ds-world-explored';

type Phase = 'intro' | 'building' | 'ready';

function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: fine, just don't remember */
  }
}

// true once the opening has run in this page load (a full reload resets it)
let introPlayed = false;

export function WorldHome() {
  preload3D();
  // the opening's painting (and its wind mattes): requested with the page, before any script runs
  OPENING_IMAGES.forEach((src, i) => preload(src, { as: 'image', fetchPriority: i ? 'auto' : 'high' }));
  const clock = useRef<BuildClock>({ start: null, speed: 1 });
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [showIntro, setShowIntro] = useState(true);
  const [hovered, setHovered] = useState<ZoneId | null>(null);
  // C: the place you're pointing at in the Places list, shown as a photo strip in the panel
  const [peek, setPeek] = useState<ZoneId | null>(null);
  // B: an arch trip is under way; the island stops drawing so the next page builds fast
  const [away, setAway] = useState(false);
  const [selected, setSelected] = useState<ZoneId | null>(null);
  const [explored, setExplored] = useState<ZoneId[]>([]);
  const sky = useSky();

  // The build only starts once the 3D scene exists; if the slash lands first, it waits for it.
  const canvasReady = useRef(false);
  const pendingSpeed = useRef<number | null>(null);
  const [waiting, setWaiting] = useState(false);
  // the island's 3D scene: held back during the opening's entrance so it can't stall it
  const [show3D, setShow3D] = useState(false);
  const ronin = useRef<RoninCtl | null>(null);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const runBuild = useCallback((speed: number) => {
    clock.current = { start: performance.now() / 1000, speed };
    pendingSpeed.current = null;
    setWaiting(false);
    setPhase('building');
    timers.current.push(window.setTimeout(() => setPhase('ready'), (BUILD_SECONDS / speed) * 1000 + 150));
  }, []);

  const startBuild = useCallback(
    (speed: number) => {
      if (canvasReady.current) runBuild(speed);
      else {
        pendingSpeed.current = speed;
        setWaiting(true);
        // if the 3D never arrives (no WebGL, a stalled download), don't hold the page on
        // "laying the foundation": bring the interface in anyway
        timers.current.push(
          window.setTimeout(() => {
            if (pendingSpeed.current !== null) runBuild(pendingSpeed.current);
          }, 7000),
        );
      }
    },
    [runBuild],
  );

  // the loading line under the painting: creeps while the island loads, completes when it's in
  const progress = useRef(0);
  useEffect(() => {
    if (!showIntro) return;
    // the painting leans a little with the pointer
    const move = (e: PointerEvent) => {
      const el = root.current?.querySelector<HTMLElement>('.intro');
      el?.style.setProperty('--px', String(e.clientX / innerWidth - 0.5));
      el?.style.setProperty('--py', String(e.clientY / innerHeight - 0.5));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [showIntro]);

  const onCanvasReady = useCallback(() => {
    if (canvasReady.current) return;
    canvasReady.current = true;
    ronin.current?.ready();
    if (pendingSpeed.current !== null) {
      const sp = pendingSpeed.current;
      pendingSpeed.current = null;
      runBuild(sp);
    }
  }, [runBuild]);

  const finishInstantly = useCallback(() => {
    ronin.current?.skip();
    setShow3D(true);
    pendingSpeed.current = null;
    setWaiting(false);
    clock.current = { start: performance.now() / 1000 - 100, speed: 1 };
    setShowIntro(false);
    setPhase('ready');
    introPlayed = true;
  }, []);

  // Choose the opening: the full samurai whenever the site is opened, a quick build when
  // returning here within the same visit, and no motion for people who asked for reduced motion.
  useLayoutEffect(() => {
    try {
      const saved = JSON.parse(safeGet(EXPLORED_KEY) ?? '[]');
      if (Array.isArray(saved)) setExplored(saved.filter((id) => zones.some((z) => z.id === id)));
    } catch {
      /* ignore */
    }

    const reduced = !motionOn();
    if (reduced) {
      finishInstantly();
      return;
    }
    // the samurai opens the site every time it's opened; coming back to this page from
    // inside the site (from any page, even if the visit started on a place page) skips
    // straight to a quick build
    if ((introPlayed || window.__siteBooted) && !new URLSearchParams(window.location.search).has('intro')) {
      setShowIntro(false);
      setShow3D(true);
      startBuild(2.6);
      return;
    }

    // the island loads once the entrance is on screen (its code downloads right away)
    import('./Diorama').catch(() => {});
    const el = root.current!;
    ronin.current = runRonin(
      el,
      {
        mount3D: () => setShow3D(true),
        isReady: () => canvasReady.current,
        build: () => startBuild(1),
        done: () => {
          setShowIntro(false);
          introPlayed = true;
        },
      },
      progress,
    );
    return () => {
      ronin.current?.dispose();
      ronin.current = null;
    };
  }, [finishInstantly, startBuild]);

  // keep GSAP on the wall clock: by default it slows its tweens when frames are slow, which
  // on a weak laptop stretched the interface's fade-in to many seconds
  useEffect(() => {
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.lagSmoothing(500, 33);
  }, []);

  // Reveal the interface once the world has finished building (before paint, so it never
  // flashes in fully for a frame first)
  useLayoutEffect(() => {
    if (phase !== 'ready' || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hud-reveal', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'opacity,transform' });
    }, root);
    return () => ctx.revert();
  }, [phase]);

  // Esc closes a place, or skips the intro
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showIntro) finishInstantly();
        else setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showIntro, finishInstantly]);

  const select = useCallback((id: ZoneId | null) => {
    setSelected(id);
    if (!id) return;
    setExplored((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      safeSet(EXPLORED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // keys 1–6 fast-travel to a place, like a game's quick-select; with a place open,
  // ← and → walk to the previous and next one, like the card's own buttons
  useEffect(() => {
    if (phase !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || (el && /input|textarea|select/i.test(el.tagName))) return;
      const n = Number(e.key);
      if (n >= 1 && n <= zones.length) select(zones[n - 1].id);
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (dir && selected) {
        e.preventDefault();
        const i = zones.findIndex((z) => z.id === selected);
        select(zones[(i + dir + zones.length) % zones.length].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, select, selected]);

  const zone = zones.find((z) => z.id === selected) ?? null;
  // pointing at a place on the island previews it beside the list too
  useEffect(() => {
    if (hovered) setPeek(hovered);
  }, [hovered]);
  const peekZone = peek ? zones.find((z) => z.id === peek) ?? null : null;

  // a card is open: fetch that place's full photo now, so the arch trip (and the arch on
  // the page) open on a decoded image instead of stuttering while it loads
  const router = useRouter();
  useEffect(() => {
    if (!selected) return;
    const img = new Image();
    img.src = CINE[selected];
    img.decode?.().catch(() => {});
    // and fetch the page itself, so "Open" arrives quickly
    const z = zones.find((zz) => zz.id === selected);
    if (z) router.prefetch(z.href);
  }, [selected, router]);
  const zoneIdx = zone ? zones.indexOf(zone) : -1;
  const stepped = useRef<1 | -1 | null>(null);
  const step = (dir: 1 | -1) => {
    stepped.current = dir;
    select(zones[(zoneIdx + dir + zones.length) % zones.length].id);
  };

  // keyboard focus follows the card: the list it was opened from fades out (and leaves the
  // Tab order), so focus moves into the card, stays on ← / → as you step between places,
  // and comes back to that place's button when the card closes
  const card = useRef<HTMLElement>(null);
  const lastZone = useRef<ZoneId | null>(null);
  useEffect(() => {
    const prev = lastZone.current;
    lastZone.current = selected;
    const a = document.activeElement;
    const lost = !a || a === document.body || !!a.closest('[inert]');
    const dir = stepped.current;
    stepped.current = null;
    if (!lost) return;
    if (selected) {
      const el = dir ? card.current?.querySelectorAll<HTMLElement>('.place-card__step button')[dir < 0 ? 0 : 1] : card.current?.querySelector<HTMLElement>('.place-card__enter');
      el?.focus();
    } else if (prev) {
      root.current?.querySelectorAll<HTMLElement>('.hud-places li button')[zones.findIndex((z) => z.id === prev)]?.focus();
    }
  }, [selected]);

  return (
    <div ref={root} id="main" className="world" data-sky={sky} data-phase={phase} data-focus={zone ? "" : undefined}>
      <Survey night={sky === 'night'} />
      <OakTree />
      {/* the 3D world is a picture for pointers; keyboards and screen readers use the Places list */}
      <div className="world-canvas" aria-hidden="true">
        {show3D && <Diorama clock={clock} onFirstFrame={onCanvasReady} ready={phase === 'ready'} hovered={hovered} selected={selected} onHover={setHovered} onSelect={select} sky={sky} away={away} />}
      </div>

      {waiting && !showIntro && <p className="world-waiting">Laying the foundation…</p>}
      <PetalName run={phase === 'ready'} target=".hud-title" />

      {/* section-cut marks left behind by the slash, like an engineering drawing */}
      <svg className="section-mark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="70" x2="100" y2="30" />
      </svg>

      {/* ── the interface ── */}
      {/* the interface is always laid out (so phones can reserve its space) and fades in when the world is built */}
      <>
          <header className="hud-top">
            <Link href="/" className="hud-brand hud-reveal">
              <BrandMark size={40} nameClassName="hud-brand__name" />
              <span className="sr-only">, home</span>
            </Link>
            <nav className="hud-nav hud-reveal" aria-label="Main">
              <Link href="/work">Work</Link>
              <Link href="/notebook">Notebook</Link>
              <Link href="/about">About</Link>
              <a href={CONTACT.resume} target="_blank" rel="noreferrer">
                Résumé ↗
              </a>
              <QuickTravelChip />
              <MotionToggle />
              <ThemeToggle />
              <SayHello className="hud-nav__cta" />
            </nav>
          </header>

          <section className={`hud-hero ${zone ? 'is-hidden' : ''}`} aria-label="Introduction" inert={zone ? true : undefined}>
            <p className="hud-kicker hud-reveal">Civil engineering · BITS Pilani ’27 · Jaipur</p>
            <h1 className="hud-title">
              Devansh <em>Sureka</em>
            </h1>
            <p className="hud-lede hud-reveal">
              Civil engineer by degree, builder by habit. I make AI systems that run on their own (11.38 million Google impressions at Univest), research bricks
              made from farm waste, led NSS across 7 villages, and captained BITS Pilani to its first InterBITS team gold.
            </p>
            <Highlights className="hud-reveal" onPick={select} />
            <ContactBlock className="hud-reveal" />
          </section>

          <aside
            className={`hud-places hud-reveal ${zone ? 'is-hidden' : ''} ${peek ? 'is-peeking' : ''}`}
            aria-label="Places in my world"
            inert={zone ? true : undefined}
            onMouseLeave={() => setPeek(null)}
          >
            {/* pointing at a place: a postcard of it, to the left of the list, sitting at the bottom */}
            {peekZone && (
              <div key={peekZone.id} className="hud-postcard" style={{ backgroundImage: `url(${cineSmall(peekZone.id)})` }} aria-live="polite">
                <span className="hud-postcard__stamp">{peekZone.index}</span>
                <div className="hud-postcard__info">
                  <p className="hud-postcard__kicker">{peekZone.what}</p>
                  <strong className="hud-postcard__name">{peekZone.name}</strong>
                  <p className="hud-postcard__teaser">{peekZone.teaser}</p>
                  <p className="hud-postcard__proof">
                    <b>{(peekZone.proof ?? peekZone.facts[0]).value}</b> {(peekZone.proof ?? peekZone.facts[0]).label}
                  </p>
                </div>
              </div>
            )}
            <div className="hud-places__head">
              <span>Places</span>
              <span className="hud-places__count">
                {explored.length}/{zones.length} explored
              </span>
            </div>
            <ol>
              {zones.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => select(z.id)}
                    onMouseEnter={() => {
                      setHovered(z.id);
                      setPeek(z.id);
                    }}
                    onMouseLeave={() => setHovered(null)}
                    className={explored.includes(z.id) ? 'is-seen' : ''}
                  >
                    <span className="hud-places__idx">{z.index}</span>
                    <span className="hud-places__label">
                      <span>{z.name}</span>
                      <small>{z.what}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="hud-places__keys" aria-hidden="true">
              <kbd>1</kbd>–<kbd>6</kbd> to travel · <kbd>Esc</kbd> to come back
            </p>
          </aside>
      </>

      {zone && (
        <article key={zone.id} ref={card} className="place-card" aria-live="polite">
          <div className="place-card__photo" aria-hidden="true">
            <div className="place-card__photo-img" style={{ backgroundImage: `url(${cineSmall(zone.id)})` }} />
          </div>
          <div className="place-card__top">
            <span className="place-card__idx">
              {zone.index} / 0{zones.length}
            </span>
            <button type="button" className="place-card__close" onClick={() => select(null)} aria-label="Back to the whole world">
              ✕
            </button>
          </div>
          <p className="place-card__culture">{zone.culture}</p>
          <h2 className="place-card__name">{zone.name}</h2>
          <p className="place-card__story">{zone.story}</p>
          <p className="place-card__outfit">
            <span>Wearing</span> {zone.outfit}
          </p>
          <dl className="place-card__facts">
            {zone.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
          <div className="place-card__actions">
            <Link
              href={zone.href}
              className="place-card__enter"
              onClick={(e) => {
                if (!motionOn() || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setAway(true);
                const r = e.currentTarget.getBoundingClientRect();
                const detail: ArchTravel = { href: zone.href, place: zone.id, x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 };
                window.dispatchEvent(new CustomEvent(ARCH_TRAVEL, { detail }));
              }}
            >
              {zone.linkLabel} →
            </Link>
            <div className="place-card__step">
              <button type="button" onClick={() => step(-1)} aria-label="Previous place">
                ←
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next place">
                →
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ── the opening ── */}
      {showIntro && (
        <div className="intro ro-intro" aria-hidden="true">
          <div className="intro-backing" />
          <RoninLive />
          <div className="intro-half intro-half--top">
            <RoninHalf />
          </div>
          <div className="intro-half intro-half--bottom">
            <RoninHalf />
          </div>
          <svg className="intro-slash-wrap" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line className="intro-slash" x1="-2" y1="70.8" x2="102" y2="29.2" />
          </svg>
          <div className="intro-flash" />
        </div>
      )}
      {showIntro && <IntroBar progress={progress} />}
      {showIntro && (
        <button type="button" className="intro-skip" onClick={finishInstantly}>
          Skip <span>esc</span>
        </button>
      )}
    </div>
  );
}
