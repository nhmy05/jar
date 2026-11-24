import { NextResponse } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { getStore, type LinkRole } from "@/lib/store";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

/** The jar's view and edit link keys. Owner only. Created the first time they're asked for. */
export async function GET(request: Request) {
  try {
    const access = await accessFromRequest(request);
    if (access?.role !== "owner") return NextResponse.json({ error: "Only the jar’s owner can see its share links." }, { status: 403 });
    return NextResponse.json(await (await getStore()).ensureLinks(access.jarId), { headers });
  } catch (error) {
    console.error("Could not load share links:", error);
    return NextResponse.json({ error: "Couldn’t load the share links. Please try again." }, { status: 500 });
  }
}

/** Reset one link: the old key stops working at once. Body: { role: "view" | "edit" }. Owner only. */
export async function POST(request: Request) {
  try {
    const access = await accessFromRequest(request);
    if (access?.role !== "owner") return NextResponse.json({ error: "Only the jar’s owner can reset share links." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const role: LinkRole | null = body?.role === "view" || body?.role === "edit" ? body.role : null;
    if (!role) return NextResponse.json({ error: "Say which link to reset: view or edit." }, { status: 400 });
    const store = await getStore();
    await store.resetLink(access.jarId, role);
    return NextResponse.json(await store.ensureLinks(access.jarId), { headers });
  } catch (error) {
    console.error("Could not reset a share link:", error);
    return NextResponse.json({ error: "Couldn’t reset that link. Please try again." }, { status: 500 });
  }
}
