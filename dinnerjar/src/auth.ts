import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getStore } from "@/lib/store";

declare module "next-auth" {
  interface Session { uid?: string }
}
declare module "@auth/core/jwt" {
  interface JWT { uid?: string }
}

/** Sign-in is only switched on when the Google keys are set, so the site keeps working without them. */
export const signInEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET);

/**
 * Google sign-in. Sessions live in a signed cookie, so nothing is stored in the database yet
 * (the users table comes with step B). AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET are read automatically.
 */
export const { handlers, auth } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    /* runs at sign-in (account is set only then): remember the person, and let the owner claim the existing jar */
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub && profile.email) {
        const store = await getStore();
        const { id } = await store.upsertUser({
          googleId: profile.sub,
          email: profile.email,
          name: profile.name ?? null,
          picture: typeof profile.picture === "string" ? profile.picture : null,
        });
        token.uid = id;
        /* only the email in OWNER_EMAIL can claim the jar, so a stranger can't take it by signing in first */
        const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
        if (ownerEmail && profile.email_verified !== false && profile.email.toLowerCase() === ownerEmail) await store.claimSharedJar(id);
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.uid = token.uid;
      return session;
    },
  },
});
