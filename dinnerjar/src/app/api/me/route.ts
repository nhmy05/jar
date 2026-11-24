import { NextResponse } from "next/server";
import { auth, signInEnabled } from "@/auth";
import { getJarId } from "@/lib/bowl";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Who is signed in, and whether signing in is switched on at all. */
export async function GET() {
  if (!signInEnabled) return NextResponse.json({ enabled: false, user: null }, { headers: { "Cache-Control": "no-store" } });
  const session = await auth();
  const uid = session?.uid;
  const user = session?.user ? { name: session.user.name ?? null, email: session.user.email ?? null } : null;
  return NextResponse.json({ enabled: true, user, ownsJar: user && uid ? await (await getStore()).ownsJar(await getJarId(), uid) : false }, { headers: { "Cache-Control": "no-store" } });
}
