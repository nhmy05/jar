import { NextResponse } from "next/server";
import { getJarId } from "@/lib/bowl";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "That slip isn’t in your jar." }, { status: 404 });
    const removed = await (await getStore()).remove(await getJarId(), id);
    if (!removed) return NextResponse.json({ error: "That slip isn’t in your jar." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not remove a dish:", error);
    return NextResponse.json({ error: "Couldn’t take that slip out. Please try again." }, { status: 500 });
  }
}
