import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const OWNER_COOKIE = "dinner-jar-owner";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** True when `candidate` is the secret owner key from OWNER_KEY. With no key set, nobody is the owner. */
export function isOwnerKey(candidate: string | undefined | null): boolean {
  const key = process.env.OWNER_KEY;
  if (!key || !candidate) return false;
  return timingSafeEqual(digest(key), digest(candidate));
}

/** Only browsers that opened the private owner link carry the key cookie. */
export async function isOwner(): Promise<boolean> {
  return isOwnerKey((await cookies()).get(OWNER_COOKIE)?.value);
}
