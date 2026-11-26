import type { ReactNode } from "react";
import SearchSiteLayout from "./SearchSiteLayout";

export default function InformationPage({ title, children }: { title: string; children: ReactNode }) {
  return <SearchSiteLayout>
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-5 py-10 leading-relaxed sm:px-8">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {children}
    </main>
  </SearchSiteLayout>;
}
