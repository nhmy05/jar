"use client";

import { signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type Me = { enabled: boolean; user: { name: string | null; email: string | null } | null };

/** "Sign in" / "Sign out" in the header. Shows nothing until sign-in is switched on. */
export function AccountButton({ disabled }: { disabled?: boolean }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? (response.json() as Promise<Me>) : null))
      .then((data) => { if (live) setMe(data); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  if (!me?.enabled) return null;
  return <>
    <span className="nav-divider" />
    {me.user
      ? <button className="help-link" onClick={() => void signOut({ callbackUrl: "/" })} disabled={disabled} title={me.user.email ?? undefined}>Sign out</button>
      : <button className="help-link" onClick={() => void signIn("google", { callbackUrl: "/" })} disabled={disabled}>Sign in</button>}
  </>;
}
