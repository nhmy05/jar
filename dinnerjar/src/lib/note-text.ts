/* The dish name (and recipe link) written on a note. One drawing for both the folding note in
   the air (a 3D texture) and the picked card it lands on, so the swap between them shows the
   same pixels and the name can't jump in size, weight or place. Card look: bold handwriting,
   slightly tight letter spacing. */
import { LINK_SIZE, PHOTO_NOTE_ASPECT, TEXT_HEIGHT, TEXT_TOP, TEXT_WIDTH, photoNameSize, plainNameSize } from "@/lib/note-layout";

/** letter spacing, as a fraction of note width (the card's −0.5px at its usual 438px) */
const NAME_TRACKING = -0.5 / 438;
export const INK = "#2f2b20";
export const LINK_INK = "#44563a";
/* the "open in new tab" icon, same path as icons.tsx, on a 24 box */
export const EXTERNAL_ICON = "M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5";

/** icon line width, in the icon's 24-unit box */
export const ICON_STROKE = 1.65 * 24 / 13;

export const LINK_LABEL = "Open the recipe";

/** Where the link was drawn, as fractions of the note's width and height (for the card's click area). */
export type LinkBox = { left: number; top: number; width: number; height: number };

function fonts() {
  const hand = getComputedStyle(document.documentElement).getPropertyValue("--font-handwriting").trim() || "cursive";
  const body = getComputedStyle(document.body).fontFamily || "sans-serif";
  return { hand, body };
}

function track(g: CanvasRenderingContext2D, px: number) {
  const c = g as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = `${px}px`;
}

/** Where every piece of a note's text goes, in px on a note `W` px wide. Both the canvas
    drawing and the card's real text are placed from this, so they line up exactly. */
export type NoteTextLayout = {
  hand: string; body: string; size: number; tracking: number; lineH: number;
  /** ascent and descent of the name font: a line box of height lineH puts its baseline at
      top + (lineH − ascent − descent) / 2 + ascent, the same in the canvas and in HTML */
  ascent: number; descent: number;
  lines: { text: string; baseline: number }[];
  cx: number; colW: number;
  link: null | { size: number; ascent: number; descent: number; left: number; baseline: number; labelW: number; gap: number; icon: number; iconTop: number; under: number; underH: number; width: number; box: LinkBox };
};

function metrics(g: CanvasRenderingContext2D, size: number) {
  const m = g.measureText("Hg");
  const ascent = m.fontBoundingBoxAscent ?? size * 0.9, descent = m.fontBoundingBoxDescent ?? size * 0.25;
  return { ascent, descent };
}

/** Work out the layout (uses `g` only to measure). */
export function layoutNoteText(g: CanvasRenderingContext2D, W: number, name: string, { hasLink = false, withPhoto = false } = {}): NoteTextLayout {
  const { hand, body } = fonts();
  const colW = TEXT_WIDTH * W;
  const size = (withPhoto ? photoNameSize(name) : plainNameSize(name)) * W;
  const tracking = NAME_TRACKING * W;
  g.save();
  g.font = `600 ${size}px ${hand}`;
  track(g, tracking);
  /* wrap word by word into lines of even length (like text-wrap: balance) */
  const wrap = (width: number) => {
    const out: string[] = [];
    for (const word of name.trim().split(/\s+/)) {
      const last = out[out.length - 1];
      if (last && g.measureText(`${last} ${word}`).width <= width) out[out.length - 1] = `${last} ${word}`;
      else out.push(word);
    }
    return out;
  };
  let texts = wrap(colW);
  for (let width = colW * 0.97; width > colW * 0.4; width *= 0.97) {
    const tighter = wrap(width);
    if (tighter.length > texts.length) break;
    texts = tighter;
  }
  const { ascent, descent } = metrics(g, size);
  const lineH = size * 1.15;
  const linkSize = LINK_SIZE * W, linkGap = 0.012 * W;
  const textH = texts.length * lineH + (hasLink ? linkGap + linkSize * 1.3 : 0);
  const areaTop = withPhoto ? TEXT_TOP * W : 0, areaH = withPhoto ? TEXT_HEIGHT * W : PHOTO_NOTE_ASPECT * W;
  const top = areaTop + (areaH - textH) / 2;
  const cx = W / 2;
  const lines = texts.map((text, i) => ({ text, baseline: top + lineH * i + (lineH - ascent - descent) / 2 + ascent }));

  let link: NoteTextLayout["link"] = null;
  if (hasLink) {
    g.font = `600 ${linkSize}px ${body}`;
    track(g, 0);
    const lm = metrics(g, linkSize);
    const labelW = g.measureText(LINK_LABEL).width;
    const icon = linkSize * 0.95, gap = linkSize * 0.3;
    const width = labelW + gap + icon;
    const left = cx - width / 2;
    const mid = top + texts.length * lineH + linkGap + linkSize * 0.65;   // middle of the link's line
    const baseline = mid + (lm.ascent - lm.descent) / 2;
    const H = PHOTO_NOTE_ASPECT * W;
    link = {
      size: linkSize, ascent: lm.ascent, descent: lm.descent, left, baseline, labelW, gap, icon,
      iconTop: mid - icon / 2, under: mid + linkSize * 0.75, underH: Math.max(1, 0.0035 * W), width,
      box: { left: left / W, top: (mid - linkSize * 0.7) / H, width: width / W, height: (linkSize * 1.6) / H },
    };
  }
  g.restore();
  return { hand, body, size, tracking, lineH, ascent, descent, lines, cx, colW, link };
}

/**
 * Write the name (and link) onto a note `W` px wide (and W × 1.22 tall), centred in the text
 * area: under the photo when there is one, otherwise in the middle of the card.
 */
export function drawNoteText(g: CanvasRenderingContext2D, W: number, name: string, opts: { hasLink?: boolean; withPhoto?: boolean } = {}): LinkBox | null {
  const L = layoutNoteText(g, W, name, opts);
  g.save();
  g.font = `600 ${L.size}px ${L.hand}`;
  track(g, L.tracking);
  g.fillStyle = INK;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  L.lines.forEach((line) => g.fillText(line.text, L.cx, line.baseline, L.colW));
  const k = L.link;
  if (k) {
    g.font = `600 ${k.size}px ${L.body}`;
    track(g, 0);
    g.textAlign = "left";
    g.fillStyle = LINK_INK;
    g.fillText(LINK_LABEL, k.left, k.baseline);
    /* the icon, drawn from the same path as the card's */
    g.save();
    g.translate(k.left + k.labelW + k.gap, k.iconTop);
    g.scale(k.icon / 24, k.icon / 24);
    g.strokeStyle = LINK_INK; g.lineWidth = ICON_STROKE; g.lineCap = "round"; g.lineJoin = "round";
    g.stroke(new Path2D(EXTERNAL_ICON));
    g.restore();
    g.fillRect(k.left, k.under, k.width, k.underH);
  }
  g.restore();
  return k ? k.box : null;
}
