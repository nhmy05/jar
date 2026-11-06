"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import type { Dish } from "@/lib/dishes";

export function DishCollection({ dishes, onSelect, onAdd, onRemove, isFull }: {
  dishes: Dish[];
  onSelect: (dish: Dish) => void;
  onAdd: () => void;
  /** only given to the owner: without it there is no trash button */
  onRemove?: (dish: Dish) => Promise<void>;
  isFull: boolean;
}) {
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const filtered = [...dishes].reverse().filter((dish) => dish.name.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));

  async function remove(dish: Dish) {
    setRemovingId(dish.id);
    setError("");
    try { await onRemove?.(dish); setConfirmId(null); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t take that note out."); }
    finally { setRemovingId(null); }
  }

  return <>
    <h2 id="collection-title">My dishes</h2>
    <p className="dialog-description">{dishes.length} {dishes.length === 1 ? "dish" : "dishes"} in the jar</p>
    <div className="collection-toolbar">
      <div className="input-with-icon"><Icon name="search" size={17} /><input type="search" placeholder="Find a favorite…" aria-label="Search your dishes" value={query} onChange={(event) => setQuery(event.target.value)} data-autofocus /></div>
      <button className="button button-primary button-small" onClick={onAdd} disabled={isFull}><Icon name="plus" size={16} /> Add a dish</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {query && <div className="collection-subheading"><span>{filtered.length} {filtered.length === 1 ? "match" : "matches"}</span><button className="text-button" onClick={() => setQuery("")}>Clear search</button></div>}
    <div className="collection-grid">
      {filtered.map((dish) => <div className="collection-slip" key={dish.id}>
        {onRemove && confirmId === dish.id ? <div className="slip-confirm">
          <span>Take <strong>{dish.name}</strong> out of the jar for good?</span>
          <div><button className="text-button" onClick={() => setConfirmId(null)} disabled={removingId === dish.id}>Keep it</button><button className="button button-secondary button-small danger" onClick={() => void remove(dish)} disabled={removingId === dish.id}>{removingId === dish.id ? "Removing…" : "Take out"}</button></div>
        </div> : <>
          <button className="slip-open" onClick={() => onSelect(dish)} aria-label={`Edit ${dish.name}`}>
            <span className="collection-slip-name">{dish.name}</span>
            {dish.photoUrl && <span className="collection-photo"><Image src={dish.photoUrl} alt="" width={260} height={260} unoptimized /></span>}
            {dish.recipeUrl && <span className="collection-slip-meta"><Icon name="link" size={12} /> recipe link</span>}
          </button>
          {onRemove && <button className="icon-button slip-remove" onClick={() => setConfirmId(dish.id)} aria-label={`Take ${dish.name} out of the jar`}><Icon name="trash" size={15} /></button>}
        </>}
      </div>)}
      {filtered.length === 0 && <div className="collection-empty">{dishes.length === 0 ? <><h3>The jar is empty.</h3><p>Add a dish you’ve cooked to get started.</p></> : <><h3>No note by that name.</h3><button className="text-button" onClick={() => setQuery("")}>Show all my dishes</button></>}</div>}
    </div>
  </>;
}
