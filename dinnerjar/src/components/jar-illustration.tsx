import type { Dish } from "@/lib/dishes";

/* Geometry of the fishbowl (viewBox 680 × 560). The body is a sphere cut flat
   at the top (the open mouth) and at the bottom (where it sits on the table). */
const CX = 340;
const CY = 310;
const R = 205;
const MOUTH_Y = 128;
const MOUTH_RX = 94;
const BASE_Y = 500;
const BASE_RX = 77;

const BODY = `M${CX - MOUTH_RX} ${MOUTH_Y} A${R} ${R} 0 0 0 ${CX - BASE_RX} ${BASE_Y} L${CX + BASE_RX} ${BASE_Y} A${R} ${R} 0 0 0 ${CX + MOUTH_RX} ${MOUTH_Y}`;
const BACK_GLASS = `${BODY} A${MOUTH_RX} 14 0 0 0 ${CX - MOUTH_RX} ${MOUTH_Y}Z`;
const FRONT_GLASS = `${BODY} A${MOUTH_RX} 14 0 0 1 ${CX - MOUTH_RX} ${MOUTH_Y}Z`;

/** Small deterministic noise so each slip keeps its spot between renders. */
function noise(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Slot = { x: number; y: number; angle: number; scale: number; squash: number; variant: number };

/** Lays slips into the bottom of the bowl, row by row, so the pile rises as the jar fills. */
function pileSlots(count: number): Slot[] {
  const slots: Slot[] = [];
  let row = 0;
  while (slots.length < count) {
    const y = BASE_Y - 26 - row * 24;
    const half = Math.sqrt(Math.max(0, R * R - (y - CY) ** 2)) - 44;
    const perRow = Math.max(1, Math.floor((half * 2) / 50));
    const step = (half * 2) / perRow;
    for (let column = 0; column < perRow && slots.length < count; column += 1) {
      const i = slots.length;
      slots.push({
        x: CX - half + step * (column + 0.5) + (row % 2 ? step * 0.22 : -step * 0.12) + (noise(i) - 0.5) * 10,
        y: y + (noise(i + 50) - 0.5) * 8,
        angle: (noise(i + 100) - 0.5) * 80,
        scale: 1.3 + noise(i + 150) * 0.2,
        squash: 0.72 + noise(i + 200) * 0.26,
        variant: Math.floor(noise(i + 250) * 3),
      });
    }
    row += 1;
  }
  return slots;
}

/** A thin white slip folded twice: a little square, four layers thick, open on two sides. */
export function FoldedSlip({ variant = 0 }: { variant?: number }) {
  return <g>
    <path d="M-15.5-13.5 18.5-13 19 16-15 16.5Z" fill="#e9e2cf" />
    <path d="M-16.5-14.5 17.8-14.2 18.2 15.2-16 15.6Z" fill="#f5f0e3" stroke="#ddd5bf" strokeWidth=".5" />
    <path d="M-17.5-15.5Q0-16.4 17-15.6L17.4 14.4Q0 15.2-17 14.7Z" fill="#fffef9" stroke="#d6cdb5" strokeWidth=".7" />
    {/* thin paper: the handwriting inside shows through, just barely */}
    <path d="M-9 1c2-3 4 2 6-1s4 2 6-1 3 2 5 0" fill="none" stroke="#6b6250" strokeWidth="1.1" strokeLinecap="round" opacity=".1" />
    {variant === 1 && <>
      <path d="M17-15.6 6-15.2 17.2-4Z" fill="#f2ecdd" stroke="#d6cdb5" strokeWidth=".6" strokeLinejoin="round" />
      <path d="M6-15.2 17.2-4" stroke="#cfc5aa" strokeWidth=".6" />
    </>}
    {variant === 2 && <path d="M-17.5-15.5Q0-16.4 17-15.6L-17 14.7Z" fill="#fff" opacity=".55" />}
    {variant === 0 && <path d="M17-15.6 17.4 14.4Q0 15.2-17 14.7 2 8 17-15.6Z" fill="#efe8d6" opacity=".45" />}
    <path d="M-15-13.4Q0-14.4 15-13.6" fill="none" stroke="#fff" strokeWidth="1" opacity=".9" />
  </g>;
}

export type JarPhase = "idle" | "pulling" | "adding" | "returning";

export function JarIllustration({ dishes, phase, onPick }: { dishes: Dish[]; phase: JarPhase; onPick?: () => void }) {
  const slots = pileSlots(dishes.length);
  const canPick = !!onPick && dishes.length > 0;

  return <svg className={`jar-illustration phase-${phase}`} viewBox="0 0 680 560" role="img" aria-labelledby="jar-art-title">
    <title id="jar-art-title">{`A round, clear glass jar with an open top, holding ${dishes.length} folded paper ${dishes.length === 1 ? "slip" : "slips"}. The dish names are hidden inside the folds.`}</title>
    <defs>
      <radialGradient id="glass-back" cx=".38" cy=".38" r=".75">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".22" />
        <stop offset=".7" stopColor="#eef5f1" stopOpacity=".12" />
        <stop offset="1" stopColor="#c4d8cd" stopOpacity=".35" />
      </radialGradient>
      <radialGradient id="glass-front" cx=".5" cy=".55" r=".62">
        <stop offset=".78" stopColor="#ffffff" stopOpacity="0" />
        <stop offset=".94" stopColor="#d3e4da" stopOpacity=".3" />
        <stop offset="1" stopColor="#9fbcae" stopOpacity=".5" />
      </radialGradient>
      <linearGradient id="glass-sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity=".26" />
        <stop offset=".25" stopColor="#fff" stopOpacity="0" />
        <stop offset=".78" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" stopOpacity=".18" />
      </linearGradient>
      <linearGradient id="glass-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c7d8ce" stopOpacity=".1" />
        <stop offset="1" stopColor="#a9c0b3" stopOpacity=".55" />
      </linearGradient>
      <filter id="table-shadow" x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation="10" /></filter>
      <filter id="slip-shadow" x="-40%" y="-40%" width="190%" height="200%"><feDropShadow dx="1" dy="2.4" stdDeviation="1.6" floodColor="#7a6a3f" floodOpacity=".22" /></filter>
      <filter id="lift-shadow" x="-60%" y="-40%" width="220%" height="230%"><feDropShadow dx="3" dy="9" stdDeviation="5" floodColor="#7a6a3f" floodOpacity=".2" /></filter>
      <clipPath id="jar-inside"><path d={BACK_GLASS} /></clipPath>
    </defs>

    {/* table shadow + a bit of light focused through the glass */}
    <ellipse cx={CX + 8} cy={BASE_Y + 8} rx="170" ry="16" fill="#c9b47a" opacity=".32" filter="url(#table-shadow)" />
    <ellipse cx={CX + 40} cy={BASE_Y + 10} rx="60" ry="6" fill="#fff6cf" opacity=".9" filter="url(#table-shadow)" />

    {/* back half of the glass */}
    <path d={BACK_GLASS} fill="url(#glass-back)" stroke="#a9bfb3" strokeWidth="1.4" />
    <ellipse cx={CX} cy={MOUTH_Y} rx={MOUTH_RX} ry="14" fill="none" stroke="#b9cbc1" strokeWidth="1" />

    {/* the slips */}
    <g clipPath="url(#jar-inside)">
      <g className="jar-slips">
        {dishes.map((dish, index) => {
          const s = slots[index];
          return <g key={dish.id} transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.angle.toFixed(1)}) scale(${s.scale.toFixed(2)} ${(s.scale * s.squash).toFixed(2)})`} filter="url(#slip-shadow)">
            <FoldedSlip variant={s.variant} />
          </g>;
        })}
      </g>
    </g>

    {/* front of the glass: tint at the edges, thick floor, reflections */}
    <path d={FRONT_GLASS} fill="url(#glass-front)" />
    <path d={FRONT_GLASS} fill="url(#glass-sheen)" />
    <path d={`M${CX - BASE_RX - 6} ${BASE_Y - 14}Q${CX} ${BASE_Y - 2} ${CX + BASE_RX + 6} ${BASE_Y - 14}L${CX + BASE_RX} ${BASE_Y}L${CX - BASE_RX} ${BASE_Y}Z`} fill="url(#glass-floor)" />
    <ellipse cx={CX} cy={BASE_Y} rx={BASE_RX} ry="9" fill="#d6e4dc" fillOpacity=".55" stroke="#a9bfb3" strokeWidth="1.2" />
    <path d={`M${CX - 60} ${BASE_Y + 3}Q${CX} ${BASE_Y + 9} ${CX + 60} ${BASE_Y + 3}`} fill="none" stroke="#fff" strokeWidth="1.6" opacity=".7" strokeLinecap="round" />

    <path d="M171 236A185 185 0 0 0 176 392" fill="none" stroke="#fff" strokeWidth="13" opacity=".38" strokeLinecap="round" />
    <path d="M178 228A178 178 0 0 0 170 318" fill="none" stroke="#fff" strokeWidth="3.4" opacity=".92" strokeLinecap="round" />
    <path d="M186 410A178 178 0 0 0 214 446" fill="none" stroke="#fff" strokeWidth="3" opacity=".6" strokeLinecap="round" />
    <path d="M524 352A188 188 0 0 0 526 262" fill="none" stroke="#fff" strokeWidth="5" opacity=".5" strokeLinecap="round" />
    <path d="M488 438A188 188 0 0 0 512 400" fill="none" stroke="#fff" strokeWidth="3" opacity=".55" strokeLinecap="round" />
    {/* a little window reflected in the glass */}
    <g transform="translate(436 196) rotate(16)" fill="#fff" opacity=".55">
      <rect x="0" y="0" width="17" height="24" rx="5" />
      <rect x="21" y="0" width="17" height="24" rx="5" />
      <rect x="0" y="28" width="17" height="20" rx="5" opacity=".7" />
      <rect x="21" y="28" width="17" height="20" rx="5" opacity=".7" />
    </g>

    {/* the rolled lip of the open mouth */}
    <ellipse cx={CX} cy={MOUTH_Y} rx={MOUTH_RX + 6} ry="17" fill="none" stroke="#c6d6cd" strokeWidth="7" opacity=".85" />
    <ellipse cx={CX} cy={MOUTH_Y} rx={MOUTH_RX + 6} ry="17" fill="none" stroke="#a6bdb1" strokeWidth="1.2" />
    <ellipse cx={CX} cy={MOUTH_Y} rx={MOUTH_RX + 1} ry="13" fill="none" stroke="#a6bdb1" strokeWidth=".8" opacity=".8" />
    <path d={`M${CX - MOUTH_RX - 2} ${MOUTH_Y - 4}Q${CX} ${MOUTH_Y - 26} ${CX + MOUTH_RX + 2} ${MOUTH_Y - 4}`} fill="none" stroke="#fff" strokeWidth="2.6" opacity=".9" strokeLinecap="round" />
    <path d={`M${CX - 70} ${MOUTH_Y + 15}Q${CX} ${MOUTH_Y + 22} ${CX + 70} ${MOUTH_Y + 15}`} fill="none" stroke="#fff" strokeWidth="2" opacity=".75" strokeLinecap="round" />

    {/* a slip hovering over the mouth — click it to pull one out */}
    {dishes.length > 0 && <g
      className="levitating-slip pickable-slip"
      onClick={canPick ? onPick : undefined}
      role={canPick ? "button" : undefined}
      tabIndex={canPick ? 0 : undefined}
      aria-label={canPick ? "Pull a slip out of the jar" : undefined}
      onKeyDown={canPick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPick?.(); } } : undefined}
    >
      <title>Pull a slip out</title>
      <path d="M318 112C306 96 310 78 324 66M370 108C380 92 388 80 398 72" fill="none" stroke="#c4ae6c" strokeWidth="1.2" strokeDasharray="2.5 5" strokeLinecap="round" />
      <g transform="translate(352 52) rotate(-8) scale(1.45)" filter="url(#lift-shadow)"><FoldedSlip variant={1} /></g>
    </g>}

    <g className="jar-sparkles" stroke="#c9a94f" strokeWidth="1.3" fill="none" strokeLinecap="round">
      <path d="m462 72 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" strokeWidth="1" />
      <path d="m226 92 1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6Z" strokeWidth="1" />
      <path d="M560 168v12m-6-6h12M128 300v10m-5-5h10" />
    </g>
  </svg>;
}
