'use client';

import { MotionToggle } from './motion';

// Phones only (see motion.css): pause and search, under the sound button on the right.
export function FloatControls() {
  return (
    <div className="float-controls">
      <MotionToggle />
      <button type="button" aria-label="Search the site" onClick={() => window.dispatchEvent(new Event('quicktravel:open'))}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15 15l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
