import type { ReactNode } from 'react';
import { Reveal } from './reveal';
import './role.css';

// One template for a role: who, where and when on a card; the brief; three things I did,
// each led by what it achieved; and the numbers. House of Fandom and the venture scout
// programme use it, so the two read the same way.

export type RoleProps = {
  org: string;
  role: string;
  facts: string[]; // when, where, how I got in
  brief: ReactNode;
  did: { title: string; body: ReactNode }[];
  numbers: { value: string; label: string }[];
};

export function Role({ org, role, facts, brief, did, numbers }: RoleProps) {
  return (
    <Reveal className="role">
      <header className="role__card">
        <span className="role__mono" aria-hidden="true">
          {org
            .split(/\s+/)
            .filter((w) => /^[A-Z]/.test(w))
            .slice(0, 2)
            .map((w) => w[0])
            .join('')}
        </span>
        <div>
          <p className="role__org">{org}</p>
          <h3 className="role__title">{role}</h3>
        </div>
        <ul className="role__facts">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </header>
      <div className="role__brief">{brief}</div>
      <ol className="role__did">
        {did.map((d, i) => (
          <li key={d.title}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <h4>{d.title}</h4>
            <div>{d.body}</div>
          </li>
        ))}
      </ol>
      <dl className="role__numbers">
        {numbers.map((n) => (
          <div key={n.label}>
            <dt>{n.value}</dt>
            <dd>{n.label}</dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
