import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Dish } from "@/lib/dishes";

type NewDish = { name: string; recipeUrl: string | null; photoUrl: string | null };
/** photoUrl undefined = keep the photo the dish already has */
type DishChanges = { name: string; recipeUrl: string | null; photoUrl: string | null | undefined };

export interface DishStore {
  /** The one shared jar: the oldest jar, created the first time it is needed. */
  sharedJarId(): Promise<string>;
  list(jarId: string): Promise<Dish[]>;
  count(jarId: string): Promise<number>;
  add(jarId: string, dish: NewDish): Promise<Dish>;
  remove(jarId: string, dishId: string): Promise<boolean>;
  update(jarId: string, dishId: string, dish: DishChanges): Promise<Dish | null>;
  pick(jarId: string, exceptId: string | null): Promise<Dish | null>;
  /** The photo itself (a data: URL), or null if the dish has none. Only the photo route asks for this. */
  photo(jarId: string, dishId: string): Promise<string | null>;
}

/** Small fingerprint of a photo. The photo address changes when the photo does, so browsers never show an old one. */
export const photoVersion = (data: string) => createHash("md5").update(data).digest("hex").slice(0, 8);

const photoAddress = (id: string, version: string | null) => (version ? `/api/dishes/${id}/photo?v=${version}` : null);

/** `version` is the photo's fingerprint, or null when the dish has no photo. The photo data is never part of a Dish. */
const toDish = (row: { id: string; name: string; recipeUrl: string | null }, version: string | null): Dish => ({
  id: row.id,
  name: row.name,
  photoUrl: photoAddress(row.id, version),
  recipeUrl: row.recipeUrl,
});

/* ---------- Postgres (used whenever DATABASE_URL is set, e.g. Neon in production) ---------- */

async function postgresStore(): Promise<DishStore> {
  const { db } = await import("@/db");
  const { jars, dishes } = await import("@/db/schema");
  const { and, asc, count, eq, ne, sql } = await import("drizzle-orm");

  /* everything but the photo; the photo's fingerprint is worked out inside the database, so no photo data is sent */
  const light = {
    id: dishes.id,
    name: dishes.name,
    recipeUrl: dishes.recipeUrl,
    version: sql<string | null>`left(md5(${dishes.photoUrl}), 8)`,
  };

  return {
    async sharedJarId() {
      const [oldest] = await db.select({ id: jars.id }).from(jars).orderBy(asc(jars.createdAt)).limit(1);
      if (oldest) return oldest.id;
      const [jar] = await db.insert(jars).values({}).returning({ id: jars.id });
      return jar.id;
    },
    async list(jarId) {
      const rows = await db.select(light).from(dishes).where(eq(dishes.jarId, jarId)).orderBy(asc(dishes.createdAt));
      return rows.map((row) => toDish(row, row.version));
    },
    async count(jarId) {
      const [row] = await db.select({ value: count() }).from(dishes).where(eq(dishes.jarId, jarId));
      return Number(row?.value ?? 0);
    },
    async add(jarId, input) {
      const [row] = await db.insert(dishes).values({ ...input, jarId }).returning(light);
      return toDish(row, row.version);
    },
    async remove(jarId, dishId) {
      const rows = await db.delete(dishes).where(and(eq(dishes.id, dishId), eq(dishes.jarId, jarId))).returning({ id: dishes.id });
      return rows.length > 0;
    },
    async update(jarId, dishId, input) {
      /* photoUrl undefined: drizzle leaves the column alone, so the photo stays */
      const [row] = await db.update(dishes).set(input).where(and(eq(dishes.id, dishId), eq(dishes.jarId, jarId))).returning(light);
      return row ? toDish(row, row.version) : null;
    },
    async pick(jarId, exceptId) {
      let [row] = await db
        .select(light)
        .from(dishes)
        .where(and(eq(dishes.jarId, jarId), exceptId ? ne(dishes.id, exceptId) : undefined))
        .orderBy(sql`random()`)
        .limit(1);
      if (!row && exceptId) [row] = await db.select(light).from(dishes).where(eq(dishes.jarId, jarId)).limit(1);
      if (!row) return null;
      await db.update(dishes).set({ lastPickedAt: new Date() }).where(eq(dishes.id, row.id));
      return toDish(row, row.version);
    },
    async photo(jarId, dishId) {
      const [row] = await db
        .select({ photoUrl: dishes.photoUrl })
        .from(dishes)
        .where(and(eq(dishes.id, dishId), eq(dishes.jarId, jarId)));
      return row?.photoUrl ?? null;
    },
  };
}

/* ---------- Local file store (dev without a database; data lives in .data/jars.json) ---------- */

/** what the local file keeps: the dish plus its photo data */
type StoredDish = { id: string; name: string; recipeUrl: string | null; photoUrl: string | null };
type FileData = Record<string, StoredDish[]>;
const show = (d: StoredDish) => toDish(d, d.photoUrl ? photoVersion(d.photoUrl) : null);
const FILE = path.join(process.cwd(), ".data", "jars.json");
const globalForFile = globalThis as typeof globalThis & { __dinnerJarFile?: FileData };

async function readFile(): Promise<FileData> {
  if (globalForFile.__dinnerJarFile) return globalForFile.__dinnerJarFile;
  try {
    globalForFile.__dinnerJarFile = JSON.parse(await fs.readFile(FILE, "utf8")) as FileData;
  } catch {
    globalForFile.__dinnerJarFile = {};
  }
  return globalForFile.__dinnerJarFile;
}

async function writeFile(data: FileData) {
  globalForFile.__dinnerJarFile = data;
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data));
}

function fileStore(): DishStore {
  return {
    async sharedJarId() {
      const data = await readFile();
      const [first] = Object.keys(data);
      if (first) return first;
      const newId = randomUUID();
      data[newId] = [];
      await writeFile(data);
      return newId;
    },
    async list(jarId) {
      return ((await readFile())[jarId] ?? []).map(show);
    },
    async count(jarId) {
      return ((await readFile())[jarId] ?? []).length;
    },
    async add(jarId, input) {
      const data = await readFile();
      const dish: StoredDish = { id: randomUUID(), ...input };
      data[jarId] = [...(data[jarId] ?? []), dish];
      await writeFile(data);
      return show(dish);
    },
    async remove(jarId, dishId) {
      const data = await readFile();
      const before = data[jarId] ?? [];
      data[jarId] = before.filter((dish) => dish.id !== dishId);
      await writeFile(data);
      return data[jarId].length !== before.length;
    },
    async update(jarId, dishId, input) {
      const data = await readFile();
      const list = data[jarId] ?? [];
      const index = list.findIndex((dish) => dish.id === dishId);
      if (index < 0) return null;
      const old = list[index];
      const dish: StoredDish = { ...old, name: input.name, recipeUrl: input.recipeUrl, photoUrl: input.photoUrl === undefined ? old.photoUrl : input.photoUrl };
      data[jarId] = list.map((item, i) => (i === index ? dish : item));
      await writeFile(data);
      return show(dish);
    },
    async pick(jarId, exceptId) {
      const all = (await readFile())[jarId] ?? [];
      const pool = all.length > 1 && exceptId ? all.filter((dish) => dish.id !== exceptId) : all;
      const dish = pool[Math.floor(Math.random() * pool.length)];
      return dish ? show(dish) : null;
    },
    async photo(jarId, dishId) {
      return ((await readFile())[jarId] ?? []).find((dish) => dish.id === dishId)?.photoUrl ?? null;
    },
  };
}

let storePromise: Promise<DishStore> | null = null;

export function getStore(): Promise<DishStore> {
  storePromise ??= process.env.DATABASE_URL ? postgresStore() : Promise.resolve(fileStore());
  return storePromise;
}
