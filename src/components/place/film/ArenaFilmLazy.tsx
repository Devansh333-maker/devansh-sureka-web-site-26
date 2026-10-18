'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Lazy = dynamic(() => import('./ArenaFilm').then((m) => m.ArenaFilm), {
  ssr: false,
  loading: () => <div className="ag-wait" aria-hidden="true" />,
});

// The film needs three.js and a moment to prepare its shaders. Starting that the instant the
// page opens made the page stutter while you were still reading the top, so it only starts
// once you scroll near the film (or the browser is idle a few seconds after load).
export function ArenaFilm() {
  const spot = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const el = spot.current;
    if (!el || go) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setGo(true), { rootMargin: '300px 0px' });
    io.observe(el);
    const idle = window.setTimeout(() => setGo(true), 6000);
    return () => {
      io.disconnect();
      window.clearTimeout(idle);
    };
  }, [go]);

  return go ? <Lazy /> : <div ref={spot} className="ag-wait" aria-hidden="true" />;
}
