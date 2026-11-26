import Link from "next/link";
import InformationPage from "@/components/InformationPage";
import { ReportSection } from "@/components/report/ReportSections";

export const metadata = {
  title: "Terms of use | PlaySafe.games",
  description: "Terms for using PlaySafe game reports, search and links to third-party services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <InformationPage title="Terms of use">
    <ReportSection id="reports" title="Using PlaySafe reports">
      <p>PlaySafe provides automated, rule-based information from available Steam metadata. Reports do not provide official classifications, comprehensive content reviews or guarantees of suitability. Data, editions, prices and features can change. Check the applicable classification and current Steam listing before making a decision.</p>
    </ReportSection>
    <ReportSection id="third-parties" title="Steam and other services">
      <p>PlaySafe is independent of Valve and Steam. Third-party services set their own terms and handle their own transactions. Game artwork, game names and trademarks remain with their respective owners. Some links in the legacy catalogue may be affiliate links.</p>
    </ReportSection>
    <ReportSection id="access" title="Site access">
      <p>Please respect rate limits and avoid automated requests that disrupt the site or its upstream services. Service availability and report coverage can change. These terms do not limit rights that cannot be excluded under applicable law.</p>
      <p className="mt-3">Send questions and corrections through <Link className="underline" href="/contact">Contact and feedback</Link>.</p>
    </ReportSection>
  </InformationPage>;
}
