"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { topSpot, type JarPhase } from "@/components/jar-illustration";
import { FOLD_SECONDS, type FoldMotion } from "@/components/folding-note";
import { PILE } from "@/lib/pile";
import { JarView } from "@/components/jar-view";
import { Dialog } from "@/components/dialog";
import { DishForm, type NewDish } from "@/components/dish-form";
import { DishCollection } from "@/components/dish-collection";
import { Doodles, JarLogo } from "@/components/doodles";
import { Icon } from "@/components/icons";
import { MAX_DISHES, isWebUrl, type Dish } from "@/lib/dishes";

type Modal = "add" | "edit" | "collection" | "picked" | "help" | null;

/* if the motion can't run (no WebGL, script failed to load), carry on anyway */
const MOTION_SAFETY_MS = FOLD_SECONDS * 1000 + 4000;

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something slipped. Let’s try that again.");
  return data as T;
}

export function DinnerJar() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDish, setSavingDish] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reload, setReload] = useState(0);
  const [phase, setPhase] = useState<JarPhase>("idle");
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Dish | null>(null);
  /** the note open for editing, from My dishes */
  const [editing, setEditing] = useState<Dish | null>(null);
  const [motion, setMotion] = useState<FoldMotion | null>(null);
  /** the top note is out of the jar: in the air, or open in the picked popup */
  const [outOfJar, setOutOfJar] = useState(false);
  /** the picked note just unfolded out of the jar, so its popup shows without its own unfold */
  const [freshPull, setFreshPull] = useState(false);
  const afterMotion = useRef<(() => void) | null>(null);
  const midMotion = useRef<(() => void) | null>(null);
  /** the popup is open but its note card waits for the flying note to land on it */
  const [arriving, setArriving] = useState(false);
  const [toast, setToast] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ dishes: Dish[] }>("/api/dishes", { signal: controller.signal })
      .then((data) => { setDishes(data.dishes); setConnectionError(""); })
      .catch((error) => { if (error.name !== "AbortError") setConnectionError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function later(callback: () => void, delay: number) {
    timers.current.push(setTimeout(callback, delay));
  }

  /** Play the fold motion, then run `then` once (when it ends, or after a safety wait). */
  function playMotion(mode: FoldMotion["mode"], name: string, spotIndex: number, then: () => void, halfway?: () => void, from?: FoldMotion["from"]) {
    let ran = false, midRan = false;
    const mid = () => { if (midRan) return; midRan = true; midMotion.current = null; halfway?.(); };
    const finish = () => { if (ran) return; ran = true; mid(); afterMotion.current = null; setMotion(null); then(); };
    afterMotion.current = finish;
    midMotion.current = mid;
    setMotion({ mode, name, spot: PILE[spotIndex], from });
    later(finish, MOTION_SAFETY_MS);
  }

  useEffect(() => { if (modal !== "edit" && modal !== "collection") setEditing(null); }, [modal]);

  function closeModal() {
    if (savingDish) return;
    if (modal === "picked") putBack();
    else if (modal === "edit") setModal("collection");
    else if (phase === "idle") setModal(null);
  }

  async function saveDish(input: NewDish) {
    if (busy.current) throw new Error("One note at a time. Give this one a moment.");
    busy.current = true;
    setSavingDish(true);
    let saved = false;
    try {
      const { dish } = await apiRequest<{ dish: Dish }>("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      saved = true;
      setModal(null);
      setPhase("adding");
      setAnnouncement(`Folding ${dish.name} and dropping it into the jar.`);
      playMotion("drop", dish.name, topSpot(dishes.length + 1), () => {
        setDishes((previous) => [...previous, dish]);
        setPhase("idle");
        busy.current = false;
        setToast(`${dish.name} is in the jar.`);
        setAnnouncement(`${dish.name} has been added to your jar.`);
      });
    } finally {
      setSavingDish(false);
      if (!saved) busy.current = false;
    }
  }

  async function updateDish(dish: Dish, input: NewDish) {
    const { dish: updated } = await apiRequest<{ dish: Dish }>(`/api/dishes/${dish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setDishes((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    if (selected?.id === updated.id) setSelected(updated);
    setModal("collection");
    setToast(`${updated.name} is saved.`);
    setAnnouncement(`Your changes to ${updated.name} are saved.`);
  }

  async function removeDish(dish: Dish) {
    await apiRequest<{ ok: true }>(`/api/dishes/${dish.id}`, { method: "DELETE" });
    setDishes((previous) => previous.filter((item) => item.id !== dish.id));
    if (selected?.id === dish.id) setSelected(null);
    setToast(`${dish.name} is out of the jar.`);
    setAnnouncement(`${dish.name} was taken out of your jar.`);
  }

  async function pickDish() {
    if (loading || busy.current || connectionError || dishes.length === 0) return;
    busy.current = true;
    setActionError("");
    setModal(null);
    setPhase("pulling");
    setAnnouncement("Reaching into the jar…");
    try {
      const { dish } = await apiRequest<{ dish: Dish }>("/api/dishes/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exceptId: selected?.id || null }),
      });
      setSelected(dish);
      setOutOfJar(true);
      playMotion("lift", dish.name, topSpot(dishes.length), () => {
        setArriving(false);
        setPhase("idle");
        setAnnouncement(`Tonight: ${dish.name}.`);
        busy.current = false;
      }, () => {
        /* open the popup while the note unfolds: the background blurs, the card waits */
        setFreshPull(true);
        setArriving(true);
        setModal("picked");
      });
    } catch (error) {
      setPhase("idle");
      setOutOfJar(false);
      setActionError(error instanceof Error ? error.message : "That note got away. Please try again.");
      busy.current = false;
    }
  }

  function putBack() {
    if (!selected || phase !== "idle") return;
    /* the note starts from where its card is, then shrinks to above the jar */
    const card = document.querySelector(".picked-dialog .picked-slip")?.getBoundingClientRect();
    const from = card ? { left: card.left, top: card.top, width: card.width, height: card.height } : undefined;
    setModal(null);
    /* opened from My dishes: it never left the jar */
    if (!outOfJar) return;
    setPhase("returning");
    busy.current = true;
    setAnnouncement(`${selected.name} is folded back into the jar.`);
    playMotion("return", selected.name, topSpot(dishes.length), () => {
      setOutOfJar(false);
      setPhase("idle");
      busy.current = false;
    }, undefined, from);
  }

  const isBusy = loading || phase !== "idle" || savingDish;
  const isFull = dishes.length >= MAX_DISHES;
  const isEmpty = !loading && dishes.length === 0;

  return <div className="dinner-app">
    <header className="site-header">
      <Link className="brand" href="/" aria-label="The dinner jar home"><JarLogo /><span>the dinner jar<span className="brand-period">.</span></span></Link>
      <nav className="header-nav" aria-label="Main navigation">
        <button className="help-link" onClick={() => setModal("help")} disabled={isBusy}>How it works</button>
        <span className="nav-divider" />
        <button className="collection-button" onClick={() => setModal("collection")} disabled={isBusy}><Icon name="book" size={17} /><span>My dishes</span><span className="collection-count">{dishes.length}</span></button>
      </nav>
    </header>

    <main className="main-scene">
      <section className="hero" aria-labelledby="hero-title">
        <Doodles group="hero" />
        <h1 id="hero-title">Can’t decide? <em>Ask the jar</em></h1>
        <p>Write down dishes you’ve cooked and loved, fold them in,<br className="desktop-break" /> and pull one out whenever you need an idea.</p>
      </section>

      <section className="jar-scene" aria-label="Your dinner jar">
        <Doodles group="jar" />
        <div className="scene-note note-left" aria-hidden="true"><span>every dish<br />you’ve loved</span><svg width="110" height="70" viewBox="0 0 110 70" fill="none"><path d="M8 6c-1 40 52 56 92 30m-9 .4 9-.4-4.1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div className="scene-note note-right" aria-hidden="true"><svg width="62" height="54" viewBox="0 0 62 54" fill="none"><path d="M56 8C37-1 15 14 19 35m-4-5 4 7 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span>dishes<br />to try</span></div>
        <div className="jar-stage">
          <JarView dishes={dishes} phase={phase} hideTop={outOfJar} motion={motion} onMotionDone={() => afterMotion.current?.()} onMotionMidway={() => midMotion.current?.()} />
        </div>
        <div className="jar-count">{isEmpty ? "No dishes yet" : <><strong>{dishes.length}</strong> {dishes.length === 1 ? "dish" : "dishes"} to choose from</>}</div>
      </section>

      <div className="jar-actions">
        <div className="action-buttons">
          <button className="button button-secondary" onClick={() => setModal("add")} disabled={isBusy || isFull || !!connectionError}><Icon name="plus" size={19} />Add a dish</button>
          <button className="button button-primary pick-button" onClick={() => void pickDish()} disabled={isBusy || isEmpty || !!connectionError}><Icon name={phase === "pulling" ? "refresh" : "shuffle"} size={19} className={phase === "pulling" ? "spin" : ""} />{phase === "pulling" ? "Reaching in…" : "Pick a dish"}</button>
        </div>
        {(isFull || isEmpty) && <p className="action-caption">{isFull ? "The jar is full. Take a note out in My dishes to make room." : "The jar is empty. Add the first dish you’ve cooked."}</p>}
      </div>
      {connectionError && <div className="connection-error" role="alert"><p>{connectionError}</p><button className="text-button" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again <Icon name="refresh" size={14} /></button></div>}
      {actionError && <div className="connection-error" role="alert"><p>{actionError}</p><button className="icon-button" aria-label="Dismiss error" onClick={() => setActionError("")}><Icon name="close" size={16} /></button></div>}
    </main>

    <footer className="site-footer"><span>Made to answer the question: What’s for dinner?</span></footer>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

    {modal === "add" && <Dialog key="add" labelId="add-title" onClose={closeModal} className="add-dialog"><DishForm onSave={saveDish} /></Dialog>}
    {modal === "edit" && editing && <Dialog key={`edit-${editing.id}`} labelId="add-title" onClose={closeModal} className="add-dialog" noScrimFade hideClose><DishForm initial={editing} onSave={(input) => updateDish(editing, input)} /></Dialog>}
    {modal === "collection" && <Dialog key="collection" labelId="collection-title" onClose={closeModal} className="collection-dialog" noScrimFade={!!editing}><DishCollection dishes={dishes} onSelect={(dish) => { setEditing(dish); setModal("edit"); }} onAdd={() => setModal("add")} onRemove={removeDish} isFull={isFull} /></Dialog>}
    {modal === "picked" && selected && <Dialog key={`picked-${selected.id}`} labelId="picked-title" onClose={closeModal} className={`picked-dialog${freshPull ? " from-pull" : ""}${arriving ? " arriving" : ""}`}>
      <div className="picked-slip">
        <div className="picked-content">
          {selected.photoUrl && <div className="picked-photo"><Image src={selected.photoUrl} alt={selected.name} fill unoptimized sizes="340px" /></div>}
          <h2 id="picked-title">{selected.name}</h2>
          {selected.recipeUrl && isWebUrl(selected.recipeUrl) ? <a className="recipe-link" href={selected.recipeUrl} target="_blank" rel="noopener noreferrer"><Icon name="link" size={16} />Open the recipe<Icon name="external" size={13} /></a> : null}
        </div>
      </div>
      <div className="picked-actions">
        <button className="button button-secondary" onClick={putBack}><Icon name="back" size={17} />Put back</button>
        <button className="button button-primary" onClick={() => void pickDish()}><Icon name="shuffle" size={17} />Pick another</button>
      </div>
    </Dialog>}
    {modal === "help" && <Dialog key="help" labelId="help-title" onClose={closeModal} className="help-dialog">
      <h2 id="help-title">How the jar works</h2>
      <ol className="help-steps">
        <li><span className="step-number">1</span><div><h3>Write a note</h3><p>A dish you’ve cooked before. Add a photo from your gallery or a recipe link if you like.</p></div></li>
        <li><span className="step-number">2</span><div><h3>Drop it in</h3><p>The note is folded twice so the name stays hidden inside.</p></div></li>
        <li><span className="step-number">3</span><div><h3>Pull one out</h3><p>Unfold it to see tonight’s idea. Put it back or pick another. Notes always go back in the jar.</p></div></li>
      </ol>
      <div className="help-tip"><Icon name="heart" size={17} /><p>You’re using the jar as a guest, so it’s saved in this browser. Signing in with Google to keep your jar everywhere is coming soon.</p></div>
      <button className="button button-primary help-done" onClick={closeModal}>Got it</button>
    </Dialog>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={15} /></span>{toast}<button className="icon-button" onClick={() => setToast("")} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}
  </div>;
}
