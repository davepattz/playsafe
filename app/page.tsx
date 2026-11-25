import type { Metadata } from "next";
import Image from "next/image";
import GameSearch from "@/components/GameSearch";
import SearchSiteLayout from "@/components/SearchSiteLayout";
import { popularSearches } from "@/lib/popularSearches";

export const metadata: Metadata = {
  title: "PlaySafe.games | Know before they play",
  description: "Find out what's inside a game before your child plays it.",
};

export default function Home() {
  return (
    <SearchSiteLayout>
      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-24 pt-16 sm:px-8 sm:pt-[clamp(6rem,16vh,12rem)]">
        <div className="mb-9 text-center">
          <Image src="/logo.svg" alt="PlaySafe.games" width={468} height={76} preload
            className="mx-auto mb-7 h-auto w-56 sm:mb-9 sm:w-72" />
          <h1 className="text-[clamp(2.5rem,7vw,4.75rem)] font-bold leading-[1.05] tracking-[-0.055em]">
            Know before they play.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#514960] sm:text-xl">
            Find out what&apos;s inside a game before your child plays it.
          </p>
        </div>
        <GameSearch popularSearches={popularSearches} />
      </main>
    </SearchSiteLayout>
  );
}
