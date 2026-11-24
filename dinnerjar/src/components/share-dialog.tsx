"use client";

import { useEffect, useState } from "react";

type Links = { view: string; edit: string };

async function request<T>(init: RequestInit | undefined, jarKey?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  if (jarKey) headers.set("x-jar-key", jarKey);
  const response = await fetch("/api/jar/links", { cache: "no-store", credentials: "same-origin", ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something slipped. Let’s try that again.");
  return data as T;
}

const ROWS = [
  { role: "view", title: "View link", help: "People can look at the jar and pick a dish." },
  { role: "edit", title: "Edit link", help: "People can also add dishes and change notes. Only you can take notes out." },
] as const;

/** Owner only: copy the view and edit links, or reset one so its old address stops working. */
export function ShareDialog({ jarKey, onDone }: { jarKey?: string; onDone: () => void }) {
  const [links, setLinks] = useState<Links | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"view" | "edit" | null>(null);
  const [confirming, setConfirming] = useState<"view" | "edit" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    request<Links>(undefined, jarKey)
      .then((data) => { if (live) setLinks(data); })
      .catch((problem) => { if (live) setError(problem instanceof Error ? problem.message : "Couldn’t load the links."); });
    return () => { live = false; };
  }, [jarKey]);

  const address = (key: string) => `${window.location.origin}/j/${key}`;

  async function copy(role: "view" | "edit") {
    if (!links) return;
    try {
      try {
        await navigator.clipboard.writeText(address(links[role]));
      } catch {
        /* older browsers, or no permission: copy through a temporary text box instead */
        const box = document.createElement("textarea");
        box.value = address(links[role]);
        box.style.position = "fixed";
        box.style.opacity = "0";
        document.body.appendChild(box);
        box.select();
        const done = document.execCommand("copy");
        box.remove();
        if (!done) throw new Error("copy failed");
      }
      setCopied(role);
      setTimeout(() => setCopied((current) => (current === role ? null : current)), 2000);
    } catch {
      setError("Couldn’t copy automatically. Select the link and copy it.");
    }
  }

  async function reset(role: "view" | "edit") {
    setBusy(true);
    setError("");
    try {
      setLinks(await request<Links>({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }, jarKey));
      setConfirming(null);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Couldn’t reset that link.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <h2 id="share-title">Share links</h2>
    <p className="dialog-description">Send a link to anyone. They don’t need to sign in.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="share-rows">
      {ROWS.map(({ role, title, help }) => <div className="share-row" key={role}>
        <div className="share-row-head"><strong>{title}</strong><span>{help}</span></div>
        <div className="share-row-link">
          <input readOnly value={links ? address(links[role]) : "Loading…"} aria-label={title} onFocus={(event) => event.currentTarget.select()} />
          <button className="button button-primary button-small" onClick={() => void copy(role)} disabled={!links}>{copied === role ? "Copied" : "Copy"}</button>
        </div>
        {confirming === role
          ? <div className="share-confirm"><span>Reset this link? The old one stops working for everyone who has it.</span><button className="text-button" onClick={() => setConfirming(null)} disabled={busy}>Keep it</button><button className="button button-secondary button-small danger" onClick={() => void reset(role)} disabled={busy}>Reset link</button></div>
          : <button className="text-button share-reset" onClick={() => setConfirming(role)} disabled={!links}>Reset this link</button>}
      </div>)}
    </div>
    <button className="button button-primary help-done" onClick={onDone}>Done</button>
  </>;
}
