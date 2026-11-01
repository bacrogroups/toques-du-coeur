import type { CSSProperties, ReactNode } from 'react'

const INK = '#2b2320'
const ROSE = '#c92a64'
const HEART = 'M0 12C-15 1-21-7-13-13-7-17-2-13 0-9 2-13 7-17 13-13 21-7 15 1 0 12Z'

const spin = (deg: number) => ({ '--r': `${deg}deg` }) as CSSProperties

const stop = (o: number, c: string) => <stop offset={o} stopColor={c} />

/* Dégradés partagés par les deux scènes : ils donnent le volume aux illustrations. */
export function SharedDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="gTomato" cx=".35" cy=".3" r=".8">{stop(0, '#ff8a66')}{stop(.5, '#e6432f')}{stop(1, '#a81f1f')}</radialGradient>
        <radialGradient id="gApple" cx=".35" cy=".3" r=".85">{stop(0, '#ffe08a')}{stop(.55, '#f4a62a')}{stop(1, '#d9601e')}</radialGradient>
        <linearGradient id="gCarrot" x1="0" x2="1">{stop(0, '#ffa64d')}{stop(.5, '#f47b20')}{stop(1, '#cf5a10')}</linearGradient>
        <radialGradient id="gLeaf" cx=".4" cy=".3" r=".9">{stop(0, '#b7dd7a')}{stop(.6, '#6fb04a')}{stop(1, '#3d8a3f')}</radialGradient>
        <radialGradient id="gLeaf2" cx=".5" cy=".3" r=".9">{stop(0, '#a3d36b')}{stop(1, '#2f8f5b')}</radialGradient>
        <radialGradient id="gFloret" cx=".4" cy=".3" r=".8">{stop(0, '#fffdf3')}{stop(1, '#ecdcae')}</radialGradient>
        <linearGradient id="gBread" x1="0" x2="1">{stop(0, '#f0c27a')}{stop(.5, '#d9963f')}{stop(1, '#b06f24')}</linearGradient>
        <linearGradient id="gGlass" x1="0" x2="1">{stop(0, '#e9eef0')}{stop(.3, '#ffffff')}{stop(1, '#d6dfe2')}</linearGradient>
        <linearGradient id="gSoup" x1="0" y1="0" x2="0" y2="1">{stop(0, '#fbd98c')}{stop(1, '#ee9d3d')}</linearGradient>
        <linearGradient id="gWicker" x1="0" y1="0" x2="0" y2="1">{stop(0, '#e9bd82')}{stop(1, '#b67c3f')}</linearGradient>
        <linearGradient id="gRim" x1="0" y1="0" x2="0" y2="1">{stop(0, '#f2cd97')}{stop(1, '#c08848')}</linearGradient>
        <linearGradient id="gShade" x1="0" x2="1">
          <stop offset="0" stopColor="#5b3412" stopOpacity=".55" /><stop offset=".3" stopColor="#5b3412" stopOpacity="0" />
          <stop offset=".72" stopColor="#5b3412" stopOpacity="0" /><stop offset="1" stopColor="#5b3412" stopOpacity=".6" />
        </linearGradient>
        <linearGradient id="gRose" x1="0" y1="0" x2="0" y2="1">{stop(0, '#e24f86')}{stop(1, '#c92a64')}</linearGradient>
        <linearGradient id="gCream" x1="0" y1="0" x2="0" y2="1">{stop(0, '#fff8ee')}{stop(1, '#f3e3cc')}</linearGradient>
        <linearGradient id="gWood" x1="0" x2="1">{stop(0, '#c99a62')}{stop(1, '#a6743d')}</linearGradient>
        <linearGradient id="gCrate" x1="0" y1="0" x2="0" y2="1">{stop(0, '#e6bb82')}{stop(1, '#c8935a')}</linearGradient>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">{stop(0, '#cdeef6')}{stop(1, '#fdf6e6')}</linearGradient>
        <radialGradient id="gSun" cx=".5" cy=".5" r=".5">{stop(0, '#ffe08a')}{stop(1, '#ffc83d')}</radialGradient>
        <radialGradient id="gHalo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffc83d" stopOpacity=".55" /><stop offset="1" stopColor="#ffc83d" stopOpacity="0" />
        </radialGradient>
        <pattern id="gingham" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#fff" />
          <rect width="12" height="24" fill="#c92a64" opacity=".28" /><rect width="24" height="12" fill="#c92a64" opacity=".28" />
        </pattern>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
    </svg>
  )
}

/* ─────────────── Produits ─────────────── */
function Tomato({ r = 44 }: { r?: number }) {
  return (
    <g transform={`scale(${r / 44})`}>
      <circle r="44" fill="url(#gTomato)" />
      <ellipse cx="-15" cy="-16" rx="11" ry="7" fill="#fff" opacity=".4" transform="rotate(-30 -15 -16)" />
      <path d="M0-42l7 10 13-3-7 11 11 7-14-1-5 12-5-12-14 1 11-7-7-11 13 3Z" fill="#3d8a3f" transform="translate(0 2) scale(.7)" />
    </g>
  )
}
function Apple({ r = 44 }: { r?: number }) {
  return (
    <g transform={`scale(${r / 44})`}>
      <path d="M0-30C-20-50-52-36-48 4-44 42-18 54 0 44 18 54 44 42 48 4 52-36 20-50 0-30Z" fill="url(#gApple)" />
      <ellipse cx="-20" cy="-12" rx="9" ry="14" fill="#fff" opacity=".35" transform="rotate(20 -20 -12)" />
      <path d="M0-32C0-44 5-50 12-55" fill="none" stroke="#7a4a1e" strokeWidth="6" strokeLinecap="round" />
      <path d="M6-44C18-62 36-58 42-52 30-40 16-38 6-44Z" fill="url(#gLeaf)" />
    </g>
  )
}
function Carrot() {
  return (
    <g>
      <path d="M0-74C-10-104-26-114-34-130M0-74C0-104 2-124 6-140M0-74C10-102 26-112 36-124" fill="none" stroke="#6fb04a" strokeWidth="8" strokeLinecap="round" />
      <path d="M-24-70C-34-30-12 66 0 112 12 66 34-30 24-70Q0-86-24-70Z" fill="url(#gCarrot)" />
      <path d="M-20-34q12 6 22 0M-13 8q10 5 20 0M-8 48q7 4 13 0" fill="none" stroke="#b64e0c" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}
function Lettuce({ s = 1 }: { s?: number }) {
  const leaf = 'M0 44C-44 44-74 8-58-26-52-42-36-38-30-48-20-62-4-50 2-56 12-64 26-54 34-46 50-40 62-22 56 2 50 30 28 44 0 44Z'
  return (
    <g transform={`scale(${s})`}>
      <path d={leaf} fill="url(#gLeaf2)" transform="translate(-34 8) rotate(-24) scale(.92)" />
      <path d={leaf} fill="url(#gLeaf2)" transform="translate(36 10) rotate(26) scale(.9)" />
      <path d={leaf} fill="url(#gLeaf)" transform="translate(0 -8)" />
      <path d="M0 36C-4 8-2-22 0-44M0 8C-14-2-26-6-36-20M0-4C12-12 22-20 32-30" fill="none" stroke="#e8f5c8" strokeOpacity=".75" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}
function Cauliflower({ s = 1 }: { s?: number }) {
  const florets: [number, number, number][] = [[-38, 6, 26], [38, 6, 26], [-20, -22, 28], [22, -22, 28], [0, 8, 30], [0, -40, 24], [-44, -20, 18], [44, -20, 18]]
  return (
    <g transform={`scale(${s})`}>
      <path d="M-74 10C-82-30-62-54-46-40-34 0-20 40 0 50-40 56-70 40-74 10Z" fill="url(#gLeaf2)" />
      <path d="M74 10C82-30 62-54 46-40 34 0 20 40 0 50 40 56 70 40 74 10Z" fill="url(#gLeaf2)" />
      {florets.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="url(#gFloret)" />)}
      <path d="M-46 40C-30 62 30 62 46 40 30 46-30 46-46 40Z" fill="#3d8a3f" />
    </g>
  )
}
function Baguette() {
  return (
    <g>
      <rect x="-31" y="-150" width="62" height="300" rx="31" fill="url(#gBread)" />
      {[-104, -48, 8, 64].map((y) => <path key={y} d={`M-13 ${y + 22}q14-26 26-44`} fill="none" stroke="#fbe6bd" strokeWidth="8" strokeLinecap="round" />)}
    </g>
  )
}
function Milk() {
  return (
    <g>
      <path d="M-18-108h36v28q28 22 28 54v130q0 18-18 18h-56q-18 0-18-18V-26q0-32 28-54Z" fill="url(#gGlass)" stroke="#d6dfe2" strokeWidth="2" />
      <rect x="-21" y="-122" width="42" height="24" rx="7" fill={ROSE} />
      <rect x="-46" y="-6" width="92" height="74" fill="#fff" />
      <rect x="-46" y="-6" width="92" height="10" fill={ROSE} />
      <text y="46" textAnchor="middle" fontSize="23" fontWeight="800" fill={INK}>Lait</text>
    </g>
  )
}
function SoupJar() {
  return (
    <g>
      <path d="M-58-58h116v128q0 18-18 18h-80q-18 0-18-18Z" fill="url(#gSoup)" />
      <path d="M-44-44v104" stroke="#fff" strokeOpacity=".55" strokeWidth="9" strokeLinecap="round" />
      <path d="M-66-92h132l6 36q-72 16-144 0Z" fill="url(#gingham)" stroke={ROSE} strokeOpacity=".4" />
      <path d="M-62-62q62 12 124 0" fill="none" stroke={ROSE} strokeWidth="4" />
      <rect x="-40" y="-14" width="80" height="48" rx="8" fill="#fff" />
      <text y="6" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>Soupe</text>
      <text y="24" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>maison</text>
    </g>
  )
}

/* ─────────────── Panier ─────────────── */
const CX = 320
const RIM_Y = 342
const RX = 244
const RY = 58

function rimBraid(from: number, to: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = from + ((to - from) * (i + 0.5)) / n
    const x = CX + RX * Math.cos(a)
    const y = RIM_Y + RY * Math.sin(a)
    const tangent = (Math.atan2(RY * Math.cos(a), -RX * Math.sin(a)) * 180) / Math.PI
    return <rect key={i} x="-27" y="-12" width="54" height="24" rx="12" fill="url(#gRim)" stroke="#9c6b34" strokeWidth="1.5" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(tangent + 28).toFixed(1)})`} />
  })
}

function wickerRows() {
  const out: ReactNode[] = []
  for (let row = 0; row < 11; row++) {
    const y = 372 + row * 25
    for (let col = -7; col <= 7; col++) {
      const x = CX + col * 58 + (row % 2 ? 29 : 0)
      const n = (x - CX) / 270
      const dy = (1 - n * n) * 26
      out.push(<rect key={`${row}-${col}`} x={x - 27} y={y + dy - 10} width="54" height="21" rx="10.5" fill="url(#gWicker)" stroke="#8f5e2c" strokeWidth="1.2" transform={`rotate(${(-n * 11).toFixed(1)} ${x} ${y + dy})`} />)
    }
  }
  return out
}

const BODY = `M${CX - RX} ${RIM_Y}C${CX - RX + 8} 450 ${CX - 196} 560 ${CX - 150} 592Q${CX} 622 ${CX + 150} 592C${CX + 196} 560 ${CX + RX - 8} 450 ${CX + RX} ${RIM_Y}A${RX} ${RY} 0 0 1 ${CX - RX} ${RIM_Y}Z`
const HANDLE = `M${CX - 216} ${RIM_Y}C${CX - 216} 30 ${CX + 216} 30 ${CX + 216} ${RIM_Y}`

function Item({ x, y, rot = 0, range, r, children }: { x: number; y: number; rot?: number; range: string; r: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g data-range={range} className="drop" style={spin(r)}>{children}</g>
    </g>
  )
}

/* Le panier : il se remplit au fil du scroll. Les [data-range] sont pilotés par useMotion. */
export function BasketScene() {
  const hearts: [number, number, number, number][] = [[80, 150, 1.1, 0], [560, 96, 1.5, 1.3], [46, 300, .8, 2.2], [600, 250, .9, .7], [130, 60, 1, 3]]
  return (
    <svg className="scene" viewBox="0 0 640 640" role="img" aria-label="Un panier solidaire qui se remplit de produits frais">
      <defs>
        <clipPath id="bodyClip"><path d={BODY} /></clipPath>
        <mask id="handleMask" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="640">
          <path data-range="0,.1" className="draw" pathLength={1} d={HANDLE} fill="none" stroke="#fff" strokeWidth="40" strokeLinecap="round" />
        </mask>
      </defs>

      {/* Soleil de fond et ombre au sol */}
      <g transform="translate(320 300)">
        <circle data-range="0,.08" className="pop" r="282" fill="#fff0c2" />
      </g>
      <g data-range="0,.08" className="fade">
        <ellipse cx={CX} cy="612" rx="230" ry="20" fill="#7a5a2c" opacity=".28" filter="url(#soft)" />
      </g>

      {/* Dos du panier */}
      <g data-range="0,.08" className="fade-up">
        <ellipse cx={CX} cy={RIM_Y} rx={RX} ry={RY} fill="#7a4d22" />
        <ellipse cx={CX} cy={RIM_Y + 6} rx={RX - 16} ry={RY - 12} fill="#54320f" />
        {rimBraid(Math.PI, 2 * Math.PI, 26)}
      </g>
      <g mask="url(#handleMask)">
        <path d={HANDLE} fill="none" stroke="#9c6b34" strokeWidth="30" strokeLinecap="round" />
        <path d={HANDLE} fill="none" stroke="#e9bd82" strokeWidth="24" strokeLinecap="round" />
        <path d={HANDLE} fill="none" stroke="#b67c3f" strokeWidth="24" strokeDasharray="5 19" pathLength={560} />
      </g>

      {/* Produits, de l'arrière vers l'avant */}
      <Item x={462} y={208} rot={17} range=".1,.2" r={26}><Baguette /></Item>
      <Item x={214} y={214} rot={-20} range=".18,.28" r={-40}><Carrot /></Item>
      <Item x={166} y={232} rot={-34} range=".2,.3" r={36}><Carrot /></Item>
      <Item x={382} y={218} rot={5} range=".26,.36" r={-24}><Milk /></Item>
      <Item x={286} y={262} rot={-4} range=".34,.44" r={22}><SoupJar /></Item>
      <Item x={160} y={318} rot={-8} range=".42,.52" r={-34}><Lettuce s={1.08} /></Item>
      <Item x={302} y={342} range=".5,.6" r={30}><Cauliflower s={1.02} /></Item>
      <Item x={446} y={336} range=".56,.64" r={-60}><Tomato r={46} /></Item>
      <Item x={392} y={362} range=".6,.68" r={50}><Apple r={40} /></Item>
      <Item x={492} y={356} range=".62,.7" r={-44}><Tomato r={32} /></Item>

      {/* Devant du panier */}
      <g data-range="0,.08" className="fade-up">
        <g clipPath="url(#bodyClip)">
          <path d={BODY} fill="#8f5e2c" />
          {wickerRows()}
          <path d={BODY} fill="url(#gShade)" />
        </g>
        <path d={`M${CX + 40} 396q70 6 150-30l-16 76q-70 52-146 40Z`} fill="url(#gingham)" stroke="#fff" strokeWidth="2" />
        {rimBraid(0, Math.PI, 26)}
      </g>

      {/* Étiquette suspendue au bord du panier */}
      <g transform="translate(30 192)">
        <g data-range=".72,.82" className="swing" style={{ transformOrigin: '150px 198px' } as CSSProperties}>
          <g className="sway" style={{ '--o': '150px 198px' } as CSSProperties}>
            <path d="M150 196v20" fill="none" stroke={ROSE} strokeWidth="4" strokeLinecap="round" />
            <circle cx="150" cy="284" r="72" fill={ROSE} />
            <circle cx="150" cy="284" r="61" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="5 6" />
            <text x="150" y="298" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="50" fontWeight="600" fill="#fff">5 €</text>
            <text x="150" y="322" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">le panier</text>
          </g>
        </g>
      </g>

      {/* Cœurs qui s'envolent */}
      <g data-range=".84,.92" className="fade">
        {hearts.map(([x, y, s, w]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
            <path className="float" style={{ '--w': `${w}s` } as CSSProperties} d={HEART} fill={ROSE} />
          </g>
        ))}
      </g>
      <g transform="translate(320 66) scale(2.1)"><g data-range=".84,.94" className="pop"><path className="beat" d={HEART} fill={ROSE} /></g></g>
    </svg>
  )
}

/* ─────────────── Marché ─────────────── */
function Crate({ x, y, range, children }: { x: number; y: number; range: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {children}
      <g data-range={range} className="fade-up">
        <path d="M-6 0h192l-10 74H4Z" fill="url(#gCrate)" stroke="#a6743d" strokeWidth="2" />
        <path d="M-3 24h186M1 50h178" stroke="#a6743d" strokeWidth="3" />
        <rect x="58" y="30" width="64" height="30" rx="8" fill="#fff" />
        <path d={HEART} fill={ROSE} transform="translate(90 45) scale(.72)" />
      </g>
    </g>
  )
}

function Pop({ x, y, range, children }: { x: number; y: number; range: string; children: ReactNode }) {
  return <g transform={`translate(${x} ${y})`}><g data-range={range} className="pop">{children}</g></g>
}

function Face({ r, skin, hair, children }: { r: number; skin: string; hair: ReactNode; children?: ReactNode }) {
  return (
    <g>
      <circle r={r} fill={skin} />
      {hair}
      <circle cx={-r * .36} cy={r * .02} r={r * .085} fill={INK} />
      <circle cx={r * .36} cy={r * .02} r={r * .085} fill={INK} />
      <circle cx={-r * .58} cy={r * .3} r={r * .16} fill="#f28aa8" opacity=".5" />
      <circle cx={r * .58} cy={r * .3} r={r * .16} fill="#f28aa8" opacity=".5" />
      <path d={`M${-r * .32} ${r * .3}Q0 ${r * .68} ${r * .32} ${r * .3}`} fill="none" stroke={INK} strokeWidth={r * .08} strokeLinecap="round" />
      {children}
    </g>
  )
}

/* Bénévole en toque, derrière l'étal */
function Volunteer({ x, range, skin, apron }: { x: number; range: string; skin: string; apron: string }) {
  return (
    <g transform={`translate(${x} 276)`}>
      <g data-range={range} className="fade-up">
        <path d="M-58 130V62q0-42 58-42t58 42v68Z" fill="#fff" stroke="#eadfce" strokeWidth="2" />
        <path d="M-32 130V54q32 14 64 0v76Z" fill={apron} />
        <path d="M-32 54C-30 36-22 26-14 22M32 54C30 36 22 26 14 22" fill="none" stroke={apron} strokeWidth="6" />
        <Face r={36} skin={skin} hair={null}>
          <path d="M-34-20h68v-12q20-10 12-30-8-16-24-10-10-16-22-16t-22 16q-16-6-24 10-8 20 12 30Z" fill="#fff" stroke="#eadfce" strokeWidth="2" />
        </Face>
      </g>
    </g>
  )
}

/* Famille qui arrive au marché */
function Parent({ x, y, range, side, skin, top, hairColor }: { x: number; y: number; range: string; side: 'l' | 'r'; skin: string; top: string; hairColor: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-range={range} className={'walk-' + side}>
        <g className="step-bob">
          <path d="M-20 62v66M20 62v66" stroke="#4a5d7a" strokeWidth="24" strokeLinecap="round" />
          <path d="M-40 74V-14q0-34 40-34t40 34v88q-40 12-80 0Z" fill={top} />
          <path d="M44-6l10 54" stroke={top} strokeWidth="18" strokeLinecap="round" />
          <path d="M38 40h34l5 50H33Z" fill="#fff" stroke="#eadfce" strokeWidth="2" />
          <path d="M44 40q11-18 22 0" fill="none" stroke={ROSE} strokeWidth="3.5" />
          <path d={HEART} fill={ROSE} transform="translate(55 66) scale(.6)" />
          <g transform="translate(0 -84)">
            <Face r={36} skin={skin} hair={<path d="M-37 2C-44-46 44-46 37 2 26-14 10-22-8-20-20-18-30-10-37 2Z" fill={hairColor} />} />
          </g>
        </g>
      </g>
    </g>
  )
}
function Child({ x, y, range, side, skin, top, hairColor }: { x: number; y: number; range: string; side: 'l' | 'r'; skin: string; top: string; hairColor: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-range={range} className={'walk-' + side}>
        <g className="step-bob" style={{ animationDelay: '-.4s' }}>
          <path d="M-12 42v34M12 42v34" stroke="#4a5d7a" strokeWidth="16" strokeLinecap="round" />
          <path d="M-26 50V-4q0-22 26-22t26 22v54q-26 8-52 0Z" fill={top} />
          <g transform="translate(0 -54)">
            <Face r={28} skin={skin} hair={<path d="M-29 2C-34-36 34-36 29 2 16-14-14-14-29 2Z" fill={hairColor} />} />
          </g>
        </g>
      </g>
    </g>
  )
}

function Bunting({ x1, x2, y, sag, base }: { x1: number; x2: number; y: number; sag: number; base: number }) {
  const colors = [ROSE, '#ffc83d', '#2f8f5b', '#fff', '#5bb7cf']
  const n = 6
  return (
    <g>
      <path data-range={`${base},${base + .06}`} className="draw" pathLength={1} d={`M${x1} ${y}Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}`} fill="none" stroke="#8a7a6d" strokeWidth="2" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + .5) / n
        const x = x1 + (x2 - x1) * t
        const yy = y + 4 * sag * t * (1 - t)
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${yy.toFixed(1)})`}>
            <path data-range={`${(base + .03 + i * .012).toFixed(3)},${(base + .07 + i * .012).toFixed(3)}`} className="unroll" d="M-13 0h26L0 32Z" fill={colors[i % colors.length]} stroke="#eadfce" />
          </g>
        )
      })}
    </g>
  )
}

/* Le marché : l'étal se monte au fil du scroll, dans un paysage de corons et de terrils. */
export function MarketScene() {
  const stripes = Array.from({ length: 8 }, (_, i) => i)
  const stripe = (i: number) => {
    const top = 196 + i * 71
    const bot = 148 + i * 83
    return `M${top} 96H${top + 71}L${bot + 83} 216a41.5 26 0 0 1-83 0Z`
  }
  const bulbs = [0, 1, 2, 3, 4, 5, 6]
  const houses = [0, 1, 2, 3, 4, 5, 6, 7]
  const hearts: [number, number, number][] = [[250, 330, 0], [700, 320, 1.4], [480, 300, 2.5], [120, 300, .8], [850, 310, 3.1]]
  return (
    <svg className="scene wide" viewBox="0 0 960 640" role="img" aria-label="Un étal de marché solidaire qui s'installe sous le soleil">
      <defs>
        <clipPath id="skyClip"><rect x="10" y="10" width="940" height="600" rx="56" /></clipPath>
      </defs>

      {/* Paysage */}
      <g clipPath="url(#skyClip)">
        <rect x="10" y="10" width="940" height="600" fill="url(#gSky)" />
        <circle cx="770" cy="118" r="120" fill="url(#gHalo)" />
        <circle cx="770" cy="118" r="50" fill="url(#gSun)" />
        <g fill="#fff" opacity=".9">
          <g className="cloud"><ellipse cx="130" cy="96" rx="58" ry="20" /><ellipse cx="108" cy="82" rx="30" ry="22" /><ellipse cx="150" cy="78" rx="34" ry="26" /></g>
          <g className="cloud b"><ellipse cx="560" cy="58" rx="44" ry="14" /><ellipse cx="546" cy="46" rx="24" ry="16" /><ellipse cx="578" cy="44" rx="26" ry="18" /></g>
        </g>
        <path d="M-20 420Q140 170 330 420Z" fill="#b9d3a6" />
        <path d="M640 420Q820 210 990 420Z" fill="#a7c896" />
        <path d="M250 420Q330 300 440 420Z" fill="#c9dfb8" />
        {houses.map((i) => (
          <g key={i} transform={`translate(${30 + i * 118} 372)`}>
            <path d="M0 40L54 0l54 40v88H0Z" fill={i % 2 ? '#e6a98c' : '#dd9676'} />
            <path d="M-6 44L54-6l60 50" fill="none" stroke="#a96a54" strokeWidth="10" strokeLinejoin="round" />
            <rect x="16" y="58" width="26" height="30" rx="4" fill="#fdf6e6" />
            <rect x="66" y="58" width="26" height="30" rx="4" fill="#fdf6e6" />
          </g>
        ))}
        <rect x="10" y="470" width="940" height="140" fill="#f3e6cf" />
        <path d="M10 472H950" stroke="#e4d2b4" strokeWidth="4" />
      </g>

      <Bunting x1={40} x2={204} y={150} sag={22} base={.68} />
      <Bunting x1={756} x2={920} y={150} sag={22} base={.71} />

      {/* Poteaux */}
      <rect data-range=".05,.13" className="rise" x="196" y="110" width="16" height="470" rx="6" fill="url(#gWood)" />
      <rect data-range=".07,.15" className="rise" x="748" y="110" width="16" height="470" rx="6" fill="url(#gWood)" />

      {/* Guirlande d'ampoules */}
      <g data-range=".66,.74" className="fade">
        <path d="M212 262Q480 310 748 262" fill="none" stroke="#8a7a6d" strokeWidth="2" />
        {bulbs.map((i) => {
          const t = (i + 1) / 8
          return <circle key={i} className="bulb" style={{ animationDelay: `${i * .27}s` }} cx={212 + 536 * t} cy={262 + 96 * t * (1 - t) + 9} r="8" fill="#ffc83d" stroke="#fff" />
        })}
      </g>

      {/* Bénévoles derrière l'étal */}
      <Volunteer x={344} range=".58,.65" skin="#f1c5a3" apron={ROSE} />
      <Volunteer x={612} range=".61,.68" skin="#8d5a3c" apron="#2f8f5b" />

      {/* Cagettes et produits */}
      <Crate x={222} y={376} range=".34,.4">
        <Pop x={48} y={-6} range=".42,.46"><Tomato r={30} /></Pop>
        <Pop x={92} y={-8} range=".43,.47"><Tomato r={30} /></Pop>
        <Pop x={136} y={-6} range=".44,.48"><Tomato r={30} /></Pop>
        <Pop x={70} y={-38} range=".45,.49"><Tomato r={28} /></Pop>
        <Pop x={114} y={-38} range=".46,.5"><Tomato r={28} /></Pop>
      </Crate>
      <Crate x={384} y={376} range=".37,.43">
        <Pop x={52} y={-18} range=".47,.51"><Lettuce s={.52} /></Pop>
        <Pop x={130} y={-18} range=".49,.53"><Lettuce s={.52} /></Pop>
        <Pop x={92} y={-30} range=".51,.55"><Cauliflower s={.62} /></Pop>
      </Crate>
      <Crate x={546} y={376} range=".4,.46">
        <Pop x={46} y={-6} range=".52,.56"><Apple r={28} /></Pop>
        <Pop x={92} y={-8} range=".53,.57"><Apple r={28} /></Pop>
        <Pop x={138} y={-6} range=".54,.58"><Apple r={28} /></Pop>
        <Pop x={70} y={-38} range=".55,.59"><Apple r={26} /></Pop>
        <Pop x={116} y={-38} range=".56,.6"><Apple r={26} /></Pop>
      </Crate>

      {/* Table et nappe */}
      <g data-range=".14,.24" className="fade-up">
        <rect x="170" y="440" width="620" height="16" rx="6" fill="url(#gWood)" />
        <path d="M178 456H782V516a31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0 31 18 0 0 1-62 0Z" fill="url(#gingham)" stroke="#e7b9ca" strokeWidth="2" />
      </g>
      <g transform="translate(480 488)"><g data-range=".62,.7" className="pop">
        <rect x="-136" y="-26" width="272" height="52" rx="26" fill="#fff" stroke="#eadfce" strokeWidth="2" />
        <text y="8" textAnchor="middle" fontSize="23" fontWeight="800" fill={INK}>Réservé aux adhérents</text>
      </g></g>

      {/* Auvent : les rayures se déroulent une à une */}
      {stripes.map((i) => (
        <path
          key={i}
          data-range={`${(0.2 + i * 0.018).toFixed(3)},${(0.27 + i * 0.018).toFixed(3)}`}
          className="unroll"
          d={stripe(i)}
          fill={i % 2 ? 'url(#gCream)' : 'url(#gRose)'}
        />
      ))}
      <g data-range=".22,.3" className="fade"><rect x="192" y="88" width="576" height="12" rx="6" fill="url(#gWood)" /></g>

      {/* Enseigne */}
      <g data-range=".6,.68" className="swing" style={{ transformOrigin: '480px 20px' } as CSSProperties}>
        <rect x="266" y="16" width="428" height="66" rx="33" fill="#fff" stroke={ROSE} strokeWidth="3" />
        <path d={HEART} fill={ROSE} transform="translate(306 49)" />
        <path d={HEART} fill={ROSE} transform="translate(654 49)" />
        <text x="480" y="60" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="33" fontWeight="600" fill={INK}>Marché solidaire</text>
      </g>

      {/* Les visiteurs */}
      <Parent x={84} y={456} range=".76,.88" side="l" skin="#f4cdb0" top="#5bb7cf" hairColor="#7a4a22" />
      <Child x={158} y={508} range=".79,.9" side="l" skin="#f4cdb0" top="#ffc83d" hairColor="#7a4a22" />
      <Parent x={868} y={456} range=".82,.94" side="r" skin="#a8704e" top="#8cc66a" hairColor="#2b2320" />

      {/* Cœurs qui montent de l'étal */}
      <g data-range=".9,.98" className="fade">
        {hearts.map(([x, y, w]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path className="float" style={{ '--w': `${w}s` } as CSSProperties} d={HEART} fill={ROSE} />
          </g>
        ))}
      </g>
    </svg>
  )
}
