'use client';

import { useEffect, useRef, useState } from 'react';
import { CONTACT } from '@/lib/contact';
import './say-hello.css';

// "Say hello" opens a small menu instead of jumping straight to a mail app: plenty of laptops
// have no mail app set up, and then a mailto link silently does nothing. Gmail in the
// browser, copying the address, or LinkedIn: one of them always works.

const GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}&su=${encodeURIComponent('Hello Devansh')}`;

export function SayHello({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  // closes on a click elsewhere or on Esc (and Esc goes back to the button)
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      // ↑ ↓ move between the options, as in any menu
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = [...(box.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
        return;
      }
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
    };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', key, true);
    box.current?.querySelector<HTMLElement>('.hello__menu a, .hello__menu button')?.focus();
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', key, true);
    };
  }, [open]);

  const copy = () =>
    navigator.clipboard?.writeText(CONTACT.email).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });

  return (
    <div
      ref={box}
      className="hello"
      // tabbing out of the menu closes it
      onBlur={(e) => {
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button ref={btn} type="button" className={`${className} hello__btn`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        Say hello
      </button>
      {open && (
        <div className="hello__menu" role="menu" aria-label="Ways to reach me">
          <p className="hello__addr" role="none">
            {CONTACT.email}
          </p>
          <a role="menuitem" href={GMAIL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Write in Gmail <span aria-hidden="true">↗</span>
          </a>
          <button role="menuitem" type="button" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy the address'}
          </button>
          <a role="menuitem" href={CONTACT.linkedin} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Message on LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
