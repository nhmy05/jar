import { createHash, randomBytes, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Dish } from "@/lib/dishes";

type NewDish = { name: string; recipeUrl: string | null; photoUrl: string | null };
/** photoUrl undefined = keep the photo the dish already has */
type DishChanges = { name: string; recipeUrl: string | null; photoUrl: string | null | undefined };

export type LinkRole = "view" | "edit";

export type GoogleProfile = { googleId: string; email: string; name: string | null; picture: string | null };

export interface DishStore {
  /** The one shared jar: the oldest jar, created the first time it is needed. */
  sharedJarId(): Promise<string>;
  list(jarId: string): Promise<Dish[]>;
  count(jarId: string): Promise<number>;
  add(jarId: string, dish: NewDish): Promise<Dish>;
  remove(jarId: string, dishId: string): Promise<boolean>;
  update(jarId: string, dishId: string, dish: DishChanges): Promise<Dish | null>;
  pick(jarId: string, exceptId: string | null): Promise<Dish | null>;
  /** Save or refresh a person who signed in with Google. */
  upsertUser(profile: GoogleProfile): Promise<{ id: string }>;
  /** Make `userId` the owner of the shared jar, but only if nobody owns it yet. True when it became theirs. */
  claimSharedJar(userId: string): Promise<boolean>;
  /** True when `userId` owns this jar. */
  ownsJar(jarId: string, userId: string): Promise<boolean>;
  /** The jar and role a share link key opens, or null if the key is unknown or reset. */
  jarForKey(key: string): Promise<{ jarId: string; role: LinkRole } | null>;
  /** The jar's two share links, created the first time they're asked for. */
  ensureLinks(jarId: string): Promise<{ view: string; edit: string }>;
  /** Replace one share link with a new key. The old key stops working. */
  resetLink(jarId: string, role: LinkRole): Promise<string>;
  /** Remember that a signed-in person opened this jar through a link (keeps the higher role). */
  addMember(jarId: string, userId: string, role: LinkRole): Promise<void>;
  /** The photo itself (a data: URL), or null if the dish has none. Only the photo route asks for this. */
  photo(dishId: string): Promise<string | null>;
}

/** Small fingerprint of a photo. The photo address changes when the photo does, so browsers never show an old one. */
export const photoVersion = (data: string) => createHash("md5").update(data).digest("hex").slice(0, 8);

/** A long random key for a share link. */
const newKey = () => randomBytes(24).toString("base64url");

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
  const { jars, dishes, users, jarLinks, jarMembers } = await import("@/db/schema");
  const { and, asc, count, eq, isNull, ne, sql } = await import("drizzle-orm");

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
    async upsertUser(profile) {
      const values = { googleId: profile.googleId, email: profile.email, name: profile.name, picture: profile.picture };
      const [row] = await db
        .insert(users)
        .values(values)
        .onConflictDoUpdate({ target: users.googleId, set: { email: values.email, name: values.name, picture: values.picture } })
        .returning({ id: users.id });
      return row;
    },
    async claimSharedJar(userId) {
      const [oldest] = await db.select({ id: jars.id, ownerId: jars.ownerId }).from(jars).orderBy(asc(jars.createdAt)).limit(1);
      if (!oldest || oldest.ownerId) return false;
      /* the extra isNull check means two sign-ins at once can't both win */
      const rows = await db.update(jars).set({ ownerId: userId }).where(and(eq(jars.id, oldest.id), isNull(jars.ownerId))).returning({ id: jars.id });
      return rows.length > 0;
    },
    async ownsJar(jarId, userId) {
      const [row] = await db.select({ ownerId: jars.ownerId }).from(jars).where(eq(jars.id, jarId));
      return row?.ownerId === userId;
    },
    async jarForKey(key) {
      const [row] = await db
        .select({ jarId: jarLinks.jarId, role: jarLinks.role })
        .from(jarLinks)
        .where(and(eq(jarLinks.key, key), isNull(jarLinks.revokedAt)));
      return row ?? null;
    },
    async ensureLinks(jarId) {
      const live = await db.select({ role: jarLinks.role, key: jarLinks.key }).from(jarLinks).where(and(eq(jarLinks.jarId, jarId), isNull(jarLinks.revokedAt)));
      const out: Partial<Record<LinkRole, string>> = {};
      for (const row of live) out[row.role] ??= row.key;
      for (const role of ["view", "edit"] as const) {
        if (!out[role]) {
          out[role] = newKey();
          await db.insert(jarLinks).values({ jarId, role, key: out[role] });
        }
      }
      return { view: out.view!, edit: out.edit! };
    },
    async resetLink(jarId, role) {
      await db.update(jarLinks).set({ revokedAt: new Date() }).where(and(eq(jarLinks.jarId, jarId), eq(jarLinks.role, role), isNull(jarLinks.revokedAt)));
      const key = newKey();
      await db.insert(jarLinks).values({ jarId, role, key });
      return key;
    },
    async addMember(jarId, userId, role) {
      await db
        .insert(jarMembers)
        .values({ jarId, userId, role })
        .onConflictDoUpdate({
          target: [jarMembers.jarId, jarMembers.userId],
          /* an edit link keeps edit even if the same person later opens the view link */
          set: { role: sql`case when ${jarMembers.role} = 'edit' then 'edit' else ${role} end` },
        });
    },
    async photo(dishId) {
      const [row] = await db.select({ photoUrl: dishes.photoUrl }).from(dishes).where(eq(dishes.id, dishId));
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

/** Local stand-in for the users and ownership tables, kept beside the dishes in .data/ */
type AccountsFile = {
  users: (GoogleProfile & { id: string })[];
  owners: Record<string, string>;
  links: { jarId: string; role: LinkRole; key: string; revoked?: boolean }[];
  members: { jarId: string; userId: string; role: LinkRole }[];
};
const ACCOUNTS_FILE = path.join(process.cwd(), ".data", "accounts.json");

async function readAccounts(): Promise<AccountsFile> {
  try {
    const data = JSON.parse(await fs.readFile(ACCOUNTS_FILE, "utf8")) as Partial<AccountsFile>;
    return { users: data.users ?? [], owners: data.owners ?? {}, links: data.links ?? [], members: data.members ?? [] };
  } catch {
    return { users: [], owners: {}, links: [], members: [] };
  }
}

async function writeAccounts(data: AccountsFile) {
  await fs.mkdir(path.dirname(ACCOUNTS_FILE), { recursive: true });
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(data));
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
    async upsertUser(profile) {
      const data = await readAccounts();
      const found = data.users.find((user) => user.googleId === profile.googleId);
      if (found) Object.assign(found, profile);
      const user = found ?? { id: randomUUID(), ...profile };
      if (!found) data.users.push(user);
      await writeAccounts(data);
      return { id: user.id };
    },
    async claimSharedJar(userId) {
      const [first] = Object.keys(await readFile());
      if (!first) return false;
      const data = await readAccounts();
      if (data.owners[first]) return false;
      data.owners[first] = userId;
      await writeAccounts(data);
      return true;
    },
    async ownsJar(jarId, userId) {
      return (await readAccounts()).owners[jarId] === userId;
    },
    async jarForKey(key) {
      const link = (await readAccounts()).links.find((item) => item.key === key && !item.revoked);
      return link ? { jarId: link.jarId, role: link.role } : null;
    },
    async ensureLinks(jarId) {
      const data = await readAccounts();
      for (const role of ["view", "edit"] as const) {
        if (!data.links.some((item) => item.jarId === jarId && item.role === role && !item.revoked)) data.links.push({ jarId, role, key: newKey() });
      }
      await writeAccounts(data);
      const find = (role: LinkRole) => data.links.find((item) => item.jarId === jarId && item.role === role && !item.revoked)!.key;
      return { view: find("view"), edit: find("edit") };
    },
    async resetLink(jarId, role) {
      const data = await readAccounts();
      for (const item of data.links) if (item.jarId === jarId && item.role === role) item.revoked = true;
      const key = newKey();
      data.links.push({ jarId, role, key });
      await writeAccounts(data);
      return key;
    },
    async addMember(jarId, userId, role) {
      const data = await readAccounts();
      const found = data.members.find((item) => item.jarId === jarId && item.userId === userId);
      if (!found) data.members.push({ jarId, userId, role });
      else if (found.role !== "edit") found.role = role;
      await writeAccounts(data);
    },
    async photo(dishId) {
      for (const list of Object.values(await readFile())) {
        const dish = list.find((item) => item.id === dishId);
        if (dish) return dish.photoUrl;
      }
      return null;
    },
  };
}

let storePromise: Promise<DishStore> | null = null;

export function getStore(): Promise<DishStore> {
  storePromise ??= process.env.DATABASE_URL ? postgresStore() : Promise.resolve(fileStore());
  return storePromise;
}
