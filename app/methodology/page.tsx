import type { Metadata } from "next";
import Link from "next/link";
import SearchSiteLayout from "@/components/SearchSiteLayout";
import { ReportSection } from "@/components/report/ReportSections";

export const metadata: Metadata = {
  title: "Assessment methodology | PlaySafe.games",
  description: "How PlaySafe.games uses Steam listings, classifications and disclosed content to prepare game suitability reports.",
  alternates: { canonical: "/methodology" },
};

export default function Methodology() {
  return <SearchSiteLayout>
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-10 sm:px-8">
      <Link href="/" className="font-bold text-[#563569] underline">Back to game search</Link>
      <h1 className="text-4xl font-bold tracking-tight">Assessment methodology</h1>
      <p className="leading-relaxed text-[#514960]">PlaySafe is an independent, automated, rule-based assessment service. Valve operates Steam. PlaySafe helps parents interpret available Steam data before deciding what is right for their child.</p>
      <ReportSection id="sources" title="What we use">
        <p className="leading-relaxed">The report uses Steam data requested in the Australian English store context, including classifications, developer disclosures, listed features, content descriptors and community tags.</p>
        <p className="mt-3 leading-relaxed">Age classifications shows the ratings Steam returns across countries and regions. It lists official classifications first and Steam-generated ratings second, alphabetically by region within each group. Ratings whose origin is unclear are labelled as unverified. Each rating retains its source value and available descriptors, with English translations where verified. PlaySafe does not combine regional ratings into a recommended age.</p>
      </ReportSection>
      <ReportSection id="rules" title="How findings are generated">
        <p className="leading-relaxed">Versioned rules identify potential or significant concerns using the available evidence. Classification advice and developer disclosures carry more weight than community tags. Tags alone cannot establish a significant concern. A documented game-specific review is shown with its reason and source.</p>
      </ReportSection>
      <ReportSection id="limits" title="What the report can tell you">
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li><strong>Not mentioned</strong> means PlaySafe reviewed relevant Steam data and found no mention of the concern or feature. It may still be present in the game.</li>
          <li><strong>Information unavailable</strong> means the relevant Steam data was missing or could not be retrieved.</li>
          <li><strong>Insufficient information</strong> means the available evidence was incomplete or unclear.</li>
        </ul>
        <p className="mt-3 leading-relaxed">Positive gameplay features can coexist with serious concerns. Reports are informational and cannot establish suitability for a child, current moderation, the contents of modifications, or coverage across editions and regions.</p>
        <p className="mt-3 leading-relaxed">Use the report alongside the official classification and what you know about your child and how they would play.</p>
        <p className="mt-3 leading-relaxed">PlaySafe reports do not provide official classifications, comprehensive content reviews or guarantees of suitability.</p>
      </ReportSection>
    </main>
  </SearchSiteLayout>;
}
