'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { zones } from '@/components/world/zones';
import { sfx } from '@/components/sound/ambience';
import { ARCH_READY, ARCH_TRAVEL, CINE, type ArchTravel } from './cine';
import './arch-portal.css';

// Fast travel into a place: an arch opens where you clicked, grows to fill the screen
// with the place, holds while the page arrives, then settles into the arch on that page.
// The photo you travel through is the window you land at.

type Box = { l: number; t: number; r: number; b: number };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function ArchPortal() {
  const router = useRouter();
  const el = useRef<HTMLDivElement>(null);
  const [trip, setTrip] = useState<{ img: string; chap: string; name: string; key: number } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const clip = (r: Box, top: number) => {
      const p = el.current;
      if (!p) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const bottom = Math.min(14, top);
      p.style.clipPath = `inset(${r.t}px ${W - r.r}px ${H - r.b}px ${r.l}px round ${top}px ${top}px ${bottom}px ${bottom}px)`;
    };
    // one eased step of the arch; a timer backs up the animation frames, so a busy or
    // backgrounded tab (where frames stall) can never leave the trip hanging
    const tween = (from: Box, to: Box, ms: number, top0: number, top1: number) =>
      new Promise<void>((done) => {
        const t0 = performance.now();
        let over = false;
        const finish = () => {
          if (over) return;
          over = true;
          clip(to, top1);
          done();
        };
        const step = (now: number) => {
          if (over) return;
          const k = ease(Math.min(1, (now - t0) / ms));
          clip({ l: lerp(from.l, to.l, k), t: lerp(from.t, to.t, k), r: lerp(from.r, to.r, k), b: lerp(from.b, to.b, k) }, lerp(top0, top1, k));
          if (k < 1) requestAnimationFrame(step);
          else finish();
        };
        requestAnimationFrame(step);
        window.setTimeout(finish, ms + 120);
      });
    const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    const samePath = (href: string) => window.location.pathname.replace(/\/$/, '') === href.replace(/\/$/, '');

    const go = async (e: Event) => {
      const { href, place, x, y } = (e as CustomEvent<ArchTravel>).detail;
      if (busy.current) return;
      busy.current = true;
      const zone = zones.find((z) => z.id === place)!;
      // where the arch on the arriving page will be (it reports itself when it mounts)
      let landing: DOMRect | null = null;
      const onReady = (ev: Event) => (landing = (ev as CustomEvent<DOMRect>).detail);
      window.addEventListener(ARCH_READY, onReady);
      router.prefetch(href);
      let hard = false;
      try {
        setTrip({ img: CINE[place], chap: `${zone.index} · ${zone.culture}`, name: zone.name, key: Date.now() });
        await wait(34);
        const W = window.innerWidth;
        const H = window.innerHeight;
        const small = { l: x - 50, t: y - 70, r: x + 50, b: y + 60 };
        const full = { l: 0, t: 0, r: W, b: H };
        clip(small, 50);
        el.current?.classList.add('is-on');
        sfx('whoosh');
        // 1. the arch opens where you clicked and grows to fill the screen
        await tween(small, full, 650, 50, 0);
        el.current?.classList.add('is-titled');
        window.__archArrival = true;
        router.push(href);
        // 2. hold on the place until the new page is really there (never fade back onto
        //    the old one). If the app's navigation still hasn't happened after 8 s, load the
        //    page the plain way; once it has, give its arch a moment to report in.
        const t0 = performance.now();
        while (!samePath(href)) {
          if (performance.now() - t0 > 8000) {
            hard = true;
            window.location.assign(href);
            return;
          }
          await wait(50);
        }
        const t1 = performance.now();
        while (!landing && performance.now() - t1 < 1500) await wait(50);
        await wait(Math.max(0, 450 - (performance.now() - t0)));
        el.current?.classList.remove('is-titled');
        // 3. settle into the arch on the page; if it's below the fold (phones), just fade
        const to = landing as DOMRect | null;
        if (to && to.top < H - 80 && to.bottom > 0) {
          await tween(full, { l: to.left, t: to.top, r: to.right, b: to.bottom }, 750, 0, to.width / 2);
        }
        el.current?.classList.add('is-leaving');
        await wait(380);
      } finally {
        // whatever happened, never leave the portal (or the next trip) stuck; on a plain
        // page load the arch stays up until the new page replaces it
        window.removeEventListener(ARCH_READY, onReady);
        if (!hard) {
          window.__archArrival = false;
          busy.current = false;
          setTrip(null);
        }
      }
    };
    window.addEventListener(ARCH_TRAVEL, go);
    return () => window.removeEventListener(ARCH_TRAVEL, go);
  }, [router]);

  if (!trip) return null;
  return (
    <div ref={el} key={trip.key} className="arch-portal" aria-hidden="true">
      <div className="arch-portal__img" style={{ backgroundImage: `url(${trip.img})` }} />
      <div className="arch-portal__glow" />
      <div className="arch-portal__shade" />
      <div className="arch-portal__text">
        <p className="arch-portal__chap">{trip.chap}</p>
        <p className="arch-portal__name">{trip.name}</p>
      </div>
    </div>
  );
}
