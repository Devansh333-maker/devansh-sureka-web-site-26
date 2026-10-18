import { Reveal } from './reveal';
import './hydro.css';

// Ahmedabad's IDF curves (Urban Hydrology, Project 1): how intense the rain gets for a storm
// of a given length, for storms that come every 2, 10, 25 and 100 years. Values in mm/hr from
// the 25-year NASA GPM IMERG record, station 42647.
const D = [0.5, 1, 2, 3, 6, 12, 24];
const CURVES = [
  { t: 100, v: [135.1, 112.4, 77.27, 60.54, 37.35, 26.58, 22.52] },
  { t: 25, v: [103.7, 89.35, 60.97, 47.76, 29.47, 20.96, 17.76] },
  { t: 10, v: [83.21, 73.78, 50.35, 39.45, 24.34, 17.31, 14.67] },
  { t: 2, v: [50.38, 42.71, 29.14, 22.83, 14.08, 10.02, 8.49] },
];

export function IdfChart() {
  const W = 720;
  const H = 360;
  const L = 54;
  const R = 92;
  const T = 18;
  const B = 44;
  // log scale for duration, linear for intensity
  const x = (d: number) => L + ((Math.log(d) - Math.log(0.5)) / (Math.log(24) - Math.log(0.5))) * (W - L - R);
  const y = (v: number) => T + (1 - v / 140) * (H - T - B);
  // the curves end close together, so their labels are spaced out to stay readable
  const labelY: number[] = [];
  CURVES.forEach((c, i) => labelY.push(Math.max(y(c.v[6]) + 4, i ? labelY[i - 1] + 14 : -Infinity)));
  return (
    <Reveal as="figure" className="idf">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="IDF curves for Ahmedabad: rainfall intensity falls with storm duration and rises with return period. A 1-hour storm reaches 42.7 mm/hr every 2 years and 112.4 mm/hr once in 100 years.">
        {[0, 20, 40, 60, 80, 100, 120, 140].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="idf__grid" />
            <text x={L - 10} y={y(v) + 4} textAnchor="end" className="idf__tick">
              {v}
            </text>
          </g>
        ))}
        {D.map((d) => (
          <text key={d} x={x(d)} y={H - B + 20} textAnchor="middle" className="idf__tick">
            {d < 1 ? '30 min' : `${d} h`}
          </text>
        ))}
        <text x={L} y={T - 4} className="idf__axis">
          mm / hr
        </text>
        <text x={W - R} y={H - 4} textAnchor="end" className="idf__axis">
          storm duration →
        </text>
        {CURVES.map((c, i) => (
          <g key={c.t} className={`idf__curve idf__curve--${i}`}>
            <polyline points={c.v.map((v, j) => `${x(D[j])},${y(v)}`).join(' ')} />
            {c.v.map((v, j) => (
              <circle key={j} cx={x(D[j])} cy={y(v)} r={3} />
            ))}
            <text x={x(24) + 10} y={labelY[i]}>
              {c.t}-year
            </text>
          </g>
        ))}
        {/* the number people remember */}
        <g className="idf__note">
          <line x1={x(1)} x2={x(1)} y1={y(112.4) - 8} y2={y(112.4) - 30} />
          <text x={x(1) + 6} y={y(112.4) - 32}>
            1-hour, 100-year storm: 112 mm/hr
          </text>
        </g>
      </svg>
      <figcaption>Rainfall intensity against storm length, for storms expected every 2, 10, 25 and 100 years. Ahmedabad, 25 years of NASA GPM IMERG data.</figcaption>
    </Reveal>
  );
}
