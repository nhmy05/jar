import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { auth, signInEnabled } from "@/auth";
import { getStore } from "@/lib/store";

export const OWNER_COOKIE = "dinner-jar-owner";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** True when `candidate` is the secret owner key from OWNER_KEY. With no key set, nobody is the owner. */
export function isOwnerKey(candidate: string | undefined | null): boolean {
  const key = process.env.OWNER_KEY;
  if (!key || !candidate) return false;
  return timingSafeEqual(digest(key), digest(candidate));
}

/** True when the signed-in person owns the shared jar. */
export async function isSignedInOwner(): Promise<boolean> {
  if (!signInEnabled) return false;
  const uid = (await auth())?.uid;
  return !!uid && (await (await getStore()).ownsSharedJar(uid));
}

/** The jar's owner: signed in as its owner, or (for now) a browser that opened the private owner link. */
export async function isOwner(): Promise<boolean> {
  return (await isSignedInOwner()) || isOwnerKey((await cookies()).get(OWNER_COOKIE)?.value);
}
