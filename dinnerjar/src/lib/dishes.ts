export type Dish = {
  id: string;
  name: string;
  /** Short address of the photo, e.g. /api/dishes/<id>/photo?v=ab12cd34. The photo itself is only downloaded when shown. */
  photoUrl: string | null;
  recipeUrl: string | null;
};

/** The jar art is drawn full at this many notes. Past it, adding still works and the jar stays drawn full. Never shown to people. */
export const JAR_FULL_AT = 50;

/** Hidden safety cap so spam on the shared link can't fill free storage. Never shown to people. */
export const MAX_DISHES = 500;

/** New jars start empty. */
export const STARTER_DISHES: { name: string }[] = [];

export function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const MAX_PHOTO_CHARS = 1_400_000;

/** What the app sends back for a photo it already has: "leave it as it is". */
const KEEP_PHOTO = /^\/api\/dishes\/[0-9a-f-]{36}\/photo(\?[A-Za-z0-9=&_-]*)?$/i;

/**
 * photoUrl: a new photo (data:image...), null to have no photo, or undefined to keep the
 * current one (the app sent back the photo's address unchanged).
 */
export function validateDishInput(input: unknown): {
  name: string;
  recipeUrl: string | null;
  photoUrl: string | null | undefined;
} {
  if (!input || typeof input !== "object") throw new Error("Please fill in your dish details.");
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 48) throw new Error("Give your dish a name, up to 48 characters.");
  const recipeUrl = typeof body.recipeUrl === "string" ? body.recipeUrl.trim() : "";
  if (recipeUrl.length > 2048 || (recipeUrl && !isWebUrl(recipeUrl))) {
    throw new Error("Please use a full recipe link starting with https:// or http://.");
  }
  const sent = typeof body.photoUrl === "string" ? body.photoUrl : null;
  if (sent && KEEP_PHOTO.test(sent)) return { name, recipeUrl: recipeUrl || null, photoUrl: undefined };
  const photoUrl = sent;
  if (
    photoUrl &&
    (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photoUrl) || photoUrl.length > MAX_PHOTO_CHARS)
  ) {
    throw new Error("Please choose a JPG, PNG, or WebP photo.");
  }
  return { name, recipeUrl: recipeUrl || null, photoUrl };
}
