import { NextResponse } from "next/server";
import { accessFromRequest } from "@/lib/access";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const exceptId = typeof body?.exceptId === "string" && /^[0-9a-f-]{36}$/i.test(body.exceptId) ? body.exceptId : null;
    const access = await accessFromRequest(request);
    if (!access) return NextResponse.json({ error: "That link doesn’t open a jar. Ask for a new one." }, { status: 404 });
    const dish = await (await getStore()).pick(access.jarId, exceptId);
    if (!dish) return NextResponse.json({ error: "The jar is empty — add your first dish." }, { status: 404 });
    return NextResponse.json({ dish }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not pick a dish:", error);
    return NextResponse.json({ error: "That note got away! Give it another try." }, { status: 500 });
  }
}
