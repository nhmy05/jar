import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { STARTER_DISHES, type Dish } from "@/lib/dishes";

type NewDish = { name: string; recipeUrl: string | null; photoUrl: string | null };

export interface DishStore {
  /** Returns the jar id, creating (and seeding) a fresh jar when `id` is missing or unknown. */
  ensureJar(id: string | null): Promise<{ id: string; created: boolean }>;
  list(jarId: string): Promise<Dish[]>;
  count(jarId: string): Promise<number>;
  add(jarId: string, dish: NewDish): Promise<Dish>;
  remove(jarId: string, dishId: string): Promise<boolean>;
  pick(jarId: string, exceptId: string | null): Promise<Dish | null>;
}

const toDish = (row: { id: string; name: string; photoUrl: string | null; recipeUrl: string | null }): Dish => ({
  id: row.id,
  name: row.name,
  photoUrl: row.photoUrl,
  recipeUrl: row.recipeUrl,
});

/* ---------- Postgres (used whenever DATABASE_URL is set, e.g. Neon in production) ---------- */

async function postgresStore(): Promise<DishStore> {
  const { db } = await import("@/db");
  const { jars, dishes } = await import("@/db/schema");
  const { and, asc, count, eq, ne, sql } = await import("drizzle-orm");

  return {
    async ensureJar(id) {
      if (id) {
        const [existing] = await db.select({ id: jars.id }).from(jars).where(eq(jars.id, id)).limit(1);
        if (existing) return { id: existing.id, created: false };
      }
      const newId = await db.transaction(async (tx) => {
        const [jar] = await tx.insert(jars).values({}).returning({ id: jars.id });
        await tx.insert(dishes).values(STARTER_DISHES.map((dish) => ({ ...dish, jarId: jar.id })));
        return jar.id;
      });
      return { id: newId, created: true };
    },
    async list(jarId) {
      const rows = await db.select().from(dishes).where(eq(dishes.jarId, jarId)).orderBy(asc(dishes.createdAt));
      return rows.map(toDish);
    },
    async count(jarId) {
      const [row] = await db.select({ value: count() }).from(dishes).where(eq(dishes.jarId, jarId));
      return Number(row?.value ?? 0);
    },
    async add(jarId, input) {
      const [row] = await db.insert(dishes).values({ ...input, jarId }).returning();
      return toDish(row);
    },
    async remove(jarId, dishId) {
      const rows = await db.delete(dishes).where(and(eq(dishes.id, dishId), eq(dishes.jarId, jarId))).returning({ id: dishes.id });
      return rows.length > 0;
    },
    async pick(jarId, exceptId) {
      let [row] = await db
        .select()
        .from(dishes)
        .where(and(eq(dishes.jarId, jarId), exceptId ? ne(dishes.id, exceptId) : undefined))
        .orderBy(sql`random()`)
        .limit(1);
      if (!row && exceptId) [row] = await db.select().from(dishes).where(eq(dishes.jarId, jarId)).limit(1);
      if (!row) return null;
      await db.update(dishes).set({ lastPickedAt: new Date() }).where(eq(dishes.id, row.id));
      return toDish(row);
    },
  };
}

/* ---------- Local file store (dev without a database; data lives in .data/jars.json) ---------- */

type FileData = Record<string, Dish[]>;
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
    async ensureJar(id) {
      const data = await readFile();
      if (id && data[id]) return { id, created: false };
      const newId = randomUUID();
      data[newId] = STARTER_DISHES.map((dish) => ({ ...dish, id: randomUUID(), photoUrl: null, recipeUrl: null }));
      await writeFile(data);
      return { id: newId, created: true };
    },
    async list(jarId) {
      return (await readFile())[jarId] ?? [];
    },
    async count(jarId) {
      return ((await readFile())[jarId] ?? []).length;
    },
    async add(jarId, input) {
      const data = await readFile();
      const dish: Dish = { id: randomUUID(), ...input };
      data[jarId] = [...(data[jarId] ?? []), dish];
      await writeFile(data);
      return dish;
    },
    async remove(jarId, dishId) {
      const data = await readFile();
      const before = data[jarId] ?? [];
      data[jarId] = before.filter((dish) => dish.id !== dishId);
      await writeFile(data);
      return data[jarId].length !== before.length;
    },
    async pick(jarId, exceptId) {
      const all = (await readFile())[jarId] ?? [];
      const pool = all.length > 1 && exceptId ? all.filter((dish) => dish.id !== exceptId) : all;
      return pool[Math.floor(Math.random() * pool.length)] ?? null;
    },
  };
}

let storePromise: Promise<DishStore> | null = null;

export function getStore(): Promise<DishStore> {
  storePromise ??= process.env.DATABASE_URL ? postgresStore() : Promise.resolve(fileStore());
  return storePromise;
}
