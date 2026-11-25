"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

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

const ACCESS: Record<LinkRole, { label: string; help: string; icon: "eye" | "edit"; copy: string }> = {
  view: { label: "Can view", help: "Look and pick a dish", icon: "eye", copy: "Copy view link" },
  edit: { label: "Can edit", help: "Also add and change notes", icon: "edit", copy: "Copy edit link" },
};

/** Owner only: choose what the link allows, copy it, or reset it so its old address stops working. */
export function ShareDialog({ jarKey }: { jarKey?: string }) {
  const [links, setLinks] = useState<Links | null>(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState<LinkRole>("view");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  /** the link is only shown when it couldn’t be copied for you */
  const [showLink, setShowLink] = useState(false);
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
      setError("");
      setShowLink(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowLink(true);
      setError("Couldn’t copy automatically. Select the link below and copy it.");
    }
  }

  async function reset() {
    setBusy(true);
    setError("");
    try {
      setLinks(await request<Links>({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }, jarKey));
      setConfirming(false);
      setCopied(false);
      setShowLink(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Couldn’t reset that link.");
    } finally {
      setBusy(false);
    }
  }

  const choose = (value: LinkRole) => { setRole(value); setCopied(false); setConfirming(false); setShowLink(false); setError(""); };

  return <>
    <h2 id="share-title">Share your jar</h2>
    <p className="dialog-description">What can people do with your link?</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <fieldset className="share-choices" disabled={busy}>
      <legend className="sr-only">What can people do with your link?</legend>
      {(Object.keys(ACCESS) as LinkRole[]).map((value) => <label key={value} className="share-card">
        <input type="radio" name="share-role" value={value} checked={role === value} onChange={() => choose(value)} />
        <strong><Icon name={ACCESS[value].icon} size={16} />{ACCESS[value].label}</strong>
        <span>{ACCESS[value].help}</span>
      </label>)}
    </fieldset>
    {showLink && links && <input className="share-fallback" readOnly value={address(links[role])} aria-label={ACCESS[role].copy.replace("Copy ", "")} onFocus={(event) => event.currentTarget.select()} />}
    <button className="button button-primary share-copy" onClick={() => void copy()} disabled={!links}><Icon name={copied ? "check" : "link"} size={18} />{copied ? "Copied" : ACCESS[role].copy}</button>
    <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    {confirming
      ? <div className="share-confirm"><span>Reset the {role} link? The old one stops working for everyone who has it.</span><button className="text-button" onClick={() => setConfirming(false)} disabled={busy}>Keep it</button><button className="button button-secondary button-small danger" onClick={() => void reset()} disabled={busy}>Reset link</button></div>
      : <button className="text-button share-reset" onClick={() => setConfirming(true)} disabled={!links}>Reset this link</button>}
  </>;
}
