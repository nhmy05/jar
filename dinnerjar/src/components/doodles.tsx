import type { CSSProperties, ReactNode } from "react";

/* Little kitchen doodles around the headline and the jar. Purely decorative. */

const INK = "#5d4c38";
const GOLD = "#a8915a";
const C = { peach: "#ffd2bd", mint: "#cde6c6", butter: "#fbdf86", lilac: "#e4d5f2", pink: "#f9c6cf", cream: "#fffaf0", tomato: "#f7a594" };
const line = { stroke: INK, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ART: Record<string, ReactNode> = {
  lemon: <>
    <circle cx="32" cy="32" r="22" fill={C.butter} {...line} />
    <circle cx="32" cy="32" r="16.5" fill="#fff4bf" {...line} strokeWidth={1.2} />
    <path d="M32 17v30M17 32h30M21.5 21.5l21 21M42.5 21.5l-21 21" {...line} strokeWidth={1.1} />
  </>,
  garlic: <>
    <path d="M32 10c-1 6-7 8-13 15-9 10-5 28 13 29 18-1 22-19 13-29-6-7-12-9-13-15Z" fill={C.cream} {...line} />
    <path d="M32 18c-6 10-6 26 0 36M32 18c6 10 6 26 0 36M24 26c-4 8-3 20 3 27M40 26c4 8 3 20-3 27" {...line} strokeWidth={1.1} fill="none" />
    <path d="M28 55l-2 3M32 55v4M36 55l2 3M32 10c0-3 1-5 3-6" {...line} fill="none" />
  </>,
  chili: <>
    <path d="M12 50c10-1 28-8 34-27 2-6 8-6 8 0 0 18-20 33-42 27Z" fill={C.tomato} {...line} />
    <path d="M45 21c1-4 5-6 9-4l-1 6c-3-1-6-1-8-2Z" fill={C.mint} {...line} />
    <path d="M52 17c1-5 4-8 8-8M22 47c8-2 18-8 24-18" {...line} fill="none" strokeWidth={1.1} />
  </>,
  whisk: <>
    <path d="M32 40C19 29 21 6 32 6s13 23 0 34Z" fill="none" {...line} />
    <path d="M32 40c-6-11-5-31 0-34M32 40c6-11 5-31 0-34" {...line} fill="none" strokeWidth={1.2} />
    <rect x="28.5" y="40" width="7" height="20" rx="3.5" fill={C.lilac} {...line} />
  </>,
  noodles: <>
    <path d="M30 4 18 30M38 5 25 30" {...line} strokeWidth={2} />
    <path d="M14 30c3-6 6-1 9-6s6 1 9-4 6 1 9-4 5 2 8 1" {...line} fill="none" strokeWidth={1.2} />
    <path d="M8 30h48c0 14-10 23-24 23S8 44 8 30Z" fill={C.mint} {...line} />
    <path d="M14 38c4 2 8 3 12 3" {...line} fill="none" strokeWidth={1.1} opacity=".6" />
    <path d="M24 57h16" {...line} />
  </>,
  tomato: <>
    <circle cx="32" cy="36" r="19" fill={C.tomato} {...line} />
    <path d="M32 20l-4-6 4 3 4-3-4 6 8-1-7 4 6 4-7-2-1 6-1-6-7 2 6-4-7-4Z" fill={C.mint} {...line} strokeWidth={1.2} />
    <path d="M20 32c1-4 3-6 6-7" {...line} fill="none" stroke="#fff" opacity=".8" />
  </>,
  mushroom: <>
    <path d="M24 34c0 10-2 17 2 20h12c4-3 2-10 2-20Z" fill={C.cream} {...line} />
    <path d="M8 34C8 16 56 16 56 34Z" fill={C.pink} {...line} />
    <circle cx="22" cy="26" r="3" fill="#fff" /><circle cx="36" cy="22" r="2.5" fill="#fff" /><circle cx="46" cy="29" r="2.2" fill="#fff" />
  </>,
  egg: <>
    <path d="M12 34c-4-12 8-22 18-20 8-6 22-2 22 10 6 6 2 20-10 20-6 6-20 6-24-2-6 0-8-4-6-8Z" fill="#fff" {...line} />
    <circle cx="33" cy="32" r="8" fill={C.butter} {...line} />
    <path d="M30 29c1-1 2-2 4-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </>,
  cherries: <>
    <path d="M24 42c2-14 8-26 18-32M42 46c-2-14-2-26 0-36" {...line} fill="none" />
    <path d="M42 10c6-6 14-4 16 2-6 4-12 4-16-2Z" fill={C.mint} {...line} />
    <circle cx="22" cy="46" r="9" fill={C.tomato} {...line} /><circle cx="42" cy="49" r="9" fill={C.tomato} {...line} />
  </>,
  sprig: <>
    <path d="M14 54C26 40 36 26 50 10" {...line} fill="none" />
    <path d="M24 42c-8-2-12-8-10-14 8 1 11 7 10 14ZM32 32c-2-8 1-14 8-16 2 7-2 13-8 16ZM38 25c8 0 13 4 14 10-8 1-13-3-14-10Z" fill={C.mint} {...line} strokeWidth={1.4} />
  </>,
  spoon: <>
    <ellipse cx="32" cy="16" rx="9" ry="12" fill={C.peach} {...line} />
    <path d="M32 28v30" {...line} strokeWidth={3.4} />
    <path d="M32 28v30" stroke={C.peach} strokeWidth="1.2" strokeLinecap="round" />
  </>,
  heart: <path d="M32 52S10 38 10 24c0-7 6-12 12-12 5 0 8 3 10 6 2-3 5-6 10-6 6 0 12 5 12 12 0 14-22 28-22 28Z" fill={C.pink} {...line} />,
  sparkle: <path d="m32 8 5 17 17 7-17 5-5 19-5-19-17-5 17-7Z" fill={C.butter} {...line} />,
  /* the mockup's thin gold outlines */
  goldSparkle: <>
    <path d="M28 6c1.5 12 4 16.5 16 19-12 2.5-14.5 7-16 19-1.5-12-4-16.5-16-19 12-2.5 14.5-7 16-19Z" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M50 46c.6 4 1.5 5.4 5.5 6-4 .6-4.9 2-5.5 6-.6-4-1.5-5.4-5.5-6 4-.6 4.9-2 5.5-6Z" fill="none" stroke={GOLD} strokeWidth="1.3" strokeLinejoin="round" />
  </>,
  goldHeart: <path d="M32 50S12 38 12 25c0-6.5 5-11 11-11 4.5 0 7.5 2.5 9 5.5 1.5-3 4.5-5.5 9-5.5 6 0 11 4.5 11 11 0 13-20 25-20 25Z" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinejoin="round" />,
};

type Placement = { art: keyof typeof ART; left: string; top: string; size: number; rotate: number; className?: string };

/*
 * A mix: the mockup's sparkles and heart, plus a few food doodles kept sparse so the jar stays
 * the star. They're pinned to what they decorate, not to the page, so they move with it when
 * the window changes size and never slide over the text or the jar:
 *   "hero": beside the headline (on a phone, beside "Ask the jar")
 *   "jar":  beside the jar, measured from its edges (--jar is the jar's size, set on .jar-scene)
 */
const GROUPS: Record<"hero" | "jar", Placement[]> = {
  hero: [
    { art: "lemon", left: "max(30px, min(6%, calc(50% - 420px)))", top: "34px", size: 58, rotate: -12, className: "doodle-wide" },
    { art: "cherries", left: "min(calc(100% - 30px), max(94%, calc(50% + 420px)))", top: "150px", size: 54, rotate: 10, className: "doodle-wide" },
    { art: "sparkle", left: "max(80%, calc(50% + 380px))", top: "92px", size: 30, rotate: 8, className: "doodle-roomy" },
    { art: "lemon", left: "9%", top: "100px", size: 34, rotate: -12, className: "doodle-phone" },
    { art: "cherries", left: "91%", top: "52px", size: 34, rotate: 10, className: "doodle-phone" },
  ],
  /* around the side notes, which sit halfway between the jar and the page edge */
  jar: [
    { art: "goldHeart", left: "calc(25% - var(--jar) / 4 - 50px)", top: "calc(100% - 18px - var(--jar) * .4)", size: 26, rotate: -8, className: "doodle-wide" },
    { art: "garlic", left: "max(30px, calc(25% - var(--jar) / 4 - 150px))", top: "calc(100% - 18px - var(--jar) * .14)", size: 48, rotate: -6, className: "doodle-roomy" },
    { art: "goldSparkle", left: "calc(25% - var(--jar) / 4 + 8px)", top: "calc(100% - 18px - var(--jar) * 1.29)", size: 26, rotate: 0, className: "doodle-wide" },
    { art: "goldSparkle", left: "max(30px, calc(25% - var(--jar) / 4 - 165px))", top: "calc(100% - 18px - var(--jar) * .95)", size: 30, rotate: 0, className: "doodle-roomy" },
    { art: "goldSparkle", left: "min(calc(100% - 30px), calc(75% + var(--jar) / 4 + 206px))", top: "calc(100% - 18px - var(--jar) * .8)", size: 30, rotate: 0, className: "doodle-roomy" },
    { art: "goldSparkle", left: "calc(75% + var(--jar) / 4 - 65px)", top: "calc(100% - 18px - var(--jar) * .22)", size: 26, rotate: 0, className: "doodle-wide" },
    { art: "egg", left: "calc(75% + var(--jar) / 4 + 30px)", top: "calc(100% - 18px - var(--jar) * .98)", size: 44, rotate: 12, className: "doodle-wide" },
    { art: "mushroom", left: "calc(25% - var(--jar) / 4 + 95px)", top: "calc(100% - 18px - var(--jar) * .13)", size: 46, rotate: -8, className: "doodle-wide" },
    { art: "whisk", left: "min(calc(100% - 30px), calc(75% + var(--jar) / 4 + 150px))", top: "calc(100% - 18px - var(--jar) * .1)", size: 50, rotate: 24, className: "doodle-roomy" },
    /* small screens: beside the side notes in the top corners */
    { art: "goldHeart", left: "22px", top: "108px", size: 20, rotate: -8, className: "doodle-small" },
    { art: "goldSparkle", left: "calc(100% - 26px)", top: "142px", size: 24, rotate: 0, className: "doodle-small" },
  ],
};

export function Doodles({ group }: { group: "hero" | "jar" }) {
  return <div className={`doodles doodles-${group}`} aria-hidden="true">
    {GROUPS[group].map((place, index) => <svg
      key={index}
      className={`doodle ${place.className ?? ""}`}
      viewBox="0 0 64 64"
      width={place.size}
      height={place.size}
      style={{ left: place.left, top: place.top, "--r": `${place.rotate}deg`, animationDelay: `${(index % 5) * -1.3}s` } as CSSProperties}
    >{ART[place.art]}</svg>)}
  </div>;
}

/* Logo C: the jar outline with a gold heart inside. */
export function JarLogo() {
  return <svg className="brand-mark" viewBox="0 40 640 600" width="36" height="36" aria-hidden="true">
    <path d="M130 90 L136 130 C80 160 40 240 40 370 C40 500 140 600 230 610 L410 610 C500 600 600 500 600 370 C600 240 560 160 504 130 L510 90 Z" fill="none" stroke="currentColor" strokeWidth="34" strokeLinejoin="round" />
    <path d="M320 470 S200 400 200 320 c0-40 30-70 66-70 26 0 44 14 54 32 10-18 28-32 54-32 36 0 66 30 66 70 0 80-120 150-120 150Z" fill="#c9a94f" fillOpacity=".3" stroke="#c9a94f" strokeWidth="26" strokeLinejoin="round" />
  </svg>;
}
