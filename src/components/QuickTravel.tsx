'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { zones } from '@/components/world/zones';
import { CONTACT } from '@/components/place/chrome';
import { currentTheme, setTheme } from '@/components/theme/ThemeToggle';
import { motionOn, setMotion } from '@/components/motion/motion';
import './quick-travel.css';

// Quick travel: Ctrl/⌘+K (or "/") opens a search box that jumps anywhere on the site:
// the six places, the pages, every notebook post, plus a few handy actions.

// a small button for the headers that opens it
export function QuickTravelChip() {
  return (
    <button type="button" className="qt-chip" onClick={() => window.dispatchEvent(new Event('quicktravel:open'))} aria-keyshortcuts="Control+K">
      Search <kbd aria-hidden="true">Ctrl K</kbd>
    </button>
  );
}

type Item = { id: string; label: string; hint: string; group: string; keys?: string; run: () => void };

// the words people actually type, for each place
const KEYS: Record<string, string> = {
  workshop: 'bricks brick parali stubble plastic eco composite research akshaya patra water ro kitchen hydrology rainfall flood idf hec ras ahmedabad 3d blender enscape cottage car avinya infographics civil engineering',
  studio: 'univest ai automation pipeline seo articles n8n workspace openai spotify concert ticketing house of fandom ecommerce venture scout lvlup vc strategy product studies research',
  commons: 'nss national service scheme secretary villages volunteers umang scholarships blood donation bdc ircs junoon shop for a smile clp kriti leadership',
  arena: 'roll ball rollball skating skates interbits gold final captain sports bosm',
  press: 'lite l.i.t.e. magazine editor design posters techfest iit bombay mascot carousel apollo machine mania venom behance cea',
  notebook: 'blog writing posts notes diary build log',
};

// the bigger pieces of work, so a search lands right on them
const WORK: { id: string; label: string; hint: string; href: string; keys: string }[] = [
  { id: 'w-univest', label: 'AI Automation Intern, Univest', hint: 'The Systems Studio', href: '/studio', keys: 'ai pipeline seo articles internship job' },
  { id: 'w-nss', label: 'Secretary, NSS BITS Pilani', hint: 'The Chaupal', href: '/chaupal', keys: 'nss leadership villages volunteers' },
  { id: 'w-roll', label: 'Captain, skating and roll ball', hint: 'The Arena', href: '/arena', keys: 'interbits gold captain sports' },
  { id: 'w-brick', label: 'Eco-composite brick research', hint: 'The Workshop', href: '/workshop', keys: 'bricks parali plastic research' },
  { id: 'w-ap', label: 'Operations Analyst Intern, Akshaya Patra', hint: 'The Workshop', href: '/workshop', keys: 'water ro reject kitchen internship job' },
  { id: 'w-hydro', label: 'Urban hydrology: rainfall and flood model', hint: 'The Workshop', href: '/workshop#hydrology', keys: 'hydrology idf hec ras flood ahmedabad rainfall' },
  { id: 'w-hof', label: 'Product Management Intern, House of Fandom', hint: 'The Systems Studio', href: '/studio', keys: 'product ecommerce amazon ebay internship job' },
  { id: 'w-lvlup', label: 'Venture Scout, LvlUp Ventures', hint: 'The Systems Studio', href: '/studio', keys: 'vc venture investors founders' },
  { id: 'w-tf', label: 'Design & Marketing Intern, IIT Bombay Techfest', hint: 'The Press', href: '/press', keys: 'techfest design marketing posters internship job' },
  { id: 'w-lite', label: 'Editor-in-Chief, L.I.T.E.', hint: 'The Press', href: '/press', keys: 'lite magazine editor cea' },
  { id: 'w-spotify', label: 'Spotify: live concert ticketing in India', hint: 'Study', href: '/studies/spotify-live-ticketing', keys: 'spotify concert tickets market entry strategy' },
];

// lower case, no dots or accents: "L.I.T.E." finds "lite", "Résumé" finds "resume"
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9₹%]+/g, ' ')
    .trim();

// every word typed has to start a word somewhere in the item; the name counts most
function score(it: Item, q: string[]) {
  const label = norm(it.label).split(' ');
  const rest = norm(`${it.hint} ${it.group} ${it.keys ?? ''}`).split(' ');
  let s = 0;
  for (const w of q) {
    if (label.some((x) => x.startsWith(w))) s += 3;
    else if (rest.some((x) => x.startsWith(w))) s += 1;
    else return 0;
  }
  return s;
}

// the notebook posts come from the server (they're read from files at build time)
export function QuickTravel({ notes, studies = [] }: { notes: { slug: string; title: string; kind: string }[]; studies?: { slug: string; title: string; kind: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const go = (href: string) => () => {
    setOpen(false);
    router.push(href);
  };

  const items: Item[] = useMemo(
    () => [
      { id: 'home', label: 'The island', hint: 'Home', group: 'Places', run: go('/') },
      ...zones.map((z) => ({ id: z.id, label: z.name, hint: `${z.index} · ${z.culture}`, group: 'Places', keys: KEYS[z.id], run: go(z.href) })),
      { id: 'p-about', label: 'About', hint: 'Jaipur → Pilani', group: 'Pages', run: go('/about') },
      { id: 'p-work', label: 'Work', hint: 'Every role, most important first', group: 'Pages', run: go('/work') },
      { id: 'p-notebook', label: 'All notebook posts', hint: 'Everything I’ve written', group: 'Pages', run: go('/notebook') },
      ...notes.map((n) => ({ id: `n-${n.slug}`, label: n.title, hint: n.kind, group: 'Notebook', run: go(`/notebook/${n.slug}`) })),
      ...WORK.map((w) => ({ id: w.id, label: w.label, hint: w.hint, group: 'Work', keys: w.keys, run: go(w.href) })),
      ...studies.filter((s) => !WORK.some((w) => w.href === `/studies/${s.slug}`)).map((s) => ({ id: `s-${s.slug}`, label: s.title, hint: s.kind, group: 'Studies', keys: 'study research', run: go(`/studies/${s.slug}`) })),
      {
        id: 'copy',
        label: 'Copy my email',
        hint: CONTACT.email,
        group: 'Actions',
        run: () => {
          navigator.clipboard?.writeText(CONTACT.email).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          });
        },
      },
      { id: 'mail', label: 'Write to me', hint: 'Opens your mail app', group: 'Actions', run: () => (window.location.href = `mailto:${CONTACT.email}`) },
      { id: 'resume', label: 'Résumé (PDF)', hint: 'Opens in a new tab', group: 'Actions', run: () => window.open(CONTACT.resume, '_blank', 'noopener') },
      { id: 'linkedin', label: 'LinkedIn', hint: 'Opens in a new tab', group: 'Actions', run: () => window.open(CONTACT.linkedin, '_blank', 'noopener') },
      { id: 'github', label: 'GitHub', hint: 'Opens in a new tab', group: 'Actions', keys: 'code repos repositories', run: () => window.open(CONTACT.github, '_blank', 'noopener') },
      {
        id: 'theme',
        label: 'Light / dark theme',
        hint: 'Switch the look',
        group: 'Actions',
        run: () => {
          setOpen(false);
          setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
        },
      },
      {
        id: 'motion',
        label: 'Pause / play motion',
        hint: 'Stops the 3D, particles and animations',
        group: 'Actions',
        run: () => {
          setOpen(false);
          setMotion(!motionOn());
        },
      },
      {
        id: 'sound',
        label: 'Sound on / off',
        hint: 'Calm ambient music',
        group: 'Actions',
        run: () => {
          setOpen(false);
          (document.querySelector('.sound-toggle') as HTMLButtonElement | null)?.click();
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const shown = useMemo(() => {
    const words = norm(q).split(' ').filter(Boolean);
    // with nothing typed, the list stays short: places, pages and actions
    if (!words.length) return items.filter((it) => it.group !== 'Work' && it.group !== 'Studies');
    const ranked = items.map((it, i) => ({ it, i, s: score(it, words) })).filter((x) => x.s > 0);
    // best matches first, but each group stays together under its heading
    const best: Record<string, number> = {};
    ranked.forEach((x) => (best[x.it.group] = Math.max(best[x.it.group] ?? 0, x.s)));
    return ranked.sort((a, b) => best[b.it.group] - best[a.it.group] || (a.it.group === b.it.group ? b.s - a.s || a.i - b.i : a.it.group < b.it.group ? -1 : 1)).map((x) => x.it);
  }, [q, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (/input|textarea|select/i.test(el.tagName) || el.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const openIt = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('quicktravel:open', openIt);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('quicktravel:open', openIt);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    window.setTimeout(() => input.current?.focus(), 10);
    // while it's open: Escape closes it from anywhere (and never reaches the page behind),
    // Tab stays inside it, and focus goes back where it was when it closes
    const before = document.activeElement as HTMLElement | null;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', esc, true);
    const behind = [...document.body.children].filter((el) => !el.contains(dialog.current) && !el.hasAttribute('inert'));
    behind.forEach((el) => el.setAttribute('inert', ''));
    return () => {
      window.removeEventListener('keydown', esc, true);
      behind.forEach((el) => el.removeAttribute('inert'));
      before?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(shown.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      shown[active]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  let lastGroup = '';
  return (
    <div ref={dialog} className="qt" role="dialog" aria-modal="true" aria-label="Quick travel" onMouseDown={() => setOpen(false)}>
      <div className="qt-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="qt-search">
          <span className="qt-search__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onListKey}
            placeholder="Where to? Try “bricks”, “NSS” or “résumé”"
            aria-label="Search places, pages and actions"
            role="combobox"
            aria-expanded="true"
            aria-controls="qt-list"
            aria-activedescendant={shown[active] ? `qt-${shown[active].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="qt-list" id="qt-list" role="listbox">
          {shown.length === 0 && <li className="qt-empty">Nothing found. Try a place, a project or a role, like “Univest” or “magazine”.</li>}
          {shown.map((it, i) => {
            const head = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <li key={it.id} role="presentation">
                {head && <p className="qt-group">{it.group}</p>}
                <button
                  type="button"
                  id={`qt-${it.id}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'is-active' : ''}
                  onMouseEnter={() => setActive(i)}
                  onClick={it.run}
                >
                  <span className="qt-label">{it.id === 'copy' && copied ? 'Copied ✓' : it.label}</span>
                  <span className="qt-hint">{it.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="qt-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to choose · <kbd>Enter</kbd> to go
          </span>
          <span>
            <kbd>Ctrl</kbd>
            <kbd>K</kbd> anywhere
          </span>
        </p>
      </div>
    </div>
  );
}
