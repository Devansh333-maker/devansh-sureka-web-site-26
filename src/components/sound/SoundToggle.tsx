'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ambience, sfx, type Scape } from './ambience';
import { skyNow } from '@/components/world/sky';
import './sound.css';

// The sound switch, bottom-left on every page. Off until you ask for it (browsers
// won't play audio before a tap anyway); the choice is remembered for next time.

const KEY = 'ds-sound';

function scapeFor(path: string): Scape {
  if (path.startsWith('/workshop')) return 'workshop';
  if (path.startsWith('/studio')) return 'studio';
  if (path.startsWith('/chaupal') || path.startsWith('/about')) return 'village';
  if (path.startsWith('/arena')) return 'arena';
  if (path.startsWith('/press')) return 'press';
  if (path.startsWith('/notebook')) return 'night';
  if (path.startsWith('/work')) return 'studio';
  const dark = document.documentElement.dataset.theme === 'dark';
  return dark || skyNow() === 'night' ? 'island-night' : 'island-day';
}

export function SoundToggle() {
  const path = usePathname();
  const [on, setOn] = useState(false);
  const [wants, setWants] = useState(false); // remembered "on", waiting for the first tap

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === 'on') setWants(true);
    } catch {}
  }, []);

  // browsers need a gesture before audio: resume on the first tap if it was left on
  useEffect(() => {
    if (!wants || on) return;
    const go = (e: Event) => {
      // a tap on the switch itself is handled by the switch (otherwise it would turn the
      // sound on here and straight back off in its own click)
      if ((e.target as Element | null)?.closest?.('.sound-toggle')) return;
      ambience().start();
      setOn(true);
    };
    window.addEventListener('pointerdown', go);
    window.addEventListener('keydown', go);
    return () => {
      window.removeEventListener('pointerdown', go);
      window.removeEventListener('keydown', go);
    };
  }, [wants, on]);

  useEffect(() => {
    const update = () => ambience().set(scapeFor(path));
    update();
    window.addEventListener('themechange', update);
    return () => window.removeEventListener('themechange', update);
  }, [path]);

  const toggle = () => {
    const a = ambience();
    if (on) {
      a.stop();
      setOn(false);
      setWants(false);
      try {
        window.localStorage.setItem(KEY, 'off');
      } catch {}
    } else {
      a.set(scapeFor(path));
      a.start();
      setOn(true);
      try {
        window.localStorage.setItem(KEY, 'on');
      } catch {}
      window.setTimeout(() => sfx('tick'), 50);
    }
  };

  return (
    <button type="button" className={`sound-toggle ${on ? 'is-on' : ''}`} onClick={toggle} aria-pressed={on} aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}>
      <span className="sound-toggle__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-toggle__label">{on ? 'Sound on' : 'Sound'}</span>
    </button>
  );
}
