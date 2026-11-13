import { NextResponse } from "next/server";
import { auth, signInEnabled } from "@/auth";

export const dynamic = "force-dynamic";

/** Who is signed in, and whether signing in is switched on at all. */
export async function GET() {
  if (!signInEnabled) return NextResponse.json({ enabled: false, user: null }, { headers: { "Cache-Control": "no-store" } });
  const session = await auth();
  const user = session?.user ? { name: session.user.name ?? null, email: session.user.email ?? null } : null;
  return NextResponse.json({ enabled: true, user }, { headers: { "Cache-Control": "no-store" } });
}
