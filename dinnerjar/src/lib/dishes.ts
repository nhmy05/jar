export type Dish = {
  id: string;
  name: string;
  photoUrl: string | null;
  recipeUrl: string | null;
};

/** One jar holds at most this many slips. */
export const MAX_DISHES = 50;

export const STARTER_DISHES: { name: string }[] = [
  { name: "Adobo" },
  { name: "Pho" },
  { name: "Tacos" },
  { name: "Mushroom pasta" },
  { name: "Kimchi fried rice" },
  { name: "Shakshuka" },
  { name: "Coconut dal" },
  { name: "Dumplings" },
  { name: "Bibimbap" },
  { name: "Lentil soup" },
  { name: "Teriyaki chicken" },
  { name: "Pesto gnocchi" },
];

export const PREVIEW_DISHES: Dish[] = STARTER_DISHES.map((dish, index) => ({
  ...dish,
  id: `preview-${index}`,
  photoUrl: null,
  recipeUrl: null,
}));

export function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const MAX_PHOTO_CHARS = 1_400_000;

export function validateDishInput(input: unknown): {
  name: string;
  recipeUrl: string | null;
  photoUrl: string | null;
} {
  if (!input || typeof input !== "object") throw new Error("Please fill in your dish details.");
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 48) throw new Error("Give your dish a name, up to 48 characters.");
  const recipeUrl = typeof body.recipeUrl === "string" ? body.recipeUrl.trim() : "";
  if (recipeUrl.length > 2048 || (recipeUrl && !isWebUrl(recipeUrl))) {
    throw new Error("Please use a full recipe link starting with https:// or http://.");
  }
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl : null;
  if (
    photoUrl &&
    (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photoUrl) || photoUrl.length > MAX_PHOTO_CHARS)
  ) {
    throw new Error("Please choose a JPG, PNG, or WebP photo.");
  }
  return { name, recipeUrl: recipeUrl || null, photoUrl };
}
