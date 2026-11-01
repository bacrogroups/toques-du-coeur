import type { CSSProperties } from 'react'

const CREAM = '#ffedd7'
const BARK = '#382416'
const WALNUT = '#100904'
const WOOD = '#8a6239'
const LEAF = '#5f7a3c'
const EMBER = '#dc5000'

const spin = (deg: number) => ({ '--r': `${deg}deg` }) as CSSProperties

/* Le panier : il se remplit au fil du scroll. Les [data-range] sont pilotés par useMotion. */
export function BasketScene() {
  return (
    <svg className="scene" viewBox="0 0 600 600" role="img" aria-label="Un panier solidaire qui se remplit de produits frais">
      <defs>
        <pattern id="weave" width="34" height="24" patternUnits="userSpaceOnUse">
          <rect width="34" height="24" fill="#6d4a2a" />
          <path d="M0 6h17M17 18h17" stroke="#a97c4c" strokeWidth="9" strokeLinecap="round" />
          <path d="M0 12h34M0 0h34" stroke={WALNUT} strokeOpacity=".55" strokeWidth="1.5" />
        </pattern>
      </defs>

      <g data-range="0,.1" className="fade-up">
        <ellipse cx="300" cy="560" rx="225" ry="18" fill={BARK} opacity=".7" />
        <ellipse cx="300" cy="320" rx="214" ry="50" fill="#21140a" stroke={WOOD} strokeWidth="3" />
      </g>
      <path data-range="0,.12" className="draw" pathLength={1} d="M104 322C104 40 496 40 496 322" fill="none" stroke={WOOD} strokeWidth="14" strokeLinecap="round" />

      {/* Produits : chaque groupe tombe dans le panier sur sa tranche de scroll */}
      <g transform="translate(176 262)"><g data-range=".1,.22" className="drop" style={spin(-34)}>
        <circle cx="0" cy="24" r="58" fill={LEAF} /><circle cx="-38" cy="-4" r="38" fill="#74934a" /><circle cx="34" cy="-8" r="42" fill="#6a8843" /><circle cx="0" cy="-30" r="34" fill="#86a558" />
        <path d="M-30 10q30-26 60 0M-16 34q18-18 34 0" fill="none" stroke={WALNUT} strokeOpacity=".35" strokeWidth="3" />
      </g></g>
      <g transform="translate(262 196) rotate(-14)"><g data-range=".2,.32" className="drop" style={spin(48)}>
        <path d="M-18 -60C-30 -20-14 70 0 120 14 70 30-20 18-60Q0-74-18-60Z" fill={EMBER} />
        <path d="M-14 -20h22M-8 22h18M-5 62h12" stroke={WALNUT} strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
        <path d="M0-62C-8-90-26-100-30-112M0-62C0-92 2-108 4-122M0-62C10-88 24-98 32-108" fill="none" stroke="#86a558" strokeWidth="6" strokeLinecap="round" />
      </g></g>
      <g transform="translate(346 280)"><g data-range=".3,.42" className="drop" style={spin(-52)}>
        <circle r="52" fill="#b5341a" /><circle cx="-16" cy="-16" r="14" fill={CREAM} opacity=".18" />
        <path d="M0-50l-20-8M0-50l20-8M0-50l-8-18M0-50l10-18" stroke="#74934a" strokeWidth="6" strokeLinecap="round" />
      </g></g>
      <g transform="translate(246 292)"><g data-range=".38,.5" className="drop" style={spin(40)}>
        <path d="M0-34C-22-54-58-38-54 6-50 46-20 62 0 50 20 62 50 46 54 6 58-38 22-54 0-34Z" fill="#c78a2c" />
        <path d="M0-34C0-48 6-56 14-62" fill="none" stroke={BARK} strokeWidth="6" strokeLinecap="round" />
      </g></g>
      <g transform="translate(320 170)"><g data-range=".48,.6" className="drop" style={spin(-22)}>
        <path d="M-16-96h32v22q24 18 24 46v150h-80V-28q0-28 24-46Z" fill={CREAM} />
        <rect x="-18" y="-112" width="36" height="20" rx="4" fill={EMBER} />
        <rect x="-40" y="10" width="80" height="48" fill={BARK} />
        <text x="0" y="40" textAnchor="middle" fontSize="19" fontWeight="500" fill={CREAM}>LAIT</text>
      </g></g>
      <g transform="translate(424 196) rotate(16)"><g data-range=".58,.7" className="drop" style={spin(30)}>
        <rect x="-30" y="-130" width="60" height="280" rx="30" fill="#c79a5e" />
        <path d="M-14-96l28 26M-14-40l28 26M-14 16l28 26M-14 72l28 26" stroke="#8a6239" strokeWidth="6" strokeLinecap="round" />
      </g></g>

      <g data-range="0,.1" className="fade-up">
        <path d="M86 322q214 92 428 0l-44 206q-170 56-340 0Z" fill="url(#weave)" stroke={WOOD} strokeWidth="3" />
        <path d="M86 322q214 92 428 0" fill="none" stroke="#a97c4c" strokeWidth="16" strokeLinecap="round" />
      </g>

      {/* Étiquette de prix accrochée à l'anse, puis le cœur */}
      <g data-range=".74,.84" className="swing" style={{ transformOrigin: '150px 150px' } as CSSProperties}>
        <path d="M150 150v44" stroke={CREAM} strokeWidth="2" />
        <path d="M112 194h76l18 22v96l-18 16h-76l-18-16v-96Z" fill={CREAM} />
        <circle cx="150" cy="212" r="6" fill={WALNUT} />
        <text x="150" y="276" textAnchor="middle" fontSize="50" fontWeight="500" fill={WALNUT}>5 €</text>
        <text x="150" y="304" textAnchor="middle" fontSize="13" fontWeight="500" fill={WALNUT}>LE PANIER</text>
      </g>
      <g transform="translate(528 120)"><g data-range=".84,.94" className="pop">
        <path className="beat" d="M0 24C-44-8-30-46-8-42-2-41 0-34 0-34S2-41 8-42C30-46 44-8 0 24Z" fill={EMBER} />
      </g></g>
    </svg>
  )
}

function Crate({ range, side, y, x, fruits }: { range: string; side: 'l' | 'r'; x: number; y: number; fruits: [number, number, string][] }) {
  const [a, b] = range.split(',').map(Number)
  const pop = (i: number) => `${(b + i * 0.02).toFixed(3)},${(b + 0.06 + i * 0.02).toFixed(3)}`
  return (
    <g transform={`translate(${x} ${y})`}>
      {fruits.map(([cx, cy, c], i) => <g key={i} transform={`translate(${cx} ${cy})`}><circle data-range={pop(i)} className="pop" r="23" fill={c} /></g>)}
      <g data-range={`${a},${b}`} className={'slide-' + side}>
        <rect x="-6" y="16" width="172" height="62" rx="4" fill="#6d4a2a" stroke={WOOD} strokeWidth="2" />
        <path d="M-6 36h172M-6 57h172" stroke={WALNUT} strokeWidth="4" />
      </g>
    </g>
  )
}

function Person({ range, side, x, tone }: { range: string; side: 'l' | 'r'; x: number; tone: string }) {
  return (
    <g transform={`translate(${x} 356)`}>
      <g data-range={range} className={'walk-' + side}>
        <circle cy="-104" r="30" fill={CREAM} />
        <path d="M-44 90v-120q0-44 44-44t44 44V90Z" fill={tone} stroke={CREAM} strokeOpacity=".4" strokeWidth="2" />
        <path d="M-20 88v104M20 88v104" stroke={tone} strokeWidth="26" strokeLinecap="round" />
      </g>
    </g>
  )
}

/* Le marché : l'étal se monte tout seul au fil du scroll. */
export function MarketScene() {
  const stripes = Array.from({ length: 8 }, (_, i) => i)
  const bulbs = [0, 1, 2, 3, 4, 5, 6]
  return (
    <svg className="scene wide" viewBox="0 0 900 620" role="img" aria-label="Un étal de marché solidaire qui s'installe">
      <path data-range="0,.1" className="draw" pathLength={1} d="M20 560H880" fill="none" stroke="#6c5f51" strokeWidth="2" strokeDasharray="1" />

      <Person range=".78,.92" side="l" x={70} tone="#4d3320" />
      <Person range=".82,.96" side="r" x={830} tone={BARK} />

      {/* Poteaux */}
      <rect data-range=".06,.16" className="rise" x="164" y="120" width="14" height="440" fill={WOOD} />
      <rect data-range=".08,.18" className="rise" x="722" y="120" width="14" height="440" fill={WOOD} />

      {/* Fond de l'étal, puis comptoir */}
      <rect data-range=".14,.22" className="fade" x="178" y="150" width="544" height="260" fill="#1d1109" />
      <g data-range=".2,.3" className="rise">
        <rect x="130" y="420" width="640" height="140" rx="4" fill={BARK} stroke={WOOD} strokeWidth="2" />
        <path d="M130 448h640" stroke={WOOD} strokeWidth="3" />
        <text x="450" y="514" textAnchor="middle" fontSize="30" fontWeight="500" fill={CREAM} letterSpacing="3">RÉSERVÉ AUX ADHÉRENTS</text>
      </g>

      {/* Cagettes et produits */}
      <Crate range=".34,.42" side="l" x={150} y={344} fruits={[[30, 8, EMBER], [76, 2, '#b5341a'], [122, 8, EMBER], [52, -18, '#c78a2c'], [100, -18, '#c78a2c']]} />
      <Crate range=".38,.46" side="r" x={366} y={344} fruits={[[30, 8, LEAF], [76, 2, '#74934a'], [122, 8, LEAF], [52, -18, '#86a558'], [100, -18, '#6a8843']]} />
      <Crate range=".42,.5" side="r" x={582} y={344} fruits={[[30, 8, '#c79a5e'], [76, 2, '#b5341a'], [122, 8, '#c79a5e'], [52, -18, '#b5341a'], [100, -18, '#c79a5e']]} />

      {/* Ardoise des prix */}
      <g data-range=".6,.68" className="swing" style={{ transformOrigin: '450px 210px' } as CSSProperties}>
        <path d="M410 210v34M490 210v34" stroke={CREAM} strokeWidth="2" />
        <rect x="360" y="244" width="180" height="80" rx="6" fill={WALNUT} stroke={CREAM} strokeWidth="2" />
        <text x="450" y="280" textAnchor="middle" fontSize="16" fontWeight="500" fill={CREAM}>PANIER SOLIDAIRE</text>
        <text x="450" y="310" textAnchor="middle" fontSize="24" fontWeight="500" fill={EMBER}>5 €</text>
      </g>

      {/* Auvent : les rayures se déroulent une à une */}
      {stripes.map((i) => (
        <path
          key={i}
          data-range={`${(0.16 + i * 0.02).toFixed(2)},${(0.24 + i * 0.02).toFixed(2)}`}
          className="unroll"
          d={`M${150 + i * 75} 96h75v112a37.5 24 0 0 1-75 0Z`}
          fill={i % 2 ? BARK : CREAM}
          stroke={WALNUT}
          strokeWidth="1"
        />
      ))}

      {/* Enseigne et guirlande */}
      <g data-range=".52,.6" className="fade-up">
        <rect x="240" y="30" width="420" height="58" rx="29" fill={BARK} stroke={CREAM} strokeWidth="1.5" />
        <text x="450" y="69" textAnchor="middle" fontSize="26" fontWeight="500" fill={CREAM} letterSpacing="2">MARCHÉ SOLIDAIRE</text>
      </g>
      <g data-range=".68,.78" className="fade">
        {bulbs.map((i) => (
          <g key={i} transform={`translate(${192 + i * 86} 252)`}>
            <path d="M0-14v8" stroke="#6c5f51" strokeWidth="2" />
            <circle className="bulb" style={{ animationDelay: `${i * 0.27}s` }} r="9" fill="#ffc98a" />
          </g>
        ))}
      </g>
    </svg>
  )
}
