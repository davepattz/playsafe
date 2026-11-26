import Link from "next/link";
import InformationPage from "@/components/InformationPage";
import { ReportSection } from "@/components/report/ReportSections";

export const metadata = {
  title: "About PlaySafe | PlaySafe.games",
  description: "Learn about PlaySafe.games, an independent Steam game assessment service for parents and carers.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <InformationPage title="About PlaySafe">
    <p>PlaySafe.games helps parents and carers check what is known about a Steam game before deciding whether it suits their child.</p>
    <ReportSection id="independence" title="Independent of Steam">
      <p>PlaySafe is an independent project. Valve operates Steam. Valve and Steam do not operate, endorse or approve PlaySafe.</p>
    </ReportSection>
    <ReportSection id="assessments" title="What goes into a report">
      <p>PlaySafe automatically applies published, versioned rules to available Steam metadata. Reports bring together classification information, developer disclosures, listed features and community tags. They highlight what is missing so families can follow up.</p>
      <p className="mt-3">PlaySafe assessments are informational. They do not provide official classifications, comprehensive content reviews or guarantees of suitability.</p>
    </ReportSection>
    <p><Link className="underline" href="/methodology">Read the methodology</Link> or <Link className="underline" href="/contact">send feedback</Link>.</p>
  </InformationPage>;
}
