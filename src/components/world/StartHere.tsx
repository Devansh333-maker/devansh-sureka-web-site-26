// A one-line "how this works" pill at the top of the homepage intro, for first-time visitors
// (WorldHome shows it only until a place has been opened).

import './start-here.css';

export function StartHere({ className = '' }: { className?: string }) {
  return (
    <p className={`start ${className}`}>
      <span className="start__new">New here?</span>
      <span className="start__mouse">Click any building to step inside.</span>
      <span className="start__touch">Tap a building, or pick a place below.</span>
    </p>
  );
}
