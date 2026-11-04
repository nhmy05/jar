"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JarIllustration, type JarPhase } from "@/components/jar-illustration";
import { Dialog } from "@/components/dialog";
import { DishForm, type NewDish } from "@/components/dish-form";
import { DishCollection } from "@/components/dish-collection";
import { Doodles, JarLogo } from "@/components/doodles";
import { Icon, PlateDoodle } from "@/components/icons";
import { MAX_DISHES, PREVIEW_DISHES, isWebUrl, type Dish } from "@/lib/dishes";

type Modal = "add" | "collection" | "picked" | "help" | null;

const FOLD_MS = 2600;
const PULL_MS = 700;
const RETURN_MS = 600;

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something slipped. Let’s try that again.");
  return data as T;
}

export function DinnerJar() {
  const [dishes, setDishes] = useState<Dish[]>(PREVIEW_DISHES);
  const [loading, setLoading] = useState(true);
  const [savingDish, setSavingDish] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reload, setReload] = useState(0);
  const [phase, setPhase] = useState<JarPhase>("idle");
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Dish | null>(null);
  const [pendingDish, setPendingDish] = useState<Dish | null>(null);
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

  function closeModal() {
    if (savingDish) return;
    if (modal === "picked") putBack();
    else if (phase === "idle") setModal(null);
  }

  async function saveDish(input: NewDish) {
    if (busy.current) throw new Error("One slip at a time. Give this one a moment.");
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
      setPendingDish(dish);
      setModal(null);
      setPhase("adding");
      setAnnouncement(`Folding ${dish.name} and dropping it into the jar.`);
      later(() => {
        setDishes((previous) => [...previous, dish]);
        setPendingDish(null);
        setPhase("idle");
        busy.current = false;
        setToast(`${dish.name} is in the jar.`);
        setAnnouncement(`${dish.name} has been added to your jar.`);
      }, FOLD_MS);
    } finally {
      setSavingDish(false);
      if (!saved) busy.current = false;
    }
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
      later(() => {
        setModal("picked");
        setPhase("idle");
        setAnnouncement(`Tonight: ${dish.name}.`);
        busy.current = false;
      }, PULL_MS);
    } catch (error) {
      setPhase("idle");
      setActionError(error instanceof Error ? error.message : "That slip got away. Please try again.");
      busy.current = false;
    }
  }

  function putBack() {
    if (!selected || phase !== "idle") return;
    setModal(null);
    setPhase("returning");
    setAnnouncement(`${selected.name} is folded back into the jar.`);
    later(() => { setPhase("idle"); }, RETURN_MS);
  }

  const isBusy = loading || phase !== "idle" || savingDish;
  const isFull = dishes.length >= MAX_DISHES;
  const isEmpty = !loading && dishes.length === 0;

  return <div className="dinner-app">
    <Doodles />
    <header className="site-header">
      <Link className="brand" href="/" aria-label="What’s for Dinner? home"><JarLogo /><span>what’s for dinner<span className="brand-period">?</span></span></Link>
      <nav className="header-nav" aria-label="Main navigation">
        <button className="help-link" onClick={() => setModal("help")} disabled={isBusy}>How it works</button>
        <span className="nav-divider" />
        <button className="collection-button" onClick={() => setModal("collection")} disabled={isBusy}><Icon name="book" size={17} /><span>My dishes</span><span className="collection-count">{dishes.length}</span></button>
      </nav>
    </header>

    <main className="main-scene">
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">Can’t decide? <em>Ask the jar.</em></h1>
        <p>Write down dishes you’ve cooked and loved, fold them in,<br className="desktop-break" /> and pull one out whenever you need an idea.</p>
      </section>

      <section className="jar-scene" aria-label="Your dinner jar">
        <div className="scene-note note-left" aria-hidden="true"><span>every dish<br />you’ve loved</span><svg width="110" height="70" viewBox="0 0 110 70" fill="none"><path d="M8 6c-1 40 52 56 92 30m-9 .4 9-.4-4.1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div className="scene-note note-right" aria-hidden="true"><svg width="62" height="54" viewBox="0 0 62 54" fill="none"><path d="M56 8C37-1 15 14 19 35m-4-5 4 7 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span>folded twice,<br />names hidden</span></div>
        <div className="jar-stage">
          <JarIllustration dishes={dishes} phase={phase} onPick={() => void pickDish()} />
          {phase === "adding" && pendingDish && <div className="folding-slip" key={`fold-${pendingDish.id}`} aria-hidden="true">
            <div className="folding-sheet"><span className="folding-name">{pendingDish.name}</span><span className="fold-crease crease-vertical" /><span className="fold-crease crease-horizontal" /></div>
          </div>}
          {(phase === "pulling" || phase === "returning") && <div className={`flying-slip ${phase === "returning" ? "flying-back" : ""}`} key={phase} aria-hidden="true"><span className="flying-layer" /><span className="flying-corner" /></div>}
        </div>
        <div className="jar-count"><strong>{dishes.length}</strong> of {MAX_DISHES} slips in the jar</div>
      </section>

      <div className="jar-actions">
        <div className="action-buttons">
          <button className="button button-secondary" onClick={() => setModal("add")} disabled={isBusy || isFull || !!connectionError}><Icon name="plus" size={19} />Add a dish</button>
          <button className="button button-primary pick-button" onClick={() => void pickDish()} disabled={isBusy || isEmpty || !!connectionError}><Icon name={phase === "pulling" ? "refresh" : "shuffle"} size={19} className={phase === "pulling" ? "spin" : ""} />{phase === "pulling" ? "Reaching in…" : "Pull a slip"}</button>
        </div>
        <p className="action-caption">{isFull ? "The jar is full. Take a slip out in My dishes to make room." : isEmpty ? "The jar is empty. Add the first dish you’ve cooked." : "Every slip goes back in after you read it."}</p>
      </div>
      {connectionError && <div className="connection-error" role="alert"><p>{connectionError}</p><button className="text-button" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again <Icon name="refresh" size={14} /></button></div>}
      {actionError && <div className="connection-error" role="alert"><p>{actionError}</p><button className="icon-button" aria-label="Dismiss error" onClick={() => setActionError("")}><Icon name="close" size={16} /></button></div>}
    </main>

    <footer className="site-footer"><span>Saved in this browser as a guest · Google sign-in coming soon</span></footer>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

    {modal === "add" && <Dialog key="add" labelId="add-title" onClose={closeModal} className="add-dialog"><DishForm onSave={saveDish} slipsLeft={MAX_DISHES - dishes.length} /></Dialog>}
    {modal === "collection" && <Dialog key="collection" labelId="collection-title" onClose={closeModal} className="collection-dialog"><DishCollection dishes={dishes} onSelect={(dish) => { setSelected(dish); setModal("picked"); }} onAdd={() => setModal("add")} onRemove={removeDish} isFull={isFull} /></Dialog>}
    {modal === "picked" && selected && <Dialog key={`picked-${selected.id}`} labelId="picked-title" onClose={closeModal} className="picked-dialog">
      <div className="picked-slip">
        <span className="picked-crease picked-crease-v" /><span className="picked-crease picked-crease-h" />
        <div className="picked-content">
          <span className="picked-kicker">tonight, how about…</span>
          {selected.photoUrl && <div className="picked-photo"><Image src={selected.photoUrl} alt={selected.name} fill unoptimized sizes="340px" /></div>}
          <h2 id="picked-title">{selected.name}</h2>
          {selected.recipeUrl && isWebUrl(selected.recipeUrl) ? <a className="recipe-link" href={selected.recipeUrl} target="_blank" rel="noopener noreferrer"><Icon name="link" size={16} />Open the recipe<Icon name="external" size={13} /></a> : !selected.photoUrl && <div className="no-recipe"><PlateDoodle /></div>}
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
        <li><span className="step-number">1</span><div><h3>Write it on a slip</h3><p>A dish you’ve cooked before. Add a photo from your gallery or a recipe link if you like.</p></div></li>
        <li><span className="step-number">2</span><div><h3>Fold it, drop it in</h3><p>The slip is folded twice so the name stays hidden. The jar holds up to {MAX_DISHES}.</p></div></li>
        <li><span className="step-number">3</span><div><h3>Pull one out</h3><p>Unfold it to see tonight’s idea. Put it back or pick another. Slips always go back in the jar.</p></div></li>
      </ol>
      <div className="help-tip"><Icon name="heart" size={17} /><p>You’re using the jar as a guest, so it’s saved in this browser. Signing in with Google to keep your jar everywhere is coming soon.</p></div>
      <button className="button button-primary help-done" onClick={closeModal}>Got it</button>
    </Dialog>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={15} /></span>{toast}<button className="icon-button" onClick={() => setToast("")} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}
  </div>;
}
