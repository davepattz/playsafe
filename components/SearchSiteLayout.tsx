import Link from "next/link";
import type { ReactNode } from "react";
import SiteInformationLinks from "./SiteInformationLinks";

export default function SearchSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fcfaff] text-[#241631] [font-family:var(--font-lato),sans-serif]">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:bg-white focus:p-3"
        href="#main-content">Skip to content</a>
      <header className="border-b border-[#eae1f0]">
        <div className="mx-auto flex min-h-16 max-w-[1222px] flex-wrap items-center justify-between gap-x-6 px-5 py-2 sm:px-8">
          <Link href="/" className="py-2 text-sm font-bold tracking-tight sm:text-base">PlaySafe.games</Link>
          <nav aria-label="Main" className="flex items-center gap-4 text-sm text-[#514960] sm:gap-6">
            <Link href="/catalogue" prefetch={false} className="py-2 hover:underline">Catalogue</Link>
            <Link href="/news" className="py-2 hover:underline">News</Link>
            <Link href="/faq" className="py-2 hover:underline">FAQ</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-[#eae1f0] bg-[#fcfaff] px-5 py-5 text-center text-sm !text-[#514960]">
        <SiteInformationLinks />
        © {new Date().getFullYear()} PlaySafe.games
      </footer>
    </div>
  );
}
