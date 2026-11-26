import type { ReactNode } from "react";
import { ASSESSMENT_STATE_LABELS } from "@/lib/assessmentRules";
import type { AssessmentState } from "@/lib/assessmentRules";
import type { SteamAssessment } from "@/lib/assessmentEngine";

type Category = SteamAssessment["categories"][number];
const styles: Record<AssessmentState, string> = {
  significant_concern: "bg-[#fae7eb] text-[#822a44]",
  potential_concern: "bg-[#fff0d8] text-[#694304]",
  insufficient_information: "bg-[#eeeaf2] text-[#514960]",
  no_concerns_identified: "bg-[#e7f3eb] text-[#285740]",
};
const icons: Record<AssessmentState, string> = {
  significant_concern: "M12 8v5m0 3h.01M10.3 4.7l-7.6 13A1.5 1.5 0 0 0 4 20h16a1.5 1.5 0 0 0 1.3-2.3l-7.6-13a2 2 0 0 0-3.4 0Z",
  potential_concern: "M12 8v5m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  insufficient_information: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  no_concerns_identified: "m8 12 3 3 5-6m6 3a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
};
const sourceLabels: Record<Category["evidence"][number]["source"], string> = {
  official_classification: "Classification board",
  developer_disclosure: "Developer disclosure",
  manual_review: "Documented game-specific review",
  steam_descriptor: "Steam content descriptor",
  steam_generated_rating: "Steam-generated rating",
  steam_feature: "Steam feature",
  community_tag: "Community tag",
};

export function ReportStatus({ state, label = ASSESSMENT_STATE_LABELS[state] }: { state: AssessmentState; label?: string }) {
  return <span className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles[state]}`}>
    <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[state]} />
    </svg>
    {label}
  </span>;
}

export function ReportSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-6 rounded-2xl border border-[#e8ddee] bg-white p-4 sm:p-6">
    <h2 id={`${id}-heading`} className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
    {children}
  </section>;
}

export function ReportFinding({ finding }: { finding: Category }) {
  const coverage = { direct_evidence: "Direct evidence available", community_tags_only: "Community tags only", no_matching_evidence: "No matching evidence" };
  return <article id={`finding-${finding.category}`} className="min-w-0 scroll-mt-6 rounded-xl border border-[#e8ddee] px-3 py-4 sm:px-4">
    <h3 className="mb-2 text-lg font-bold leading-tight">{finding.label}</h3>
    <ReportStatus state={finding.state} label={finding.category === "positive" && finding.state === "no_concerns_identified" ? "Positive features identified" : undefined} />
    <p className="mt-2 text-sm leading-relaxed text-[#514960]">{finding.explanation}</p>
    <details className="mt-2 border-t border-[#eee7f2] pt-1 text-sm">
      <summary className="min-h-11 cursor-pointer py-3 font-bold text-[#563569]">Evidence and coverage</summary>
      <p className="mb-2 text-[#514960]">{coverage[finding.dataCoverage]}</p>
      {finding.evidence.length > 0 && <ul className="list-disc space-y-2 pl-5">
        {finding.evidence.map((item, index) => <li key={index} className="break-words">
          <span className="font-bold">{sourceLabels[item.source]}{item.authority && ` (${item.authority.toUpperCase()})`}</span>
          <span> · {item.label}{item.weight != null && ` (tag weight ${item.weight})`}</span>
          {item.sourceUrl && <a className="ml-1 font-bold text-[#563569] underline" href={item.sourceUrl}>{item.sourceName}</a>}
        </li>)}
      </ul>}
    </details>
  </article>;
}
