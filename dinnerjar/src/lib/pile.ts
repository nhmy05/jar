/*
 * Where each folded note rests in the jar. Shared by the flat drawing and the fold motion,
 * so a dropped note lands exactly where the drawing then shows it. Ported from design-refs/app-screens/source/Jar.dc.html.
 *
 * Coordinates are in the mockup's 640 × 640 box: x grows right, y grows down.
 * Notes are placed bottom row first, so the first N spots are the pile for N notes.
 */

/** The jar outline in the 640 × 640 box. */
export const JAR_OUTLINE =
  "M130 90 L136 130 C80 160 40 240 40 370 C40 500 140 600 230 610 L410 610 C500 600 600 500 600 370 C600 240 560 160 504 130 L510 90 Z";

/** Inner half-width of the jar every 20px from y = 140 down to y = 600. */
const HALF_WIDTH = [188, 209, 224, 235, 244, 251, 256, 261, 264, 266, 267, 268, 267, 266, 264, 258, 253, 243, 233, 220, 206, 187, 163, 127];

/**
 * How a landed note can lie, like slips tossed in a jar: tipped back or standing up (tilt),
 * angled away (yaw), leaning over (roll, radians; some turned all the way round), and folds
 * sprung open more or less (open). Each pose has a picture in public/notes/, made from the
 * fold motion's last frame, so a note lands looking exactly like its picture.
 */
export type NotePose = { tilt: number; yaw: number; roll: number; open: number };
export const NOTE_POSES: readonly NotePose[] = (() => {
  let s = 11;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: 16 }, (_, i) => ({
    tilt: -0.55 + rnd() * 1.0,
    yaw: (rnd() - 0.5) * 2.0,
    roll: (rnd() - 0.5) * 1.1 + (i % 2 ? Math.PI : 0),
    open: 0.7 + rnd() * 2.0,
  }));
})();

export type PileSpot = {
  /** center of the note */
  x: number;
  y: number;
  /** note width in the 640 box (height is 84% of it) */
  width: number;
  /** which of NOTE_POSES */
  pose: number;
};

export function halfWidthAt(y: number) {
  const p = Math.max(0, Math.min(HALF_WIDTH.length - 1, (y - 140) / 20));
  const a = Math.floor(p);
  const b = Math.min(HALF_WIDTH.length - 1, a + 1);
  return HALF_WIDTH[a] + (HALF_WIDTH[b] - HALF_WIDTH[a]) * (p - a);
}

/** Visible box of each pose's picture (left, top, right, bottom), in the picture's -120..120 units. */
const POSE_BOX = [[-51, -66, 75, 64], [-91, -65, 65, 69], [-94, -68, 74, 63], [-85, -70, 85, 72], [-79, -73, 88, 66], [-87, -73, 57, 76], [-82, -60, 81, 54], [-84, -77, 85, 77], [-76, -66, 73, 63], [-91, -76, 89, 78], [-74, -64, 101, 59], [-87, -50, 87, 59], [-86, -72, 84, 69], [-84, -60, 83, 64], [-65, -58, 88, 55], [-93, -75, 89, 75]];

/** True when every corner and edge middle of the note's picture sits inside the glass. */
function fitsInJar(spot: PileSpot) {
  const k = spot.width / 150;
  const [l, t, r, b] = POSE_BOX[spot.pose].map((v) => v * k);
  const xs = [spot.x + l, spot.x + (l + r) / 2, spot.x + r];
  const ys = [spot.y + t, spot.y + (t + b) / 2, spot.y + b];
  return xs.every((px) => ys.every((py) => py <= 596 && Math.abs(px - 320) <= halfWidthAt(py) - 8));
}

function makePile(): PileSpot[] {
  let s = 73;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const w = 100, h = 84, bottom = 562, top = 172, gapSize = 66;
  const out: PileSpot[] = [];
  for (let y = bottom; y > top; y -= 47) {
    const room = Math.max(0, 2 * Math.min(halfWidthAt(y - h * 0.35), halfWidthAt(y + h * 0.35)) - w * 0.8);
    const n = Math.floor(room / gapSize) + 1;
    const gap = n > 1 ? room / (n - 1) : 0;
    const row: PileSpot[] = [];
    for (let i = 0; i < n; i++) {
      const left = 320 - ((n - 1) * gap) / 2 + i * gap + (rnd() - 0.5) * 16 - w / 2;
      const topY = y + (rnd() - 0.5) * 18 - h / 2;
      const width = ((14.6 + rnd() * 2.4) / 100) * 640;
      row.push({
        x: left + width / 2,
        y: topY + (width * 0.84) / 2,
        width,
        pose: Math.floor(rnd() * NOTE_POSES.length),
      });
      /* nudge it in from the glass until no corner pokes out */
      const spot = row[row.length - 1];
      for (let step = 0; step < 120 && !fitsInJar(spot); step++) {
        spot.x += Math.sign(320 - spot.x) * 2;
        spot.y -= 1;
      }
    }
    /* each row fills from the middle out, so early notes land under the opening */
    row.sort((a, b) => Math.abs(a.x - 320) - Math.abs(b.x - 320));
    out.push(...row);
  }
  return out;
}

/** Every resting spot, bottom row first. The jar is drawn full when all are taken. */
export const PILE: readonly PileSpot[] = makePile();
