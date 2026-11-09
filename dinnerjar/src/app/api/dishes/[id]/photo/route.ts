import { getJarId } from "@/lib/bowl";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** The photo as a real image. The address carries ?v=<fingerprint>, so a changed photo has a new address and this can be cached for good. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
    const data = await (await getStore()).photo(await getJarId(), id);
    const match = data?.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not load a photo:", error);
    return new Response("Could not load the photo", { status: 500 });
  }
}
