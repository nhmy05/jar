-- Database changes for login and share links. Only adds things. All-or-nothing.
BEGIN;

CREATE TABLE "dinner_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "google_id" text NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "picture" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "dinner_users_google_id_unique" UNIQUE("google_id")
);

ALTER TABLE "dinner_jars" ADD COLUMN "owner_id" uuid;
ALTER TABLE "dinner_jars" ADD COLUMN "name" text;
ALTER TABLE "dinner_jars" ADD CONSTRAINT "dinner_jars_owner_id_dinner_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."dinner_users"("id") ON DELETE set null;

CREATE TABLE "dinner_jar_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "jar_id" uuid NOT NULL,
  "role" text NOT NULL,
  "key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  CONSTRAINT "dinner_jar_links_key_unique" UNIQUE("key"),
  CONSTRAINT "dinner_jar_links_jar_id_dinner_jars_id_fk"
    FOREIGN KEY ("jar_id") REFERENCES "public"."dinner_jars"("id") ON DELETE cascade
);
CREATE INDEX "dinner_jar_links_jar_idx" ON "dinner_jar_links" USING btree ("jar_id");

CREATE TABLE "dinner_jar_members" (
  "jar_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "dinner_jar_members_jar_id_user_id_pk" PRIMARY KEY("jar_id","user_id"),
  CONSTRAINT "dinner_jar_members_jar_id_dinner_jars_id_fk"
    FOREIGN KEY ("jar_id") REFERENCES "public"."dinner_jars"("id") ON DELETE cascade,
  CONSTRAINT "dinner_jar_members_user_id_dinner_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."dinner_users"("id") ON DELETE cascade
);

COMMIT;
