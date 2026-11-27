import type { ReactNode } from "react";
import Header from "./Header";
import SiteInformationLinks from "./SiteInformationLinks";

export default function SearchSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fcfaff] text-[#241631] [font-family:var(--font-lato),sans-serif]">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:bg-white focus:p-3"
        href="#main-content">Skip to content</a>
      <Header />
      {children}
      <footer className="border-t border-[#eae1f0] bg-[#fcfaff] px-5 py-5 text-center text-sm !text-[#514960]">
        <SiteInformationLinks />
        © {new Date().getFullYear()} PlaySafe.games
      </footer>
    </div>
  );
}
