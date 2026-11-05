import { getStore } from "@/lib/store";

let cached: string | null = null;

/** Everyone using the shared link gets the same jar. The jar id is still stored on every dish, so per-person jars can come later. */
export async function getJarId(): Promise<string> {
  cached ??= await (await getStore()).sharedJarId();
  return cached;
}
