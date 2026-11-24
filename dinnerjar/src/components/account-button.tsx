"use client";

import { signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type Me = { enabled: boolean; user: { name: string | null; email: string | null } | null };

/** One request shared by the header button and the guest strip. */
let mePromise: Promise<Me | null> | null = null;
function loadMe() {
  mePromise ??= fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
    .then((response) => (response.ok ? (response.json() as Promise<Me>) : null))
    .catch(() => null);
  return mePromise;
}

function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let live = true;
    void loadMe().then((data) => { if (live) setMe(data); });
    return () => { live = false; };
  }, []);
  return me;
}

/** Header: a green "Sign in" button for guests, your initial with a small menu once signed in. Nothing until sign-in is switched on. */
export function AccountButton({ disabled }: { disabled?: boolean }) {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: Event) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (!me?.enabled) return null;
  if (!me.user) {
    return <button className="signin-button" onClick={() => void signIn("google", { callbackUrl: "/" })} disabled={disabled}>Sign in</button>;
  }
  const initial = (me.user.name || me.user.email || "?").trim().charAt(0).toUpperCase();
  return <div className="account-menu" ref={box}>
    <button className="avatar-button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} aria-label="Your account">{initial}</button>
    {open && <div className="account-popup" role="menu">
      {me.user.email && <div className="account-email">{me.user.email}</div>}
      <button role="menuitem" onClick={() => void signOut({ callbackUrl: "/" })}>Sign out</button>
    </div>}
  </div>;
}

const DISMISSED_KEY = "dinnerjar-guest-strip-dismissed";

/** For guests only: a handwritten note pointing at Sign in. The × hides it on this device. */
export function GuestStrip() {
  const me = useMe();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISSED_KEY) === "1"; } catch {}
    const id = requestAnimationFrame(() => setHidden(dismissed));
    return () => cancelAnimationFrame(id);
  }, []);

  if (hidden || !me?.enabled || me.user) return null;
  return <div className="guest-note" role="note">
    <svg width="46" height="34" viewBox="0 0 46 34" fill="none" aria-hidden="true"><path d="M4 30c10-2 26-8 34-24m-9 1 9-2 1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <span>sign in to start <br />your own jar</span>
    <button className="note-close" aria-label="Dismiss" onClick={() => { setHidden(true); try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {} }}>×</button>
  </div>;
}
