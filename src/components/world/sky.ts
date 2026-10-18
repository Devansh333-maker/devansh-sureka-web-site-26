'use client';

import { useEffect, useState } from 'react';

// The island keeps Pilani time: whatever hour it is in India is the light you see.
// ?time=dawn|day|golden|night previews a phase.

export type Sky = 'dawn' | 'day' | 'golden' | 'night';

export function skyNow(date = new Date()): Sky {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
    .format(date)
    .split(':')
    .map(Number);
  const t = (h % 24) + m / 60;
  if (t >= 5.5 && t < 7) return 'dawn';
  if (t >= 7 && t < 17) return 'day';
  if (t >= 17 && t < 19) return 'golden';
  return 'night';
}

// dark theme: the island at night. Light theme: Pilani's hour, but never fully dark
// (after sunset it holds at golden hour).
function themedSky(): Sky {
  const dark = document.documentElement.dataset.theme === 'dark';
  if (dark) return 'night';
  const s = skyNow();
  return s === 'night' ? 'golden' : s;
}

export function useSky(): Sky {
  const [sky, setSky] = useState<Sky>('day');
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get('time');
    if (forced === 'dawn' || forced === 'day' || forced === 'golden' || forced === 'night') {
      setSky(forced);
      return;
    }
    const update = () => setSky(themedSky());
    update();
    const id = window.setInterval(update, 60_000);
    window.addEventListener('themechange', update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('themechange', update);
    };
  }, []);
  return sky;
}

// light for each phase: sun colour/strength/height, sky fill, and lanterns
export const LIGHT: Record<Sky, { sun: string; sunK: number; sunY: number; hemiSky: string; hemiGround: string; hemiK: number; lamps: number }> = {
  dawn: { sun: '#ffc4a0', sunK: 0.75, sunY: 9, hemiSky: '#ffe1cf', hemiGround: '#6f5a63', hemiK: 0.9, lamps: 0.35 },
  day: { sun: '#ffd49c', sunK: 1, sunY: 18, hemiSky: '#fff1da', hemiGround: '#7a6450', hemiK: 1, lamps: 0 },
  golden: { sun: '#ff9a52', sunK: 0.85, sunY: 7, hemiSky: '#ffd2a4', hemiGround: '#6e4c3a', hemiK: 0.85, lamps: 0.45 },
  night: { sun: '#8fa6ff', sunK: 0.32, sunY: 16, hemiSky: '#5b6aa8', hemiGround: '#1d1a2a', hemiK: 0.55, lamps: 1 },
};
