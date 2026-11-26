import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Steam game catalogue | PlaySafe.games",
  description: "Browse Steam games using PlaySafe’s catalogue filters and check individual game reports.",
  alternates: { canonical: "/catalogue" },
};

export default function CatalogueLayout({ children }: { children: ReactNode }) {
  return children;
}
