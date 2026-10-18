'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { zones } from '@/components/world/zones';
import { sfx } from '@/components/sound/ambience';
import './travel.css';
import { motionOn } from '@/components/motion/motion';

// Fast travel: moving between pages plays a short "loading the level" cut, an ink
// panel with the place's name that wipes away to reveal it. The very first page load
// has the samurai instead, so this only runs on in-site navigation.

const NAMES: Record<string, { name: string; sub: string }> = {
  '/': { name: 'The world', sub: 'Back to the island' },
  '/about': { name: 'About', sub: 'Jaipur → Pilani' },
  '/work': { name: 'The Record', sub: 'Every role, most important first' },
};

function describe(path: string) {
  const zone = zones.find((z) => path === z.href || path.startsWith(`${z.href}/`));
  if (zone) return { name: zone.name, sub: `${zone.index} · ${zone.culture}` };
  return NAMES[path] ?? { name: 'Devansh Sureka', sub: '' };
}

export function Travel() {
  const path = usePathname();
  const last = useRef<string | null>(null);
  const [run, setRun] = useState<{ key: number; name: string; sub: string } | null>(null);

  useLayoutEffect(() => {
    const prev = last.current;
    last.current = path;
    // the first page has rendered (its own effects ran before this one)
    window.__siteBooted = true;
    if (prev === null || prev === path) return;
    if (!motionOn()) return;
    // arriving through an arch: the arch is the transition
    if (window.__archArrival) return;
    setRun({ key: Date.now(), ...describe(path) });
    sfx('whoosh');
    const t = window.setTimeout(() => setRun(null), 1500);
    return () => window.clearTimeout(t);
  }, [path]);

  if (!run) return null;
  return (
    <div key={run.key} className="travel" aria-hidden="true">
      <div className="travel-ink" />
      <div className="travel-card">
        {run.sub && <p className="travel-sub">{run.sub}</p>}
        <p className="travel-name">{run.name}</p>
        <span className="travel-bar">
          <i />
        </span>
      </div>
    </div>
  );
}
