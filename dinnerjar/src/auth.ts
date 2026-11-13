import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
});
