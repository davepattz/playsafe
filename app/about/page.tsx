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
    <p className="text-lg text-[#514960]">PlaySafe.games is an independent project that helps parents and carers understand what a Steam game contains, how it can be played and what to check before deciding if it suits their child.</p>
    <ReportSection id="reports" title="What you can find in a report">
      <ul className="list-disc space-y-2 pl-5">
        <li>Available age classifications by country or region and the content advice behind them.</li>
        <li>Game modes and positive gameplay features, including local co-op, puzzles and creative play where listed.</li>
        <li>Potential concerns about content, online interaction and in-game spending, with the evidence behind each finding.</li>
      </ul>
    </ReportSection>
    <ReportSection id="assessments" title="How we assess games">
      <p>Our reports apply published rules to the available Steam information, including classification advice, developer disclosures, store features and community tags. Each report shows the evidence behind its findings and indicates where the information is limited.</p>
      <p className="mt-3">Use the report alongside the official classification and what you know about your child. The information available can vary by game, edition or region.</p>
      <Link className="mt-3 inline-flex min-h-11 items-center font-bold text-[#563569] underline underline-offset-4" href="/methodology">Read the assessment methodology</Link>
    </ReportSection>
    <ReportSection id="independence" title="Independence and feedback">
      <p>PlaySafe operates independently of Valve, the company behind Steam. Official classifications come from the authorities named in each report.</p>
      <p className="mt-3">If a report looks out of date or you have an idea for improving PlaySafe, <Link className="font-bold text-[#563569] underline underline-offset-4" href="/contact">send us feedback</Link>.</p>
    </ReportSection>
    <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-[#4c2b66] px-4 font-bold text-white hover:bg-[#3a204e]">Find a game</Link>
  </InformationPage>;
}
