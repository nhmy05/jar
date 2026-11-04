import type { CSSProperties } from "react";

export type IconName = "plus" | "close" | "book" | "shuffle" | "back" | "image" | "link" | "search" | "arrow" | "sparkle" | "heart" | "leaf" | "check" | "external" | "upload" | "refresh" | "trash";

export function Icon({ name, size = 20, className = "", style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  const paths: Record<IconName, React.ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    book: <><path d="M12 5.5C9.5 3.6 6.5 3.7 3 4.5V19c3.5-.8 6.5-.8 9 1 2.5-1.8 5.5-1.8 9-1V4.5c-3.5-.8-6.5-.9-9 1Z" /><path d="M12 5.5V20M6 8h3M6 11h3M15 8h3M15 11h3" /></>,
    shuffle: <><path d="M3 6h3c4 0 6 12 10 12h5M17 14l4 4-4 4M3 18h3c1.5 0 2.7-1.7 4-4M13 9c1-1.8 2-3 4-3h4M17 2l4 4-4 4" /></>,
    back: <><path d="m8 4-5 5 5 5M3 9h10a6 6 0 0 1 0 12h-3" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m21 15-5-5L6 21M13 14l-3-3-7 7" /></>,
    link: <><path d="m10 13 4-4M8.5 15.5l-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m1 3 1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0" transform="translate(2 -1)" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    sparkle: <><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3ZM20 2v4M18 4h4" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    leaf: <><path d="M20 3C10 2 3 8 5 15c2 7 14 6 15-12ZM3 22l13-15M7 17l-1-5M11 13l5 1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    external: <><path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
    upload: <><path d="M12 16V3M7 8l5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>,
    refresh: <><path d="M20 7A9 9 0 1 0 21 14M20 3v5h-5" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">{paths[name]}</svg>;
}

export function PlateDoodle() {
  return <svg width="110" height="70" viewBox="0 0 110 70" fill="none" className="plate-doodle" aria-hidden="true"><ellipse cx="54" cy="37" rx="29" ry="22" stroke="currentColor" strokeWidth="1.3" /><ellipse cx="54" cy="37" rx="22" ry="16" stroke="currentColor" strokeWidth="1" /><path d="m15 15-1 17m-4-17-2 10c-1 7 6 8 7 2l3-11M12 34l-2 24M94 15c-9 10-8 22-2 24l1-24 0 43M39 40c2-9 9-13 16-12 5 1 8 5 8 10-5 2-13 5-18 10M45 49l13-18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M32 7h5M34 4v6M75 58h5M77 55v6" stroke="currentColor" strokeWidth="1" /></svg>;
}
