"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { JarFront, JarIllustration, type JarPhase } from "@/components/jar-illustration";
import type { FoldMotion } from "@/components/folding-note";
import type { Dish } from "@/lib/dishes";

/* Three.js loads after the page shows, not with it */
const FoldingNote = dynamic(() => import("@/components/folding-note").then((m) => m.FoldingNote), { ssr: false });

/** The jar, drawn flat to match the mockup, with the folding note between its back and front. */
export function JarView({ dishes, phase, hideTop, motion, onMotionDone, onMotionMidway, onMotionReady }: {
  dishes: Dish[]; phase: JarPhase; hideTop: boolean; motion: FoldMotion | null; onMotionDone: () => void; onMotionMidway: () => void; onMotionReady: () => void;
}) {
  /* fetch the motion code once the page is idle, so the first note moves without a wait */
  useEffect(() => {
    const id = setTimeout(() => { void import("@/components/folding-note"); }, 1500);
    return () => clearTimeout(id);
  }, []);
  return <div className="jar-flat">
    <JarIllustration dishes={dishes} phase={phase} hideTop={hideTop} />
    {motion && <FoldingNote motion={motion} onDone={onMotionDone} onMidway={onMotionMidway} onReady={onMotionReady} />}
    <JarFront />
  </div>;
}
