"use client";

/*
 * The fold-and-drop motion, ported from design-refs/slip-fold-motion.html.
 *
 *   0.00–0.30  Hold    flat note, name showing
 *   0.30–1.00  Fold 1  sheet bows and rolls over; the crease sets as it closes
 *   1.00–1.75  Fold 2  same roll on the other axis; the name ends up inside
 *   1.75–2.15  Drop    let go, falls straight down into the jar, tips flat, folds start to relax
 *   2.15–2.50  Land    one small bounce
 *   2.50–3.30  Settle  the fold relaxes open a little (about 17°), then still
 *
 * "drop" plays it forward (adding a dish, putting one back).
 * "lift" is pulling one out: it rises out of the jar, folding shut as it's picked up, then
 * unfolds while it grows toward you, ending the size and place of the picked note.
 *
 * Drawn on a see-through canvas over the flat jar. Once it's let go it moves behind the
 * front glass, so it falls in through the opening. It lands looking exactly like the pile
 * picture (public/note-landed.png, made by renderLandedNote), so the hand-off can't be seen.
 * World units: 100 px of the jar's 640 × 640 box = 1 unit, y = 0 at the jar's base.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { NOTE_POSES } from "@/lib/pile";
import { PHOTO_LEFT, PHOTO_NOTE_ASPECT, PHOTO_RADIUS, CARD_RADIUS, PHOTO_SIZE, PHOTO_TOP, loadNoteFont } from "@/lib/note-layout";
import { drawNoteText } from "@/lib/note-text";

export const FOLD_SECONDS = 3.3;
/** Pulling a note out: lift it out of the jar, then unfold it as it grows toward you. */
export const LIFT_SECONDS = 2.65;

const W = 3, H = 2.2, PI = Math.PI;
/** Every note is a tall card; the old wide shape is kept for reference (pile pictures). */
const noteHeight = (withPhoto: boolean) => (withPhoto ? W * PHOTO_NOTE_ASPECT : H);
const tune = { flex: 0, roll: 1, bounce: 1, open: 1 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const eio = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const eout = (p: number) => 1 - Math.pow(1 - p, 3);
const ein = (p: number) => p * p;

/** Bend a flap: distance d from the crease, total angle th, soft bend length b → [in-plane, out-of-plane, local angle]. */
function bend(d: number, th: number, b: number): [number, number, number] {
  if (th < 1e-5) return [d, 0, 0];
  if (b < 1e-4) return [d * Math.cos(th), d * Math.sin(th), th];
  const k = th / b;
  if (d <= b) { const f = k * d; return [Math.sin(f) / k, (1 - Math.cos(f)) / k, f]; }
  return [Math.sin(th) / k + (d - b) * Math.cos(th), (1 - Math.cos(th)) / k + (d - b) * Math.sin(th), th];
}

type Pose = { th1: number; b1: number; bow: number; th2: number; b2: number; s1: number; s2: number; fall: number; land: number };

/** Paper shape at time t, straight from the study. */
function paper(t: number, open = 1): Pose {
  const R = tune.roll;
  const p1 = seg(t, 0.30, 0.95);
  let th1 = PI * eio(p1);
  let b1 = lerp(1.15 * R, 0.012, eio(p1));
  const bow = Math.sin(PI * clamp(p1 / 0.55)) * 0.32 * R * (1 - p1 * 0.6);
  const p2 = seg(t, 1.05, 1.70);
  let th2 = PI * eio(p2);
  let b2 = lerp(0.95 * R, 0.045, eio(p2));

  const pf = seg(t, 1.75, 2.15), pl = seg(t, 2.15, 2.50);
  let flex = Math.pow(Math.sin(PI * Math.min(1, pf * 1.05)), 1.3) * tune.flex;
  if (t >= 2.15) flex = -0.10 * tune.flex * Math.sin(PI * pl) * (1 - pl);
  th1 -= flex * 0.7; th2 -= flex * 0.85;
  b1 += Math.max(0, flex) * 0.18; b2 += Math.max(0, flex) * 0.22;
  /* the folds relax open a little, from the moment it's let go through the settle */
  const relax = eout(seg(t, 1.75, 2.9)) * 0.3 * tune.open * open;
  th1 -= relax * 0.15; th2 -= relax; b2 += relax * 0.15;

  return { th1, b1, bow, th2, b2, s1: eio(p1), s2: eio(p2), fall: pf, land: pl };
}

/* ---------- the name, written on the paper ---------- */

/** Plain white paper, the same white as the notes in the jar. Light and shade give it its shape. */
/* White paper. The photo card has soft corners: outside them the canvas stays see-through. */
function paperEdge(g: CanvasRenderingContext2D, w: number, h: number, radius = 0) {
  g.fillStyle = "#FFFFFF";
  if (!radius) { g.fillRect(0, 0, w, h); return; }
  g.clearRect(0, 0, w, h);
  g.beginPath(); g.roundRect(0, 0, w, h, radius); g.fill();
}

function plainPaper(tall = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 600; canvas.height = tall ? Math.round(600 * PHOTO_NOTE_ASPECT) : 440;
  paperEdge(canvas.getContext("2d")!, canvas.width, canvas.height, tall ? CARD_RADIUS * 600 : 0);
  return canvas;
}

/* Every note is the same tall card. With a photo: square photo with an even white border at
   the top, name (and link) centred below. Without: name centred on the card.
   Same numbers as the picked card (lib/note-layout). */
function writeName(name: string, photo: HTMLImageElement | null = null, hasLink = false, withPhoto = false, width = 1200) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = Math.round(width * PHOTO_NOTE_ASPECT);
  const W = canvas.width;
  const g = canvas.getContext("2d")!;
  paperEdge(g, W, canvas.height, CARD_RADIUS * W);
  const px = PHOTO_LEFT * W, py = PHOTO_TOP * W, side = PHOTO_SIZE * W;
  if (withPhoto) {
    g.save();
    g.beginPath(); g.roundRect(px, py, side, side, PHOTO_RADIUS * W); g.clip();
    if (photo && photo.naturalWidth) {
      const crop = Math.min(photo.naturalWidth, photo.naturalHeight);
      g.drawImage(photo, (photo.naturalWidth - crop) / 2, (photo.naturalHeight - crop) / 2, crop, crop, px, py, side, side);
    } else {
      g.fillStyle = "#f1ede0"; g.fillRect(px, py, side, side);
    }
    g.restore();
  }
  /* the same drawing the picked card shows, so the swap at the end is seamless */
  drawNoteText(g, W, name, { hasLink, withPhoto });
  return canvas;
}

/* ---------- the note: paper, lights, poses ---------- */

const HOLD_TILT = PI - 0.04;   // facing you, like a note in your hand
const REST_TILT = PI - 0.42;   // tipped back, lying in the pile

/* Soft daylight from above and a little to the left, with a gentle fill, so the folds and the
   open edge get real light and shade, but white paper never goes darker than a soft warm grey
   (the small emissive glow on the paper). The pile pictures use the same light. */
/* Two moods: "air" has more contrast so the folds and edges read while it's held and folding;
   "rest" is softer so notes in the pile stay light. The light eases from one to the other as a
   note falls (and back as one is lifted), and the pile pictures use "rest", so a landed note
   still matches its picture. */
const AIR = { sky: 2.3, ground: new THREE.Color(0xf6f4ec), key: 1.6, fill: 0.8 };
const REST = { sky: 2.5, ground: new THREE.Color(0xf6f1e4), key: 1.6, fill: 1.1 };

function addLights(scene: THREE.Scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfffaf0, 1);
  key.position.set(-1.2, 2.6, 2.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  fill.position.set(1.5, -0.5, 2);
  scene.add(fill);
  /** 0 = air, 1 = rest */
  /* `flat` (0..1) eases to a light that shows the paper exactly as drawn: no glow, no shade.
     A flat note facing you then looks the same as the picked card it lands on. */
  const white = new THREE.Color(0xffffff), glow = new THREE.Color(0x383328);
  const set = (m: number, flat = 0) => {
    hemi.intensity = lerp(lerp(AIR.sky, REST.sky, m), PI, flat);
    hemi.groundColor.copy(AIR.ground).lerp(REST.ground, m).lerp(white, flat);
    key.intensity = lerp(lerp(AIR.key, REST.key, m), 0, flat);
    fill.intensity = lerp(lerp(AIR.fill, REST.fill, m), 0, flat);
    scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
      if (mat && mat.emissive) mat.emissive.copy(glow).multiplyScalar(1 - flat);
    });
  };
  set(1);
  return set;
}

function makeNote(name: string, photoUrl: string | null = null, hasLink = false, tall = true, texWidth = 1200) {
  let photo: HTMLImageElement | null = null;
  const nameCanvas = writeName(name, null, hasLink, !!photoUrl, texWidth);
  const frontTex = new THREE.CanvasTexture(nameCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;
  /* the viewer side is the geometry's back face; mirror so the name reads right */
  frontTex.wrapS = THREE.RepeatWrapping; frontTex.repeat.x = -1; frontTex.offset.x = 1;
  const NH = noteHeight(tall);
  const geo = new THREE.PlaneGeometry(W, NH, 64, Math.round(48 * NH / H));
  const base = (geo.attributes.position.array as Float32Array).slice();
  const frontMat = new THREE.MeshLambertMaterial({ map: frontTex, side: THREE.BackSide, emissive: 0x383328, alphaTest: 0.5 });
  const backTex = new THREE.CanvasTexture(plainPaper(tall));
  backTex.colorSpace = THREE.SRGBColorSpace;
  backTex.anisotropy = 8;
  const backMat = new THREE.MeshLambertMaterial({ map: backTex, side: THREE.FrontSide, emissive: 0x383328, alphaTest: 0.5 });
  const shift = new THREE.Group(); shift.add(new THREE.Mesh(geo, frontMat), new THREE.Mesh(geo, backMat));
  const spin = new THREE.Group(); spin.rotation.z = PI; spin.add(shift);
  /* outer: tilt and size. turn: where it is, and its left/right turn on screen */
  const outer = new THREE.Group(); outer.rotation.order = "YXZ"; outer.add(spin);
  const turn = new THREE.Group(); turn.add(outer);

  function shape(t: number, open = 1) {
    const P = paper(t, open);
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      let x = base[i], y = base[i + 1], z = 0;
      z -= P.bow * Math.pow(x / (W / 2), 2) * 0.5;
      /* fold 1: right half over, toward the viewer, so the name ends up inside */
      { const c = 0.006; if (x < c) { const r = bend(c - x, P.th1, P.b1); const zl = -z; x = c - (r[0] - zl * Math.sin(r[2])); z = -(r[1] + zl * Math.cos(r[2])); } }
      /* fold 2: top half over, also toward the viewer */
      { const c = -0.0225; if (y > c) { const r = bend(y - c, P.th2, P.b2); const zl = -z; y = c + r[0] - zl * Math.sin(r[2]); z = -(r[1] + zl * Math.cos(r[2])); } }
      pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    shift.position.set((-W / 4) * P.s1, (NH / 4) * P.s2, 0);
    return P;
  }

  function redraw() {
    nameCanvas.getContext("2d")!.drawImage(writeName(name, photo, hasLink, !!photoUrl, texWidth), 0, 0);
    frontTex.needsUpdate = true;
  }

  if (photoUrl) {
    const img = new Image();
    img.onload = () => { photo = img; redraw(); };
    img.src = photoUrl;
  }

  function dispose() { geo.dispose(); frontTex.dispose(); backTex.dispose(); frontMat.dispose(); backMat.dispose(); }

  return { turn, outer, shape, redraw, dispose };
}

/**
 * Picture of a landed note in one of NOTE_POSES (the last frame of the motion), for the pile.
 * 2.4 × 2.4 world units around the note's center. Used to make public/notes/note-N.png.
 */
export function renderLandedNote(poseIndex: number, px = 480, tall = false) {
  const pose = NOTE_POSES[poseIndex];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(px, px, false);
  const scene = new THREE.Scene();
  addLights(scene);
  const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 40);
  camera.position.set(0, 0, 20);
  const note = makeNote("", null, false, tall);
  note.shape(FOLD_SECONDS, pose.open);
  note.outer.rotation.set(REST_TILT + pose.tilt, pose.yaw, 0);
  note.turn.rotation.set(0, 0, pose.roll);
  scene.add(note.turn);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  note.dispose(); renderer.dispose();
  return url;
}

/* ---------- the component ---------- */

/** A pile spot, in the jar's 640 box: center, width, and which of NOTE_POSES it lands in. */
export type Spot = { x: number; y: number; width: number; pose: number };
/** drop: add a dish. lift: pull one out. return: put the picked one back, starting from its card. */
export type FoldMotion = { mode: "drop" | "lift" | "return"; name: string; photoUrl?: string | null; hasLink?: boolean; spot: Spot; from?: { left: number; top: number; width: number; height: number } };
/** Putting back: the open note shrinks from its card to just above the jar, then the fold and drop play. */
const SHRINK_SECONDS = 0.7;
/** How much faster picking and putting back play than adding (with QUICK_OPEN: lift ≈ 1s, put back ≈ 1.6s). */
const QUICK = 2;
/** adding a dish plays this much faster than the study (3.3s → about 1.3s) */
const ADD_SPEED = 2.6;
/** Faster still for the unfold-and-grow when picking, and the shrink-and-fold when putting back. */
const QUICK_OPEN = 3;
/** The fold-and-drop when putting back (about 1.4s at QUICK, 0.5s at this rate). */
const PUT_BACK_DROP = 3.1;
/** Putting back: the fold after the shrink. */
const PUT_BACK_FOLD = 3.7;
/** The shrink when putting back (0.7s of motion, about 0.3s real). */
const SHRINK_RATE = 2.3;

/** Jar box (640 px) to world: 100 px = 1 unit, the canvas bottom (box y 640) is world y −0.3. */
const toWorld = (spot: Spot) => {
  const pose = NOTE_POSES[spot.pose];
  const turn = pose.roll;
  return { x: (spot.x - 320) / 100, y: 6.1 - spot.y / 100, scale: spot.width / 150, turn, tilt: REST_TILT + pose.tilt, yaw: pose.yaw, open: pose.open };
};

export function FoldingNote({ motion, onDone, onMidway, onReady }: { motion: FoldMotion; onDone: () => void; onMidway?: () => void; onReady?: () => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  const midway = useRef(onMidway);
  const ready = useRef(onReady);
  useEffect(() => { done.current = onDone; midway.current = onMidway; ready.current = onReady; }, [onDone, onMidway, onReady]);

  useEffect(() => {
    const el = holder.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce) { const id = setTimeout(() => done.current(), 0); return () => clearTimeout(id); }

    let renderer: THREE.WebGLRenderer;
    let lowQuality = false;
    try {
      /* weak phones (few cores or little memory) get the lighter setting: no edge smoothing, normal pixel density */
      const nav = navigator as Navigator & { deviceMemory?: number };
      const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
      lowQuality = weak;
      renderer = new THREE.WebGLRenderer({ antialias: !weak, alpha: true });
    } catch {
      const id = setTimeout(() => done.current(), 0);
      return () => clearTimeout(id);
    }
    renderer.setPixelRatio(lowQuality ? 1 : Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    /* the canvas covers the jar box plus half a box above it: world y from −0.3 to 9.3.
       A long lens, so it lines up with the flat drawing. */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(12, 1 / 1.5, 1, 120);
    const dist = 9.6 / (2 * Math.tan((6 * PI) / 180));
    camera.position.set(0, 4.5, dist);
    camera.lookAt(0, 4.5, 0);
    const setLight = addLights(scene);

    /* picking and putting back: draw the note at the picked card's exact screen pixels, so
       where the two meet, one texture pixel is one screen pixel and the text is as crisp as
       the card's (offsetWidth ignores the popup's own entry scale) */
    const slip = document.querySelector<HTMLElement>(".picked-dialog .picked-slip");
    const cardPx = motion.from?.width ?? slip?.offsetWidth ?? 0;
    const texWidth = motion.mode !== "drop" && cardPx > 0 ? Math.round(cardPx * renderer.getPixelRatio()) : 1200;
    const note = makeNote(motion.name, motion.photoUrl ?? null, !!motion.hasLink, true, texWidth);
    scene.add(note.turn);

    /* held in the middle, above the jar's opening, while it's written and folded; then let go,
       it falls through the opening, drifting to its spot, tipping flat and turning a little */
    const rest = toWorld(motion.spot);
    const HOLD = { x: 0, y: 6.6, scale: 0.78 };  // centered over the opening

    function apply(t: number) {
      setLight(eio(seg(t, 1.75, 2.6)));
      const P = note.shape(t, rest.open);
      let x = HOLD.x, y = HOLD.y, rx = HOLD_TILT, ry = 0, k = HOLD.scale, rz = 0;
      if (t >= 1.75) {
        const f = ein(P.fall), g = eio(P.fall);
        x = lerp(HOLD.x, rest.x, g);
        y = lerp(HOLD.y, rest.y, f);
        rx = lerp(HOLD_TILT, rest.tilt, g);
        ry = lerp(0, rest.yaw, g);
        k = lerp(HOLD.scale, rest.scale, g);
        if (t >= 2.15) {
          const pl = P.land;
          x = rest.x; k = rest.scale;
          y = rest.y + Math.abs(Math.sin(PI * 2 * pl)) * Math.exp(-4.5 * pl) * 0.16 * tune.bounce * rest.scale;
          ry = rest.yaw;
          rx = rest.tilt + Math.sin(PI * 2 * pl) * Math.exp(-4 * pl) * 0.06 * tune.bounce;
        }
      }
      /* turns as it falls; a half-turn note needs a little longer, so it finishes as it lands */
      if (t >= 1.75) rz = lerp(0, rest.turn, eio(seg(t, 1.75, Math.abs(rest.turn) > PI / 2 ? 2.4 : 2.15)));
      note.outer.rotation.set(rx, ry, 0);
      note.outer.scale.setScalar(k);
      note.turn.position.set(x, y, 0);
      note.turn.rotation.set(0, 0, rz);
      /* in front of the whole jar while above it; behind the front glass once it's falling in */
      el!.style.zIndex = t < 1.75 ? "3" : "1";
      renderer.render(scene, camera);
    }

    /* Once it's out of the jar, the note moves to a full-screen layer above the popup's
       blurred background, and flies onto the popup's (still hidden) note card. */
    let overlay: HTMLDivElement | null = null;
    let cam: THREE.Camera = camera;
    const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    flat.position.set(0, 0, 50);

    /** the jar box on screen: world units from px, same as the jar canvas uses */
    function jarFrame() {
      const r = el!.getBoundingClientRect();
      return { ppu: r.width / 6.4, cx: r.left + r.width / 2, bottom: r.bottom };
    }

    function toOverlay() {
      overlay = document.createElement("div");
      overlay.className = "fold-overlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
      overlay.appendChild(renderer.domElement);
      cam = flat;
    }

    function fitOverlay() {
      const f = jarFrame(), vw = window.innerWidth, vh = window.innerHeight;
      flat.left = -f.cx / f.ppu; flat.right = (vw - f.cx) / f.ppu;
      flat.top = -0.3 + f.bottom / f.ppu; flat.bottom = -0.3 + (f.bottom - vh) / f.ppu;
      flat.updateProjectionMatrix();
      renderer.setSize(vw, vh, false);
    }

    /** a screen rectangle (the picked note card) in world units */
    function fromRect(card: { left: number; top: number; width: number; height: number }) {
      const f = jarFrame();
      return { x: (card.left + card.width / 2 - f.cx) / f.ppu, y: -0.3 + (f.bottom - (card.top + card.height / 2)) / f.ppu, k: card.width / (W * f.ppu) };
    }

    function toStage() {
      el!.appendChild(renderer.domElement);
      overlay?.remove();
      overlay = null;
      cam = camera;
      resize();
    }

    /** where the picked note card is (or will be), in world units */
    function pickedTarget() {
      const f = jarFrame();
      const card = document.querySelector(".picked-dialog .picked-slip")?.getBoundingClientRect();
      if (card && card.width > 0) return fromRect(card);
      const tall = true;
      const width = tall ? Math.min(440, (window.innerHeight - 200) / PHOTO_NOTE_ASPECT, window.innerWidth - 12 * 2) : Math.min(560, (window.innerHeight - 200) / (H / W), window.innerWidth - 12 * 2);
      const k = width / (W * f.ppu);
      return { x: 0, y: -0.3 + (f.bottom - window.innerHeight / 2) / f.ppu, k };
    }

    /* putting back: shrink from the card to the hold point above the jar, flat and facing you,
       then hand over to the normal fold and drop */
    function applyReturn(e: number) {
      if (e >= SHRINK_SECONDS) {
        if (overlay) toStage();
        apply(Math.min(FOLD_SECONDS, e - SHRINK_SECONDS));
        return;
      }
      if (!overlay) toOverlay();
      fitOverlay();
      setLight(0, 1 - eio(seg(e, 0, SHRINK_SECONDS * 0.45)));
      const start = fromRect(motion.from!);
      const g = eio(seg(e, 0, SHRINK_SECONDS));
      note.shape(0);
      note.outer.rotation.set(lerp(PI, HOLD_TILT, g), 0, 0);
      note.outer.scale.setScalar(lerp(start.k, HOLD.scale, g));
      note.turn.position.set(lerp(start.x, HOLD.x, g), lerp(start.y, HOLD.y, g), 0);
      note.turn.rotation.set(0, 0, 0);
      renderer.render(scene, cam);
    }

    let halfway = false;
    function applyLift(e: number) {
      setLight(1 - eio(seg(e, 0, 0.8)), eio(seg(e, 2.1, 2.65)));
      if (!halfway && e >= 0.8) { halfway = true; toOverlay(); midway.current?.(); }
      if (overlay) fitOverlay();
      const target = pickedTarget();
      const rise = seg(e, 0, 0.8), grow = seg(e, 1.55, 2.65);
      /* while rising, the relaxed folds close up (shape time 3.3 → 1.75). Then the fold plays
         backwards at its real speed (1.75 → 0.3): fold 2 rolls open, then fold 1, exactly
         like folding it, reversed. It grows into the picked note as the last fold opens. */
      const st = e < 0.8 ? lerp(FOLD_SECONDS, 1.75, eout(rise)) : Math.max(0.3, 1.75 - (e - 0.8));
      note.shape(st, rest.open);
      const r = eout(rise), g = eio(grow);
      const x = lerp(lerp(rest.x, 0, r), target.x, g);
      const y = lerp(lerp(rest.y, HOLD.y, r), target.y, g);
      const k = lerp(lerp(rest.scale, HOLD.scale, r), target.k, g);
      note.outer.rotation.set(lerp(rest.tilt, PI, r), lerp(rest.yaw, 0, r), 0);
      note.outer.scale.setScalar(k);
      note.turn.position.set(x, y, 0);
      note.turn.rotation.set(0, 0, lerp(rest.turn, 0, r));
      /* behind the front glass while still in the jar, in front once it's out */
      el!.style.zIndex = rise < 0.55 ? "1" : "3";
      renderer.render(scene, cam);
    }

    function resize() {
      if (overlay) return;
      const r = el!.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    /* first frame right away, so there's no gap between the pile note and this one */
    /* adding a dish plays at the study's speed. Picking and putting back play faster, and
       faster still for the unfold-and-grow (pick) and the shrink-and-fold (put back).
       Each stage: [motion time it ends at, how many times faster than the study]. */
    const total = motion.mode === "drop" ? FOLD_SECONDS : motion.mode === "lift" ? LIFT_SECONDS : (motion.from ? SHRINK_SECONDS : 0) + FOLD_SECONDS;
    const stages: [number, number][] =
      motion.mode === "drop" ? [[total, ADD_SPEED]]
      : motion.mode === "lift" ? [[0.8, QUICK], [total, QUICK_OPEN]]
      : motion.from ? [[SHRINK_SECONDS, SHRINK_RATE], [SHRINK_SECONDS + 1.75, PUT_BACK_FOLD], [total, PUT_BACK_DROP]]
      : [[total, PUT_BACK_DROP]];
    const toMotion = (real: number) => {
      let at = 0, used = 0;
      for (const [end, rate] of stages) {
        const span = (end - at) / rate;
        if (real <= used + span) return at + (real - used) * rate;
        at = end; used += span;
      }
      return total;
    };
    const play = (real: number) => {
      const e = toMotion(real);
      if (motion.mode === "drop") apply(Math.min(FOLD_SECONDS, e));
      else if (motion.mode === "lift") applyLift(Math.min(LIFT_SECONDS, e));
      else if (motion.from) applyReturn(Math.min(SHRINK_SECONDS + FOLD_SECONDS, e));
      else apply(Math.min(FOLD_SECONDS, e));
    };
    const length = stages.reduce((sum, [end, rate], i) => sum + (end - (i ? stages[i - 1][0] : 0)) / rate, 0);
    play(0);
    ready.current?.();

    let frame = 0, lastNow = 0, elapsed = 0, finished = false;
    /* a stall (e.g. mounting the popup, moving the canvas to the overlay) can delay a frame by
       a lot; cap how far one step can move the clock so the note pauses through it instead of
       jumping straight to a later point in the motion */
    const MAX_STEP = 1 / 30;
    /* the note's text needs the bold handwriting font, with the letters in this name (accents
       live in their own font file). The browser only fetches it once something asks for it, so
       ask here: drawing before it arrives uses a smaller stand-in font that jumps on landing */
    const fonts = loadNoteFont(motion.name);
    fonts.then(() => {
      if (finished) return;
      note.redraw();
      const tick = (now: number) => {
        if (!lastNow) lastNow = now;
        elapsed += Math.min((now - lastNow) / 1000, MAX_STEP);
        lastNow = now;
        play(elapsed);
        if (elapsed >= length) { finished = true; done.current(); return; }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });

    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      note.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      overlay?.remove();
    };
  }, [motion]);

  return <div ref={holder} className="fold-canvas" aria-hidden="true" />;
}
