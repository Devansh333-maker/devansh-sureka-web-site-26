'use client';

import { Reveal } from './reveal';
import './water-sankey.css';

// Akshaya Patra's RO plant as a flow of water: every band is as thick as the water it
// carries, so the waste is something you can see, not a number you have to read. Water
// runs through it while it's on screen. On a phone the same story is one split bar.
// Shown in shares of the water that goes in, not the plant's own litres.

const S = 1.6; // px per percent of the inflow (in the drawing's own units)
const IN = 100;
const CLEAN = 70;
const REJECT = 20;
const LOST = 10;
const MID = IN - LOST;

// a band between two vertical spans, eased like water finding its level
function band(x0: number, t0: number, b0: number, x1: number, t1: number, b1: number) {
  const m = (x0 + x1) / 2;
  return `M${x0} ${t0} C${m} ${t0} ${m} ${t1} ${x1} ${t1} L${x1} ${b1} C${m} ${b1} ${m} ${b0} ${x0} ${b0} Z`;
}
function mid(x0: number, y0: number, x1: number, y1: number) {
  const m = (x0 + x1) / 2;
  return `M${x0} ${y0} C${m} ${y0} ${m} ${y1} ${x1} ${y1}`;
}

const TOP = 128;
const inB = TOP + IN * S;
const midB = TOP + MID * S;
const cleanB = TOP + CLEAN * S;
const N1 = [250, 282];
const N2 = [640, 672];
const OUT = 1160;

export function WaterSankey() {
  const flows = [
    { cls: 'in', d: mid(40, (TOP + inB) / 2, N1[0], (TOP + inB) / 2), w: IN * S },
    { cls: 'mid', d: mid(N1[1], (TOP + midB) / 2, N2[0], (TOP + midB) / 2), w: MID * S },
    { cls: 'clean', d: mid(N2[1], (TOP + cleanB) / 2, OUT, 112 + (CLEAN * S) / 2), w: CLEAN * S },
    { cls: 'reject', d: mid(N2[1], (cleanB + midB) / 2, 930, 392 + (REJECT * S) / 2) + ` L${OUT} ${392 + (REJECT * S) / 2}`, w: REJECT * S },
    { cls: 'lost', d: mid(N1[1], (midB + inB) / 2, 470, 420 + (LOST * S) / 2) + ` L560 ${420 + (LOST * S) / 2}`, w: LOST * S },
  ];
  return (
    <Reveal as="figure" className="fig ws">
      <svg className="ws__wide" viewBox="0 0 1200 520" role="img" aria-label="Of all the water that goes into the two-stage RO plant, about 70% comes out clean, about 20% is rejected by the second stage every day, and about 10% is unaccounted for.">
        <defs>
          <linearGradient id="ws-water" x1="0" x2="1">
            <stop offset="0" stopColor="#7fb3c9" />
            <stop offset="1" stopColor="#5c9ab6" />
          </linearGradient>
          <linearGradient id="ws-clean" x1="0" x2="1">
            <stop offset="0" stopColor="#5c9ab6" />
            <stop offset="1" stopColor="#2f7aa0" />
          </linearGradient>
          <linearGradient id="ws-reject" x1="0" x2="1">
            <stop offset="0" stopColor="#5c9ab6" />
            <stop offset="0.35" stopColor="#c46a46" />
            <stop offset="1" stopColor="#b2482a" />
          </linearGradient>
          <linearGradient id="ws-lost" x1="0" x2="1">
            <stop offset="0" stopColor="#7fb3c9" stopOpacity="0.8" />
            <stop offset="1" stopColor="#9a8f84" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the water */}
        <path className="ws__band" d={band(40, TOP, inB, N1[0], TOP, inB)} fill="url(#ws-water)" />
        <path className="ws__band" d={band(N1[1], TOP, midB, N2[0], TOP, midB)} fill="url(#ws-water)" />
        <path className="ws__band" d={band(N1[1], midB, inB, 470, 420, 420 + LOST * S) + ''} fill="url(#ws-lost)" />
        <path className="ws__band" d={`M470 420 H560 V${420 + LOST * S} H470 Z`} fill="url(#ws-lost)" opacity="0.5" />
        <path className="ws__band" d={band(N2[1], TOP, cleanB, OUT, 112, 112 + CLEAN * S)} fill="url(#ws-clean)" />
        <path className="ws__band" d={band(N2[1], cleanB, midB, 930, 392, 392 + REJECT * S) + ''} fill="url(#ws-reject)" />
        <path className="ws__band" d={`M930 392 H${OUT} V${392 + REJECT * S} H930 Z`} fill="#b2482a" />

        {/* it runs */}
        <g className="ws__flow" fill="none" strokeLinecap="round">
          {flows.map((f) => (
            <path key={f.cls} className={`ws__run ws__run--${f.cls}`} d={f.d} strokeWidth={Math.max(2, f.w * 0.06)} />
          ))}
        </g>

        {/* the two stages */}
        {[N1, N2].map(([a, b], i) => (
          <g key={i} className="ws__stage">
            <rect x={a} y={TOP - 14} width={b - a} height={(i ? MID : IN) * S + 28} rx="10" />
            <text x={(a + b) / 2} y={TOP + (i ? MID : IN) * S + 44} className="ws__tag">
              RO STAGE {i + 1}
            </text>
          </g>
        ))}
        <text x={(N1[0] + N1[1]) / 2} y={inB + 66} textAnchor="middle" className="ws__note">
          raw water in: 1,490 ppm hard
        </text>
        <text x={(N2[0] + N2[1]) / 2} y={midB + 66} textAnchor="middle" className="ws__note">
          stage-2 water out: 4 ppm
        </text>

        {/* what goes in, what comes out */}
        <g className="ws__num">
          <text x="40" y="92">
            <tspan className="ws__big">100%</tspan>
            <tspan className="ws__unit" dx="10">
              of the water in
            </tspan>
          </text>
          <text x={OUT} y="80" textAnchor="end">
            <tspan className="ws__big ws__big--clean">~70%</tspan>
            <tspan className="ws__unit" dx="10">
              clean
            </tspan>
          </text>
          <text x={OUT} y="478" textAnchor="end">
            <tspan className="ws__big ws__big--reject">~20%</tspan>
            <tspan className="ws__unit" dx="10">
              rejected, every day
            </tspan>
          </text>
          <text x={OUT} y="506" textAnchor="end" className="ws__note">
            running or not: about a fifth of everything that goes in
          </text>
          <text x="470" y="474">
            <tspan className="ws__mid">~10%</tspan>
            <tspan className="ws__unit" dx="8">
              unaccounted
            </tspan>
          </text>
        </g>
      </svg>

      {/* on a phone: the same day of water as one bar */}
      <div className="ws__narrow" aria-hidden="true">
        <p className="ws__narrow-in">
          <b>100%</b> of the water goes in
        </p>
        <div className="ws__bar">
          <span className="is-clean" style={{ flex: CLEAN }} />
          <span className="is-reject" style={{ flex: REJECT }} />
          <span className="is-lost" style={{ flex: LOST }} />
        </div>
        <ul className="ws__legend">
          <li className="is-clean">
            <b>~70%</b> comes out clean
          </li>
          <li className="is-reject">
            <b>~20%</b> rejected by stage 2, every day
          </li>
          <li className="is-lost">
            <b>~10%</b> unaccounted
          </li>
        </ul>
      </div>
      <figcaption>The kitchen’s two-stage RO plant, drawn to scale. The second stage throws water away whether the kitchen runs or not: roughly a fifth of everything that goes in.</figcaption>
    </Reveal>
  );
}
