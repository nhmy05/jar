import type { CSSProperties, ReactNode } from "react";

/* Little kitchen doodles scattered over the butter-yellow page. Purely decorative. */

const INK = "#5d4c38";
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
};

type Placement = { art: keyof typeof ART; left: string; top: string; size: number; rotate: number; className?: string };

const PLACEMENTS: Placement[] = [
  { art: "lemon", left: "4%", top: "17%", size: 58, rotate: -12 },
  { art: "sparkle", left: "13%", top: "9%", size: 22, rotate: 8, className: "doodle-desktop" },
  { art: "whisk", left: "12%", top: "67%", size: 54, rotate: 24, className: "doodle-desktop" },
  { art: "heart", left: "19%", top: "44%", size: 20, rotate: -14, className: "doodle-desktop" },
  { art: "garlic", left: "3%", top: "72%", size: 54, rotate: -6, className: "doodle-desktop" },
  { art: "sprig", left: "17%", top: "84%", size: 50, rotate: 10, className: "doodle-desktop" },
  { art: "cherries", left: "88%", top: "15%", size: 54, rotate: 10 },
  { art: "sparkle", left: "81%", top: "30%", size: 18, rotate: -8, className: "doodle-desktop" },
  { art: "noodles", left: "86%", top: "44%", size: 66, rotate: -6, className: "doodle-desktop" },
  { art: "mushroom", left: "78%", top: "62%", size: 48, rotate: 12, className: "doodle-desktop" },
  { art: "chili", left: "90%", top: "75%", size: 52, rotate: -18, className: "doodle-desktop" },
  { art: "egg", left: "70%", top: "88%", size: 50, rotate: 8, className: "doodle-desktop" },
  { art: "tomato", left: "27%", top: "92%", size: 40, rotate: -4, className: "doodle-desktop" },
  { art: "spoon", left: "22%", top: "30%", size: 40, rotate: -30, className: "doodle-desktop" },
  { art: "heart", left: "92%", top: "6%", size: 18, rotate: 12, className: "doodle-mobile-only" },
];

export function Doodles() {
  return <div className="doodles" aria-hidden="true">
    {PLACEMENTS.map((place, index) => <svg
      key={index}
      className={`doodle ${place.className ?? ""}`}
      viewBox="0 0 64 64"
      width={place.size}
      height={place.size}
      style={{ left: place.left, top: place.top, "--r": `${place.rotate}deg`, animationDelay: `${(index % 5) * -1.3}s` } as CSSProperties}
    >{ART[place.art]}</svg>)}
  </div>;
}

export function JarLogo() {
  return <svg className="brand-mark" viewBox="0 0 48 48" width="40" height="40" fill="none" aria-hidden="true">
    <path d="M17 9a17 17 0 1 0 14 0" fill="#eaf2ec" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <ellipse cx="24" cy="9" rx="8" ry="2.4" fill="#fffaf0" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13 37l7-4 1 6Z M22 36l8-3 0 7Z M28 31l7 1-3 6Z M15 30l6 1-2 5Z" fill="#fff" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M12 21c-1 3-1 6 0 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M38 6v4M36 8h4" stroke="#c9a94f" strokeWidth="1.3" strokeLinecap="round" />
  </svg>;
}
