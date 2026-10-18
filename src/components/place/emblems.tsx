import type { ZoneId } from '@/components/world/zones';
import './emblems.css';

// One fine-line drawing per place. Every stroke uses pathLength=1 so CSS can
// draw it in like a pen on drafting paper (see .emblem in figures.css).

const D = ({ d, w, k }: { d: string; w?: number; k?: number }) => (
  <path d={d} pathLength={1} strokeWidth={w} style={k !== undefined ? ({ ['--k' as string]: k } as React.CSSProperties) : undefined} />
);

function Jharokha() {
  const diamonds = Array.from({ length: 10 }).map((_, i) => {
    const x = 92 + i * 15;
    return `M${x} 246 L${x + 7} 254 L${x} 262 L${x - 7} 254 Z`;
  });
  return (
    <>
      {/* chhatri dome and finial */}
      <D d="M100 110 C100 58 220 58 220 110" k={0} />
      <D d="M160 64 L160 38 M153 40 L167 40" k={1} />
      <circle cx="160" cy="48" r="4" pathLength={1} style={{ ['--k' as string]: 1 } as React.CSSProperties} />
      {/* sloping chhajja eave */}
      <D d="M56 110 L264 110 L244 126 L76 126 Z" k={2} />
      {/* paired pillars */}
      <D d="M96 126 V240 M104 126 V240 M216 126 V240 M224 126 V240" k={3} />
      {/* cusped (multifoil) arch */}
      <D d="M104 204 C104 172 118 162 128 160 C126 151 134 145 143 147 C147 136 173 136 177 147 C186 145 194 151 192 160 C202 162 216 172 216 204" k={4} />
      {/* balcony with jaali */}
      <D d="M80 240 H240 V270 H80 Z" k={5} />
      <D d={diamonds.join(' ')} w={1} k={6} />
      {/* corbels */}
      <D d="M90 270 C90 290 106 294 110 302 M160 270 C160 290 176 294 180 302 M230 270 C230 290 214 294 210 302" k={7} />
    </>
  );
}

function Pavilion() {
  const slats = Array.from({ length: 11 }).map((_, i) => `M${100 + i * 14} 128 V246`).join(' ');
  return (
    <>
      <D d="M36 96 C86 56 128 136 178 96 C228 56 258 116 292 86" k={0} />
      <D d="M36 108 C86 68 128 148 178 108 C228 68 258 128 292 98" k={1} />
      <D d="M68 112 V250 M262 104 V250" k={2} />
      <D d={slats} w={1} k={3} />
      <D d="M30 250 H296 M44 262 H284" k={4} />
      <D d="M118 210 H212 M126 210 V250 M204 210 V250" k={5} />
      <D d="M140 176 H182 V202 H140 Z M161 202 V210" k={6} />
      <D d="M150 186 L158 194 L170 182" w={1} k={7} />
    </>
  );
}

function Neem() {
  return (
    <>
      <D d="M50 250 C50 236 270 236 270 250 C270 264 50 264 50 250 Z" k={0} />
      <D d="M50 250 V262 C50 276 270 276 270 262 V250" k={1} />
      <D d="M154 246 C152 212 150 192 138 172 M166 246 C168 212 172 190 184 170 M160 210 C150 196 128 186 112 182 M164 200 C178 188 198 184 214 186" k={2} />
      <D d="M90 168 C70 160 72 132 94 128 C92 104 120 92 138 104 C146 80 184 80 192 102 C212 92 238 108 230 130 C252 134 254 162 232 170 C228 186 204 192 190 182 C176 194 146 196 132 184 C116 194 92 186 90 168 Z" k={3} />
      <D d="M110 140 l6 -4 M128 120 l6 -5 M160 110 l5 -6 M196 124 l6 -4 M214 150 l6 -2 M150 150 l5 -5 M180 152 l6 -4" w={1} k={4} />
      {/* charpai */}
      <D d="M64 230 L132 224 L150 238 L82 244 Z M70 233 L140 228 M76 238 L146 233" w={1} k={5} />
      <D d="M82 244 V254 M150 238 V248 M64 230 V240" k={5} />
      {/* matka */}
      <D d="M224 236 C210 236 210 218 224 214 C238 218 238 236 224 236 Z M219 214 V208 H229 V214" k={6} />
    </>
  );
}

function Skate() {
  return (
    <>
      <D d="M90 214 L90 120 C90 110 100 104 112 104 L150 104 C158 104 162 112 160 120 L156 168 C190 170 230 178 250 194 C258 202 256 212 246 214 Z" k={0} />
      <D d="M118 112 L146 120 M118 124 L146 132 M118 136 L146 144 M118 148 L146 156" w={1} k={1} />
      <D d="M96 222 H248" k={2} />
      <D d="M112 222 L106 232 L132 232 L126 222 M212 222 L206 232 L232 232 L226 222" k={3} />
      <circle cx="108" cy="244" r="15" pathLength={1} style={{ ['--k' as string]: 4 } as React.CSSProperties} />
      <circle cx="140" cy="244" r="15" pathLength={1} style={{ ['--k' as string]: 4 } as React.CSSProperties} />
      <circle cx="204" cy="244" r="15" pathLength={1} style={{ ['--k' as string]: 4 } as React.CSSProperties} />
      <circle cx="236" cy="244" r="15" pathLength={1} style={{ ['--k' as string]: 4 } as React.CSSProperties} />
      <D d="M250 216 C262 216 266 230 254 234 L246 232" k={5} />
      <circle cx="262" cy="116" r="30" pathLength={1} style={{ ['--k' as string]: 6 } as React.CSSProperties} />
      <D d="M234 104 C252 116 272 116 290 104 M240 136 C256 124 272 124 286 136 M262 86 V146" w={1} k={7} />
      <D d="M36 268 H300" w={1} k={7} />
      <text x="176" y="196" className="emblem__num">
        5
      </text>
    </>
  );
}

function Press() {
  return (
    <>
      <D d="M56 262 H264 M70 232 H250 M70 242 H250" k={0} />
      <D d="M108 232 V122 C108 78 212 78 212 122 V232" k={1} />
      <D d="M122 232 V126 C122 98 198 98 198 126 V232" w={1} k={2} />
      <D d="M118 190 H202 V204 H118 Z" k={3} />
      <D d="M160 124 V190" k={4} />
      <D d="M160 150 L246 118" k={5} />
      <circle cx="250" cy="116" r="6" pathLength={1} style={{ ['--k' as string]: 5 } as React.CSSProperties} />
      <D d="M76 222 H134 V230 H76 Z" w={1} k={6} />
      <circle cx="90" cy="212" r="8" pathLength={1} style={{ ['--k' as string]: 6 } as React.CSSProperties} />
      <D d="M82 262 V284 M238 262 V284" k={7} />
    </>
  );
}

function Notebook() {
  return (
    <>
      <D d="M238 92 C226 52 160 44 128 76 C96 108 104 160 146 178 C186 196 232 174 244 132" w={5} k={0} />
      <D d="M56 226 L160 242 L160 294 L56 278 Z M160 242 L264 226 L264 280 L160 294" k={2} />
      <D d="M70 240 L146 252 M70 250 L146 262 M70 260 L130 270 M174 252 L250 240 M174 262 L250 250" w={1} k={3} />
      <D d="M188 214 L254 166 L262 172 L196 220 Z M188 214 L184 226 L196 220" k={4} />
      <D d="M268 268 H290 V290 H268 Z" k={5} />
    </>
  );
}

const DRAW: Record<ZoneId, () => React.ReactElement> = {
  workshop: Jharokha,
  studio: Pavilion,
  commons: Neem,
  arena: Skate,
  press: Press,
  notebook: Notebook,
};

export function Emblem({ place, className = '', label }: { place: ZoneId; className?: string; label?: string }) {
  const Art = DRAW[place];
  return (
    <svg viewBox="0 0 320 320" className={`emblem ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <Art />
      </g>
    </svg>
  );
}
