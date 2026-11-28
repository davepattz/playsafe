import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { listRecentReportCards } from "@/lib/steamPersistentCache";

export default async function RecentlyAssessedGames() {
  await connection();
  const games = await listRecentReportCards();
  if (!games.length) return null;

  return <section aria-labelledby="recent-games-heading" className="mt-10">
    <h2 id="recent-games-heading" className="mb-4 text-center text-xl font-bold tracking-tight text-[#4c2b66]">Explore game reports</h2>
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {games.map(({ appId, title, href, artwork }) => <li key={appId} className="min-w-0">
        <Link href={href} prefetch={false}
          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8ddee] bg-white hover:bg-[#f7effc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#563569]">
          <Image src={artwork} alt="" width={231} height={87} referrerPolicy="no-referrer"
            className="aspect-[231/87] w-full bg-[#eee4f4] object-cover" />
          <span className="break-words px-3 py-2.5 text-sm font-bold leading-tight text-[#563569] group-hover:underline">{title}</span>
        </Link>
      </li>)}
    </ul>
  </section>;
}
