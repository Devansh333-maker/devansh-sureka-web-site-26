'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { zones } from '@/components/world/zones';
import { BrandMark } from '@/components/brand';
import { QuickTravelChip } from '@/components/QuickTravel';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MotionToggle } from '@/components/motion/motion';
import { FootScene } from './FootScene';
import { SayHello } from '@/components/SayHello';

// my contact details live in a plain module so server pages can read them too
export { CONTACT } from '@/lib/contact';
import { CONTACT } from '@/lib/contact';

// Top bar for every page except the world itself
export function SiteBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const bar = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  // with a mouse, the places drop down as soon as you point at "Places", and fold away a
  // moment after you leave both the button and the list (so a diagonal move doesn't lose it)
  const hoverT = useRef(0);
  const [at, setAt] = useState<number | null>(null);
  const place = () => {
    const b = toggle.current?.getBoundingClientRect();
    const h = bar.current?.getBoundingClientRect();
    if (!b || !h) return;
    const w = Math.min(240, window.innerWidth - 32);
    setAt(Math.max(16, Math.min(b.left - h.left - 12, h.width - w - 16)));
  };
  const hoverIn = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(hoverT.current);
    place();
    setOpen(true);
  };
  const hoverOut = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(hoverT.current);
    hoverT.current = window.setTimeout(() => setOpen(false), 280);
  };

  useEffect(() => setOpen(false), [pathname]);
  // the menu closes on Escape (focus goes back to its button) or a click outside it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const here = zones.find((z) => pathname.startsWith(z.href));

  return (
    <header ref={bar} className={`site-bar ${scrolled ? 'is-scrolled' : ''}`}>
      {/* named by what it shows, plus where it goes (so voice control can say the visible name) */}
      <Link href="/" className="site-bar__brand">
        <BrandMark size={34} nameClassName="site-bar__name" />
        <span className="sr-only">, back to the world</span>
        {here && (
          <span className="site-bar__crumb">
            <span aria-hidden="true">/</span> {here.name.replace('The ', '')}
          </span>
        )}
      </Link>

      <nav className="site-bar__nav" aria-label="Main">
        <button
          ref={toggle}
          type="button"
          className="site-bar__places"
          aria-expanded={open}
          aria-controls="site-places"
          onClick={() => {
            place();
            setOpen((o) => !o);
          }}
          onPointerEnter={hoverIn}
          onPointerLeave={hoverOut}
        >
          Places <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
        <Link href="/work" className={pathname === '/work' ? 'is-here' : ''}>
          Work
        </Link>
        <Link href="/about" className={pathname === '/about' ? 'is-here' : ''}>
          About
        </Link>
        <a href={CONTACT.resume} target="_blank" rel="noreferrer">
          Résumé ↗
        </a>
        <QuickTravelChip />
        <MotionToggle />
        <ThemeToggle />
        <SayHello className="site-bar__cta" />
      </nav>

      {open && (
        <div className="site-bar__menu" id="site-places" style={at !== null ? { left: at, right: 'auto' } : undefined} onPointerEnter={hoverIn} onPointerLeave={hoverOut}>
          <ol>
            {zones.map((z) => (
              <li key={z.id}>
                <Link href={z.href} className={pathname.startsWith(z.href) ? 'is-here' : ''}>
                  <span className="site-bar__idx">{z.index}</span>
                  <span className="site-bar__menu-name">{z.name.replace('The ', '')}</span>
                  <span className="site-bar__go" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {/* on a phone the bar has no room for these, so they live here */}
          <div className="site-bar__menu-more">
            <Link href="/work">Work</Link>
            <Link href="/about">About</Link>
            <a href={CONTACT.resume} target="_blank" rel="noreferrer">
              Résumé ↗
            </a>
          </div>
          <Link href="/" className="site-bar__menu-world">
            ↖ Back to the world
          </Link>
        </div>
      )}
    </header>
  );
}

// a click on the address opens a mail app, which many laptops don't have set up, so the
// address can also be copied in one click
function CopyMail() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="site-foot__copy"
      onClick={() =>
        navigator.clipboard?.writeText(CONTACT.email).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        })
      }
      aria-label="Copy my email address"
    >
      {done ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot has-scene">
      <div className="site-foot__inner">
        <div>
          <p className="site-foot__big">
            Let’s build something <em>properly.</em>
          </p>
          <div className="site-foot__mailrow">
            <a className="site-foot__mail" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email} ↗
            </a>
            <CopyMail />
          </div>
          <Link className="site-foot__all" href="/work">
            Everything I’ve done, in one list →
          </Link>
        </div>
        <div className="site-foot__cols">
          <div>
            <p className="site-foot__label">Places</p>
            {zones.map((z) => (
              <Link key={z.id} href={z.href}>
                {z.name.replace('The ', '')}
              </Link>
            ))}
          </div>
          <div>
            <p className="site-foot__label">Elsewhere</p>
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={CONTACT.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={CONTACT.behance} target="_blank" rel="noreferrer">
              Behance
            </a>
            <a href={CONTACT.resume} target="_blank" rel="noreferrer">
              Résumé (PDF)
            </a>
          </div>
        </div>
      </div>
      <FootScene />
      <div className="site-foot__base">
        <span>© {new Date().getFullYear()} Devansh Sureka · Pilani & Jaipur</span>
        <span className="site-foot__base-links">
          <Link href="/notebook/this-site-a-year-apart">This site, a year ago →</Link>
          <Link href="/">↖ Back to the world</Link>
        </span>
      </div>
    </footer>
  );
}
