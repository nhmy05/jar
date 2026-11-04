import { NextResponse } from "next/server";
import { getJarId } from "@/lib/bowl";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const exceptId = typeof body?.exceptId === "string" && /^[0-9a-f-]{36}$/i.test(body.exceptId) ? body.exceptId : null;
    const jarId = await getJarId();
    const dish = await (await getStore()).pick(jarId, exceptId);
    if (!dish) return NextResponse.json({ error: "The jar is empty — add your first dish." }, { status: 404 });
    return NextResponse.json({ dish }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not pick a dish:", error);
    return NextResponse.json({ error: "That slip got away! Give it another try." }, { status: 500 });
  }
}
