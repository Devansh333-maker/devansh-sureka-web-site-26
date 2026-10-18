'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CountUp } from './CountUp';

// Every role in one list, with a filter on top so a recruiter can go straight to the jobs,
// the leadership or the projects.

export type RoleKind = 'work' | 'lead' | 'project';
export type RoleRow = { when: string; what: string; detail: string; place: string; href: string; kind: RoleKind; nums?: [string, string][] };

const FILTERS: { id: RoleKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'work', label: 'Internships & roles' },
  { id: 'lead', label: 'Leadership' },
  { id: 'project', label: 'Projects & research' },
];

export function RoleArchive({ roles }: { roles: RoleRow[] }) {
  const [show, setShow] = useState<RoleKind | 'all'>('all');
  const list = show === 'all' ? roles : roles.filter((r) => r.kind === show);
  return (
    <>
      <div className="archive__filters" role="group" aria-label="Show">
        {FILTERS.map((f) => {
          const n = f.id === 'all' ? roles.length : roles.filter((r) => r.kind === f.id).length;
          return (
            <button key={f.id} type="button" aria-pressed={show === f.id} className={show === f.id ? 'is-on' : ''} onClick={() => setShow(f.id)}>
              {f.label} <span>{n}</span>
            </button>
          );
        })}
      </div>
      <ol className="archive" aria-live="polite">
        {list.map((r) => (
          <li key={r.what} className="archive__row">
            <p className="archive__when">{r.when}</p>
            <div className="archive__main">
              <h3>
                <Link href={r.href}>{r.what}</Link>
              </h3>
              <p>{r.detail}</p>
              {r.nums && (
                <div className="archive__nums">
                  {r.nums.map(([v, l]) => (
                    <span key={l}>
                      <strong>
                        <CountUp value={v} />
                      </strong>
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Link href={r.href} className="archive__place">
              {r.place} →
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
