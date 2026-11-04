"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { MAX_PHOTO_CHARS, isWebUrl } from "@/lib/dishes";

export type NewDish = { name: string; recipeUrl: string; photoUrl: string | null };

async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP photo.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("That photo is a little big. Please choose one under 15 MB.");
  const source = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = source;
    await image.decode();
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your photo couldn’t be prepared. Please try another photo.");
    context.fillStyle = "#fffdf2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = 0.82;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > MAX_PHOTO_CHARS && quality > 0.3) {
      quality -= 0.12;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    if (data.length > MAX_PHOTO_CHARS) throw new Error("That photo is still too large. Please try a smaller one.");
    return data;
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function DishForm({ onSave, slipsLeft }: { onSave: (dish: NewDish) => Promise<void>; slipsLeft: number }) {
  const [name, setName] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handlePhoto(file?: File) {
    if (!file || saving) return;
    setProcessing(true);
    setError("");
    try { setPhotoUrl(await preparePhoto(file)); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "We couldn’t read that photo. Try another one."); }
    finally { setProcessing(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!name.trim()) { setError("A little name is all we need. What do you call this dish?"); return; }
    if (recipeUrl.trim() && !isWebUrl(recipeUrl.trim())) { setError("Please use a recipe link starting with https:// or http://."); return; }
    if (processing) return;
    setSaving(true);
    try { await onSave({ name: name.trim(), recipeUrl: recipeUrl.trim(), photoUrl }); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Your note couldn’t be saved. Give it another try."); setSaving(false); }
  }

  return <>
    <h2 id="add-title">Write a new slip</h2>
    <p className="dialog-description">A dish you’ve cooked and loved. {slipsLeft === 1 ? "Room for 1 more slip." : `Room for ${slipsLeft} more slips.`}</p>
    <form className="dish-form" onSubmit={submit} noValidate aria-busy={saving}>
      <div className="field-group">
        <label htmlFor="dish-name">Dish name</label>
        <input id="dish-name" data-autofocus type="text" maxLength={48} placeholder="e.g. Mom’s mushroom pasta" value={name} onChange={(event) => setName(event.target.value)} disabled={saving} autoComplete="off" required aria-describedby={error ? "dish-error" : undefined} />
      </div>
      <div className="field-group">
        <label htmlFor="recipe-link">Recipe link <span className="optional">optional</span></label>
        <div className="input-with-icon"><Icon name="link" size={17} /><input id="recipe-link" type="url" placeholder="https://your-favorite-recipe.com" value={recipeUrl} onChange={(event) => setRecipeUrl(event.target.value)} disabled={saving} maxLength={2048} /></div>
      </div>
      <div className="field-group">
        <label htmlFor="dish-photo">Photo <span className="optional">optional</span></label>
        <input id="dish-photo" ref={fileInput} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={saving || processing} tabIndex={-1} onChange={(event) => { void handlePhoto(event.target.files?.[0]); event.target.value = ""; }} />
        {photoUrl ? <div className="photo-preview"><Image src={photoUrl} alt="Preview of your dish" width={82} height={72} unoptimized /><div><strong>Looks delicious.</strong><button type="button" className="text-button" onClick={() => fileInput.current?.click()} disabled={processing || saving}>Change photo</button></div><button type="button" className="icon-button" onClick={() => setPhotoUrl(null)} aria-label="Remove photo" disabled={saving}><Icon name="close" size={17} /></button></div> : <button type="button" className={`photo-dropzone ${dragging ? "is-dragging" : ""}`} onClick={() => fileInput.current?.click()} disabled={saving || processing} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void handlePhoto(event.dataTransfer.files[0]); }}>
          <span className="upload-icon"><Icon name={processing ? "refresh" : "image"} size={22} className={processing ? "spin" : ""} /></span>
          <span><strong>{processing ? "Getting your photo ready…" : "Choose from your gallery"}</strong><small>or drop it here · JPG, PNG, WebP</small></span><Icon name="plus" size={18} />
        </button>}
      </div>
      {error && <p id="dish-error" className="form-error" role="alert">{error}</p>}
      <button type="submit" className="button button-primary submit-dish" disabled={saving || processing}><Icon name={saving ? "refresh" : "plus"} className={saving ? "spin" : ""} size={18} />{saving ? "Folding…" : "Fold it into the jar"}</button>
    </form>
  </>;
}
