'use client';

import { useState } from 'react';
import { CONTACT } from '../place/chrome';

// Reach me, drawn as the title block in the corner of an engineering sheet: the email
// (one tap copies it), and the places I'm findable, all on the home screen.
export function ContactBlock({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${CONTACT.email}`;
    }
  };
  return (
    <address className={`contact-block ${className}`} aria-label="Contact">
      <div className="contact-block__row">
        <span className="contact-block__label">Reach me</span>
        <a className="contact-block__mail" href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
        <button type="button" className="contact-block__copy" onClick={copy} aria-live="polite">
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <div className="contact-block__row contact-block__links">
        <span className="contact-block__label">Elsewhere</span>
        <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
          LinkedIn ↗
        </a>
        <a href={CONTACT.github} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
        <a href={CONTACT.behance} target="_blank" rel="noreferrer">
          Behance ↗
        </a>
        <a href={CONTACT.resume} target="_blank" rel="noreferrer">
          Résumé ↗
        </a>
      </div>
    </address>
  );
}
