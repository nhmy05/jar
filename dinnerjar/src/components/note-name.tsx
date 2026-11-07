"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { loadNoteFont } from "@/lib/note-layout";
import { EXTERNAL_ICON, ICON_STROKE, INK, LINK_INK, LINK_LABEL, drawNoteText, layoutNoteText, type LinkBox, type NoteTextLayout } from "@/lib/note-text";

/**
 * Switch: true = the card's name and link are real text (sharp at any zoom), placed from the
 * same layout as the folding note's drawing. false = the older way: a canvas drawing of them.
 */
const NAME_AS_TEXT = true;

/**
 * The name (and recipe link) on the picked card, placed by the same code as the folding note
 * that lands on it, so nothing changes at the swap.
 */
export function NoteName(props: { name: string; recipeUrl?: string | null; withPhoto: boolean }) {
  return NAME_AS_TEXT ? <NoteNameText {...props} /> : <NoteNameCanvas {...props} />;
}

/* covers the whole card, border included, so it lines up with the note that lands on it */
const COVER = { position: "absolute", left: -1, top: -1, width: "calc(100% + 2px)", height: "calc(100% + 2px)" } as const;

/** Re-run `measure` with the card's width now, once its fonts load, and whenever it resizes. */
function useCardWidth(ref: React.RefObject<HTMLElement | null>, name: string, measure: (slip: HTMLElement) => void, deps: unknown[]) {
  useLayoutEffect(() => {
    const slip = ref.current?.parentElement;
    if (!slip) return;
    let gone = false;
    const run = () => { if (!gone && slip.offsetWidth) measure(slip); };
    run();
    void loadNoteFont(name).then(run);
    const observer = new ResizeObserver(run);
    observer.observe(slip);
    window.addEventListener("resize", run);
    return () => { gone = true; observer.disconnect(); window.removeEventListener("resize", run); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function NoteNameText({ name, recipeUrl, withPhoto }: { name: string; recipeUrl?: string | null; withPhoto: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<NoteTextLayout | null>(null);
  const hasLink = !!recipeUrl;
  useCardWidth(box, name, (slip) => {
    const g = document.createElement("canvas").getContext("2d");
    if (g) setLayout(layoutNoteText(g, slip.offsetWidth, name, { hasLink, withPhoto }));
  }, [name, hasLink, withPhoto]);

  const L = layout, k = L?.link;
  return <div ref={box} style={{ ...COVER, pointerEvents: "none" }}>
    {L && L.lines.map((line, i) => (
      <div key={i} aria-hidden="true" style={{
        position: "absolute", left: 0, right: 0, textAlign: "center", whiteSpace: "nowrap",
        top: line.baseline - L.ascent - (L.lineH - L.ascent - L.descent) / 2, height: L.lineH, lineHeight: `${L.lineH}px`,
        fontWeight: 600, fontSize: L.size, fontFamily: L.hand, letterSpacing: `${L.tracking}px`, color: INK,
      }}>{line.text}</div>
    ))}
    {L && k && recipeUrl && <a className="recipe-hit" href={recipeUrl} target="_blank" rel="noopener noreferrer"
      style={{ position: "absolute", left: `${k.box.left * 100}%`, top: `${k.box.top * 100}%`, width: `${k.box.width * 100}%`, height: `${k.box.height * 100}%`, pointerEvents: "auto" }}>
      <span className="sr-only">{LINK_LABEL}</span>
    </a>}
    {L && k && <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
      <span style={{
        position: "absolute", left: k.left, top: k.baseline - k.ascent - (k.size * 1.2 - k.ascent - k.descent) / 2,
        height: k.size * 1.2, lineHeight: `${k.size * 1.2}px`, whiteSpace: "nowrap",
        fontWeight: 600, fontSize: k.size, fontFamily: L.body, letterSpacing: 0, color: LINK_INK,
      }}>{LINK_LABEL}</span>
      <svg viewBox="0 0 24 24" width={k.icon} height={k.icon} fill="none" stroke={LINK_INK} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round"
        style={{ position: "absolute", left: k.left + k.labelW + k.gap, top: k.iconTop, overflow: "visible" }}>
        <path d={EXTERNAL_ICON} />
      </svg>
      <span style={{ position: "absolute", left: k.left, top: k.under, width: k.width, height: k.underH, background: LINK_INK }} />
    </div>}
  </div>;
}

function NoteNameCanvas({ name, recipeUrl, withPhoto }: { name: string; recipeUrl?: string | null; withPhoto: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [link, setLink] = useState<LinkBox | null>(null);
  const hasLink = !!recipeUrl;
  useCardWidth(canvas, name, (slip) => {
    const el = canvas.current;
    if (!el) return;
    /* full screen sharpness (phones are 3×); browser zoom also changes this */
    const ratio = Math.min(3, window.devicePixelRatio || 1);
    const W = Math.round(slip.offsetWidth * ratio);
    el.width = W; el.height = Math.round(slip.offsetHeight * ratio);
    const g = el.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, el.width, el.height);
    setLink(drawNoteText(g, W, name, { hasLink, withPhoto }));
  }, [name, hasLink, withPhoto]);

  return <>
    <canvas ref={canvas} className="picked-name-art" aria-hidden="true" style={{ ...COVER, pointerEvents: "none" }} />
    {recipeUrl && link && <a className="recipe-hit" href={recipeUrl} target="_blank" rel="noopener noreferrer"
      style={{ position: "absolute", left: `${link.left * 100}%`, top: `${link.top * 100}%`, width: `${link.width * 100}%`, height: `${link.height * 100}%` }}>
      <span className="sr-only">{LINK_LABEL}</span>
    </a>}
  </>;
}
