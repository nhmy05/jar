import { JAR_FULL_AT, type Dish } from "@/lib/dishes";
import { JAR_OUTLINE, PILE } from "@/lib/pile";

/*
 * The flat drawing of the jar, from design-refs/app-screens/source/Jar.dc.html.
 * Split in two (back + pile, then front glass) so a falling note can pass behind the front.
 */

const OPEN_OUTLINE = JAR_OUTLINE.replace(/ Z$/, "");

export type JarPhase = "idle" | "pulling" | "adding" | "returning";

/** Index of the pile spot on top: where a note lands, or is pulled from. */
export function topSpot(count: number) {
  return Math.max(0, Math.min(count, JAR_FULL_AT) - 1);
}

/** Back of the jar and the pile. hideTop leaves the top note out (it's in the air). */
export function JarIllustration({ dishes, phase, hideTop = false }: { dishes: Dish[]; phase: JarPhase; hideTop?: boolean }) {
  /* the pile is drawn full at JAR_FULL_AT notes; more notes than that keep it looking full */
  const shown = Math.min(dishes.length, JAR_FULL_AT) - (hideTop ? 1 : 0);
  const spots = PILE.slice(0, Math.max(0, shown));

  return <svg className={`jar-illustration phase-${phase}`} viewBox="0 0 640 640" role="img" aria-labelledby="jar-art-title">
    <title id="jar-art-title">{`A round, clear glass jar with a wide open top, holding ${dishes.length} folded paper ${dishes.length === 1 ? "note" : "notes"}. The dish names are hidden inside the folds.`}</title>
    <defs>
      <filter id="j-soft" x="-30%" y="-150%" width="160%" height="400%"><feGaussianBlur stdDeviation="14" /></filter>
      <filter id="j-b2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2" /></filter>
      <filter id="j-b8" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="8" /></filter>
      {/* same as the falling note's shadow (CSS on .fold-canvas canvas) */}
      <filter id="j-note-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="1.4" stdDeviation="3" floodColor="#6e6446" floodOpacity=".16" /></filter>
      <clipPath id="j-body"><path d={JAR_OUTLINE} /></clipPath>
    </defs>

    {/* soft yellow glow under the base */}
    <ellipse cx="320" cy="622" rx="270" ry="24" fill="#F9DE97" opacity="0.8" filter="url(#j-soft)" />
    {/* back of the glass */}
    <path d={JAR_OUTLINE} fill="#FFFFFF" fillOpacity="0.42" />
    <ellipse cx="320" cy="90" rx="190" ry="22" fill="#FFFDF3" fillOpacity="0.75" />
    <path d="M130 90 A190 22 0 0 1 510 90" fill="none" stroke="#A9926A" strokeWidth="2.5" />
    <path d="M144 92 A176 15 0 0 1 496 92" fill="none" stroke="#FFFFFF" strokeWidth="5" />

    {/* the notes */}
    <g clipPath="url(#j-body)">
      <g className="jar-slips">
        {spots.map((spot, index) => {
          /* the same picture the fold motion ends on: 240 px = the 2.4 units it was drawn at, size 1 = 150 px wide */
          const k = spot.width / 150;
          return <image key={dishes[index].id} href={`/notes/note-${spot.pose}${dishes[index].photoUrl ? "-tall" : ""}.png`} x="-120" y="-120" width="240" height="240" transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)}) scale(${k.toFixed(3)})`} filter="url(#j-note-shadow)" />;
        })}
      </g>
    </g>

  </svg>;
}

/** Front of the glass, drawn over anything falling into the jar. */
export function JarFront() {
  return <svg className="jar-illustration jar-front" viewBox="0 0 640 640" aria-hidden="true">
    <defs>
      <filter id="jf-b2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2" /></filter>
      <filter id="jf-b8" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="8" /></filter>
      <clipPath id="jf-body"><path d={JAR_OUTLINE} /></clipPath>
    </defs>
    {/* front of the glass: edge tint, highlights, rim, base */}
    <g clipPath="url(#jf-body)" pointerEvents="none">
      <path d={OPEN_OUTLINE} fill="none" stroke="#C4AC7C" strokeWidth="34" opacity="0.32" filter="url(#jf-b8)" />
      <path d="M126 186 C210 142 430 142 514 186" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.75" filter="url(#jf-b2)" />
      <rect x="0" y="574" width="640" height="40" fill="#FFF3CE" opacity="0.55" />
    </g>
    <g pointerEvents="none">
      <path d={OPEN_OUTLINE} fill="none" stroke="#A9926A" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M78 270 C60 330 62 420 104 486 C88 420 90 332 108 276 Z" fill="#FFFFFF" opacity="0.72" />
      <path d="M130 212 C152 184 180 166 212 154 L220 186 C192 196 170 212 152 236 Z" fill="#FFFFFF" opacity="0.5" />
      <path d="M516 190 C552 226 572 276 574 328 C564 280 542 232 502 198 Z" fill="#FFFFFF" opacity="0.8" />
      <path d="M130 90 A190 22 0 0 0 510 90" fill="none" stroke="#A9926A" strokeWidth="10" opacity="0.5" />
      <path d="M130 90 A190 22 0 0 0 510 90" fill="none" stroke="#FFFFFF" strokeWidth="6.5" />
      <path d="M136 128 C200 148 440 148 504 128" fill="none" stroke="#A9926A" strokeWidth="2" opacity="0.55" />
      <path d="M194 596 C240 628 400 628 446 596" fill="none" stroke="#A9926A" strokeWidth="2.6" />
      <path d="M206 596 C250 618 390 618 434 596" fill="none" stroke="#FFFFFF" strokeWidth="3.5" opacity="0.85" />
    </g>
  </svg>;
}
