'use client';

import { useEffect, useState } from 'react';

// One switch for all movement on the site: the 3D scenes, the particles, the marquee,
// every CSS animation. Saved per visitor; if nothing is saved we follow the device's
// "reduce motion" setting. The page head applies it before first paint (theme/headScript.ts).

const KEY = 'ds-motion';

export function motionOn() {
  if (typeof document === 'undefined') return true;
  return document.documentElement.dataset.motion !== 'off';
}

export function setMotion(on: boolean) {
  document.documentElement.dataset.motion = on ? 'on' : 'off';
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  window.dispatchEvent(new CustomEvent('motionchange', { detail: on }));
}

// true while things are allowed to move
export function useMotion() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(motionOn());
    const f = () => setOn(motionOn());
    window.addEventListener('motionchange', f);
    return () => window.removeEventListener('motionchange', f);
  }, []);
  return on;
}

export function MotionToggle({ className = '' }: { className?: string }) {
  const on = useMotion();
  return (
    <button
      type="button"
      className={`motion-toggle ${className}`}
      onClick={() => setMotion(!on)}
      aria-pressed={!on}
      aria-label={on ? 'Pause motion' : 'Play motion'}
      title={on ? 'Pause motion' : 'Play motion'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {on ? (
          <g fill="currentColor">
            <rect x="7" y="6" width="3.2" height="12" rx="1" />
            <rect x="13.8" y="6" width="3.2" height="12" rx="1" />
          </g>
        ) : (
          <path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.2 5.1A.8.8 0 0 0 8 5.8z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}
