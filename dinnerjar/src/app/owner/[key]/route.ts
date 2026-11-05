import { NextResponse } from "next/server";
import { OWNER_COOKIE, isOwnerKey } from "@/lib/owner";

export const dynamic = "force-dynamic";

/** The private owner link: /owner/<OWNER_KEY>. Remembers you as the owner on this device, then goes home. */
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isOwnerKey(key)) return new NextResponse("Not found", { status: 404 });
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(OWNER_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
