import { NextResponse } from "next/server";
import { getJarId } from "@/lib/bowl";
import { MAX_DISHES, validateDishInput } from "@/lib/dishes";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jarId = await getJarId();
    const dishes = await (await getStore()).list(jarId);
    return NextResponse.json({ dishes }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Could not load the jar:", error);
    return NextResponse.json({ error: "We couldn’t open your jar. Please try again in a moment." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 1_600_000) {
      return NextResponse.json({ error: "That photo is a little too large. Please choose a smaller one." }, { status: 413 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Please send valid dish details." }, { status: 400 });
    }
    let input;
    try {
      input = validateDishInput(body);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Please check your dish details." }, { status: 400 });
    }
    const jarId = await getJarId();
    const store = await getStore();
    if ((await store.count(jarId)) >= MAX_DISHES) {
      return NextResponse.json({ error: "The jar is full. Take a note out to make room." }, { status: 409 });
    }
    const dish = await store.add(jarId, input);
    return NextResponse.json({ dish }, { status: 201 });
  } catch (error) {
    console.error("Could not save a dish:", error);
    return NextResponse.json({ error: "Your note couldn’t be saved. Please try again." }, { status: 500 });
  }
}
