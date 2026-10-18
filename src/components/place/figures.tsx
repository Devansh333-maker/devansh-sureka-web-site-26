import { Reveal } from './reveal';
import './figures.css';

// ─────────────────────────────────────────────
// Workshop: eco-composite bricks
// ─────────────────────────────────────────────
const MIXES = [
  { id: 'M1', plastic: 0.5, parali: 1, lime: 20, fly: 78.5, mpa: 6.0 },
  { id: 'M2', plastic: 1, parali: 2, lime: 20, fly: 77, mpa: 6.5 },
  { id: 'M3', plastic: 1.5, parali: 3, lime: 20, fly: 75.5, mpa: 4.8 },
  { id: 'M4', plastic: 2, parali: 4, lime: 20, fly: 74, mpa: 2.0 },
  { id: 'M5', plastic: 2.5, parali: 5, lime: 20, fly: 72.5, mpa: 2.5 },
];

export function StrengthChart() {
  const max = 7;
  return (
    <Reveal as="figure" className="fig fig-strength">
      <div className="fig-strength__plot">
        <div className="fig-strength__line" style={{ bottom: `${(3.5 / max) * 100}%` }}>
          <span>3.5 MPa: lowest class of common burnt clay brick (IS 1077)</span>
        </div>
        {MIXES.map((m, i) => (
          <div key={m.id} className={`fig-strength__col ${m.id === 'M2' ? 'is-peak' : ''}`}>
            <div className="fig-strength__bar" style={{ height: `${(m.mpa / max) * 100}%`, transitionDelay: `${i * 90}ms` }}>
              <span className="fig-strength__val">{m.mpa.toFixed(1)}</span>
              {/* the bar is drawn as stacked bricks */}
              <span className="fig-strength__bricks" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
      <div className="fig-strength__axis">
        {MIXES.map((m) => (
          <div key={m.id}>
            <strong>{m.id}</strong>
            <span>
              {m.plastic}% plastic · {m.parali}% parali
            </span>
          </div>
        ))}
      </div>
      <figcaption>
        Compressive strength by mix, MPa. Every mix is 20% Ca(OH)₂ with fly ash making up the rest. M2 beat the base mix: a little waste packed the matrix better. Push the
        waste higher and strength drops fast: 4.8 MPa at M3, 2.0 at M4.
      </figcaption>
    </Reveal>
  );
}

export function MixBars() {
  return (
    <Reveal as="figure" className="fig fig-mix">
      {MIXES.map((m) => (
        <div key={m.id} className="fig-mix__row">
          <span className="fig-mix__id">{m.id}</span>
          <div className="fig-mix__bar">
            <span style={{ width: `${m.fly}%` }} className="is-fly" />
            <span style={{ width: `${m.lime}%` }} className="is-lime" />
            <span style={{ width: `${m.parali * 2}%` }} className="is-parali" />
            <span style={{ width: `${m.plastic * 2}%` }} className="is-plastic" />
          </div>
        </div>
      ))}
      <figcaption className="fig-mix__key">
        <span className="is-fly">Fly ash</span>
        <span className="is-lime">Ca(OH)₂ binder</span>
        <span className="is-parali">Parali (×2 to be visible)</span>
        <span className="is-plastic">Plastic (×2)</span>
      </figcaption>
    </Reveal>
  );
}

// ─────────────────────────────────────────────
// Workshop: Akshaya Patra reject water
// ─────────────────────────────────────────────
export function Hardness() {
  const items = [
    { label: 'Raw water', ppm: 1490 },
    { label: 'Stage-1 reject after backwash', ppm: 1000 },
    { label: 'Stage-1 reject before', ppm: 550 },
    { label: 'Final RO water', ppm: 4 },
  ];
  return (
    <Reveal className="fig fig-glass">
      {items.map((it) => (
        <div key={it.label} className="fig-glass__item">
          <div className="fig-glass__glass">
            <span style={{ opacity: Math.max(0.06, it.ppm / 1600) }} />
          </div>
          <p className="fig-glass__ppm">{it.ppm.toLocaleString('en-IN')}</p>
          <p className="fig-glass__label">{it.label}</p>
        </div>
      ))}
    </Reveal>
  );
}

// ─────────────────────────────────────────────
// Studio: Spotify launch sequence
// ─────────────────────────────────────────────
export function CitySequence() {
  const years = [
    { y: 'Year 1', c: ['Delhi NCR', 'Mumbai', 'then Bengaluru'], share: '4%' },
    { y: 'Year 2', c: ['Ahmedabad', 'Pune'], share: '' },
    { y: 'Year 3', c: ['Hyderabad', 'Chennai', 'Jaipur', 'Kochi'], share: '18%' },
  ];
  return (
    <Reveal className="fig fig-cities">
      {years.map((yr) => (
        <div key={yr.y}>
          <p className="fig-cities__y">{yr.y}</p>
          <ul>
            {yr.c.map((c) => (
              <li key={c} className={c === 'Ahmedabad' ? 'is-bet' : ''}>
                {c}
              </li>
            ))}
          </ul>
          {yr.share && <p className="fig-cities__share">{yr.share} projected share</p>}
        </div>
      ))}
    </Reveal>
  );
}

// ─────────────────────────────────────────────
// Chaupal
// ─────────────────────────────────────────────
export function Ladder() {
  const rungs = ['NSS Secretary', 'Faculty in-charge', 'PARC Director', 'BITS Director'];
  return (
    <Reveal as="ol" className="fig fig-ladder">
      {rungs.map((r, i) => (
        <li key={r} style={{ marginLeft: `${i * 12}%` }}>
          <span>{String(i + 1).padStart(2, '0')}</span> {r}
        </li>
      ))}
    </Reveal>
  );
}

export function UmangBars() {
  const yrs = [
    { y: '2023–24', n: 74, s: 4 },
    { y: '2024–25', n: 102, s: 4 },
    { y: '2025–26', n: 148, s: 11 },
  ];
  return (
    <Reveal as="figure" className="fig fig-umang">
      {yrs.map((y, i) => (
        <div key={y.y} className="fig-umang__row">
          <span className="fig-umang__y">{y.y}</span>
          <div className="fig-umang__bar" style={{ width: `${(y.n / 160) * 100}%`, transitionDelay: `${i * 100}ms` }}>
            <span>{y.n} students</span>
          </div>
          <span className="fig-umang__s">{y.s} schools</span>
        </div>
      ))}
      <figcaption>Project Umang scholarships: students supported each year, from the NSS tenure report.</figcaption>
    </Reveal>
  );
}
