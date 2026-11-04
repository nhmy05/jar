import { cookies } from "next/headers";
import { getStore } from "@/lib/store";

const COOKIE_NAME = "dinner-jar-session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The guest's jar lives behind a cookie for now; Google sign-in will claim it later. */
export async function getJarId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  const store = await getStore();
  const { id, created } = await store.ensureJar(existing && UUID.test(existing) ? existing : null);
  if (created || id !== existing) {
    jar.set(COOKIE_NAME, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}
