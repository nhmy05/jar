import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** People who signed in with Google. Link holders never get a row here. */
export const users = pgTable("dinner_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  picture: text("picture"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jars = pgTable("dinner_jars", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** The signed-in user who owns this jar. Empty for a jar nobody has claimed yet. */
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dishes = pgTable(
  "dinner_dishes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jarId: uuid("jar_id")
      .references(() => jars.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    recipeUrl: text("recipe_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastPickedAt: timestamp("last_picked_at", { withTimezone: true }),
  },
  (table) => [index("dinner_dishes_jar_idx").on(table.jarId)],
);

/** Share links. Each has a secret key; the role says what opening it allows. */
export const jarLinks = pgTable(
  "dinner_jar_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jarId: uuid("jar_id")
      .references(() => jars.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role", { enum: ["view", "edit"] }).notNull(),
    key: text("key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("dinner_jar_links_jar_idx").on(table.jarId)],
);

/** Jars a signed-in person opened through a link, so they can find them again in My jars. */
export const jarMembers = pgTable(
  "dinner_jar_members",
  {
    jarId: uuid("jar_id")
      .references(() => jars.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role", { enum: ["view", "edit"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.jarId, table.userId] })],
);
