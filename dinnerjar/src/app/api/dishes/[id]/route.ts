import { NextResponse } from "next/server";
import { getJarId } from "@/lib/bowl";
import { validateDishInput } from "@/lib/dishes";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    const removed = await (await getStore()).remove(await getJarId(), id);
    if (!removed) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not remove a dish:", error);
    return NextResponse.json({ error: "Couldn’t take that note out. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    if (Number(request.headers.get("content-length") || 0) > 1_600_000) {
      return NextResponse.json({ error: "That photo is a little too large. Please choose a smaller one." }, { status: 413 });
    }
    let input;
    try {
      input = validateDishInput(await request.json());
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Please check your dish details." }, { status: 400 });
    }
    const dish = await (await getStore()).update(await getJarId(), id, input);
    if (!dish) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    return NextResponse.json({ dish });
  } catch (error) {
    console.error("Could not update a dish:", error);
    return NextResponse.json({ error: "Your changes couldn’t be saved. Please try again." }, { status: 500 });
  }
}
