import { notFound } from "next/navigation";
import { DinnerJar } from "@/components/dinner-jar";
import { currentUserId, resolveAccess } from "@/lib/access";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/* the key is in the address: keep it out of search results and out of the Referer sent to recipe sites */
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };

/** A jar opened through a share link. Signed-in visitors also get it remembered for My jars. */
export default async function SharedJarPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const access = await resolveAccess(key);
  if (!access) notFound();
  const uid = await currentUserId();
  if (uid && access.role !== "owner") await (await getStore()).addMember(access.jarId, uid, access.role);
  return <DinnerJar jarKey={key} />;
}
