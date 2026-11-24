import { NextResponse } from "next/server";
import { accessFromRequest, canEdit } from "@/lib/access";
import { validateDishInput } from "@/lib/dishes";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await accessFromRequest(request);
    if (access?.role !== "owner") return NextResponse.json({ error: "Only the jar’s owner can take notes out." }, { status: 403 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    const removed = await (await getStore()).remove(access.jarId, id);
    if (!removed) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not remove a dish:", error);
    return NextResponse.json({ error: "Couldn’t take that note out. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await accessFromRequest(request);
    if (!access) return NextResponse.json({ error: "That link doesn’t open a jar. Ask for a new one." }, { status: 404 });
    if (!canEdit(access.role)) return NextResponse.json({ error: "This link lets you look and pick, but not change notes. Ask for the edit link." }, { status: 403 });
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
    const dish = await (await getStore()).update(access.jarId, id, input);
    if (!dish) return NextResponse.json({ error: "That note isn’t in your jar." }, { status: 404 });
    return NextResponse.json({ dish });
  } catch (error) {
    console.error("Could not update a dish:", error);
    return NextResponse.json({ error: "Your changes couldn’t be saved. Please try again." }, { status: 500 });
  }
}
