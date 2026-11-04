import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const jars = pgTable("dinner_jars", {
  id: uuid("id").defaultRandom().primaryKey(),
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
