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

type LinkRole = "view" | "edit";

const ACCESS: Record<LinkRole, { label: string; help: string }> = {
  view: { label: "Can view", help: "People can look at the jar and pick a dish." },
  edit: { label: "Can edit", help: "People can also add dishes and change notes. Only you can take notes out." },
};

/** Owner only: choose what the link allows, copy it, or reset it so its old address stops working. */
export function ShareDialog({ jarKey, onDone }: { jarKey?: string; onDone: () => void }) {
  const [links, setLinks] = useState<Links | null>(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState<LinkRole>("view");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    request<Links>(undefined, jarKey)
      .then((data) => { if (live) setLinks(data); })
      .catch((problem) => { if (live) setError(problem instanceof Error ? problem.message : "Couldn’t load the links."); });
    return () => { live = false; };
  }, [jarKey]);

  const address = (key: string) => `${window.location.origin}/j/${key}`;

  async function copy() {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn’t copy automatically. Select the link and copy it.");
    }
  }

  async function reset() {
    setBusy(true);
    setError("");
    try {
      setLinks(await request<Links>({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }, jarKey));
      setConfirming(false);
      setCopied(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Couldn’t reset that link.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <h2 id="share-title">Share your jar</h2>
    <p className="dialog-description">Anyone with the link can open it. They don’t need to sign in.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="share-access">
      <label htmlFor="share-role">Anyone with the link</label>
      <select id="share-role" value={role} disabled={busy} onChange={(event) => { setRole(event.target.value as LinkRole); setCopied(false); setConfirming(false); }}>
        {(Object.keys(ACCESS) as LinkRole[]).map((value) => <option key={value} value={value}>{ACCESS[value].label}</option>)}
      </select>
    </div>
    <p className="share-help" aria-live="polite">{ACCESS[role].help}</p>
    <div className="share-row-link">
      <input readOnly value={links ? address(links[role]) : "Loading…"} aria-label={`Link: ${ACCESS[role].label.toLowerCase()}`} onFocus={(event) => event.currentTarget.select()} />
      <button className="button button-primary button-small" onClick={() => void copy()} disabled={!links}>{copied ? "Copied" : "Copy link"}</button>
    </div>
    {confirming
      ? <div className="share-confirm"><span>Reset the “{ACCESS[role].label.toLowerCase()}” link? The old one stops working for everyone who has it.</span><button className="text-button" onClick={() => setConfirming(false)} disabled={busy}>Keep it</button><button className="button button-secondary button-small danger" onClick={() => void reset()} disabled={busy}>Reset link</button></div>
      : <button className="text-button share-reset" onClick={() => setConfirming(true)} disabled={!links}>Reset this link</button>}
    <button className="button button-primary help-done share-done" onClick={onDone}>Done</button>
  </>;
}
