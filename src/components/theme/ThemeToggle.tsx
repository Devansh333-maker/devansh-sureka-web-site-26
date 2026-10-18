'use client';

import { useEffect, useId, useState } from 'react';

// Light or dark. The choice is saved; without one we follow the device's setting.
// The page head sets data-theme before first paint (headScript.ts), so there's no flash.

export type Theme = 'light' | 'dark';
const KEY = 'ds-theme';

export function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {}
  window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  window.setTimeout(() => root.classList.remove('theme-switching'), 500);
}

export function useTheme(): Theme {
  const [t, setT] = useState<Theme>('light');
  useEffect(() => {
    setT(currentTheme());
    const on = () => setT(currentTheme());
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);
  return t;
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme();
  const id = useId().replace(/:/g, '');
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <mask id={`m-${id}`}>
            <rect width="24" height="24" fill="#fff" />
            <circle className="moon-cut" cx="17" cy="7" r="6" fill="#000" />
          </mask>
        </defs>
        <circle cx="12" cy="12" r="5.5" fill="currentColor" mask={`url(#m-${id})`} />
        <g className="sun-rays" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={12 + Math.cos(a) * 8.5} y1={12 + Math.sin(a) * 8.5} x2={12 + Math.cos(a) * 10.5} y2={12 + Math.sin(a) * 10.5} />;
          })}
        </g>
      </svg>
    </button>
  );
}
