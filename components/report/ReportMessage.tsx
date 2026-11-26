import Link from "next/link";
import type { ReactNode } from "react";
import SearchSiteLayout from "@/components/SearchSiteLayout";

export default function ReportMessage({ title, children, retry = false }: {
  title: string; children: ReactNode; retry?: boolean;
}) {
  return <SearchSiteLayout>
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
      <div className="rounded-2xl border border-[#e8ddee] bg-white p-5 sm:p-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 leading-relaxed text-[#514960]">{children}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-[#563569]">
          <Link href="/" className="inline-flex min-h-11 items-center underline">Search for another game</Link>
          {retry && <form method="get"><button type="submit" className="min-h-11 underline">Try again</button></form>}
        </div>
      </div>
    </main>
  </SearchSiteLayout>;
}
