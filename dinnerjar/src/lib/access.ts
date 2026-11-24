import { cookies } from "next/headers";
import { auth, signInEnabled } from "@/auth";
import { getJarId } from "@/lib/bowl";
import { OWNER_COOKIE, isOwnerKey } from "@/lib/owner";
import { getStore } from "@/lib/store";

/** view: look and pick. edit: also add and change notes. owner: also remove notes and manage share links. */
export type Role = "view" | "edit" | "owner";
export type Access = { jarId: string; role: Role };

export const canEdit = (role: Role) => role === "edit" || role === "owner";

/** The signed-in person's id, or null. */
export async function currentUserId(): Promise<string | null> {
  if (!signInEnabled) return null;
  return (await auth())?.uid ?? null;
}

/**
 * Which jar, and what this visitor may do in it.
 * With a share-link key: that link's jar and role. Without one: the shared jar, view only.
 * Whoever owns the jar (signed in, or holding the private owner link for the shared jar) is the owner either way.
 * Returns null when the key opens nothing.
 */
export async function resolveAccess(key: string | null | undefined): Promise<Access | null> {
  const store = await getStore();
  let jarId: string;
  let role: Role = "view";
  if (key) {
    const link = await store.jarForKey(key);
    if (!link) return null;
    jarId = link.jarId;
    role = link.role;
  } else {
    jarId = await getJarId();
  }
  const uid = await currentUserId();
  if (uid && (await store.ownsJar(jarId, uid))) role = "owner";
  else if (jarId === (await getJarId()) && isOwnerKey((await cookies()).get(OWNER_COOKIE)?.value)) role = "owner";
  return { jarId, role };
}

/** For API routes: the share-link key travels in the x-jar-key header. */
export function accessFromRequest(request: Request) {
  return resolveAccess(request.headers.get("x-jar-key"));
}
