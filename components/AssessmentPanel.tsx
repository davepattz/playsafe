import type { SteamAssessment } from "@/lib/assessmentEngine";
import type { SteamGameMetadata } from "@/lib/steamMetadata";
import { reportCoverage, reportFinding } from "@/lib/reportPresentation";
import type { AssessmentSources } from "@/lib/reportPresentation";
import { ReportExplanation, ReportStatus } from "./report/ReportSections";

const sources: Record<SteamAssessment["categories"][number]["evidence"][number]["source"], string> = {
  official_classification: "Classification board",
  developer_disclosure: "Developer disclosure",
  manual_review: "Documented game-specific review",
  steam_descriptor: "Steam content descriptor",
  steam_generated_rating: "Steam-generated rating",
  steam_feature: "Steam feature",
  community_tag: "Community tag",
};
export default function AssessmentPanel({ assessment, game, sources: availability, showJson = false }: {
  assessment: SteamAssessment; game: SteamGameMetadata; sources: AssessmentSources; showJson?: boolean;
}) {
  const coverage = reportCoverage(game, availability);
  return (
    <section aria-label="Suitability assessment" className="space-y-4 rounded border bg-violet-50 p-4">
      <h3 className="text-xl font-bold">Suitability assessment</h3>
      <p>{assessment.summary}</p>
      <p>{assessment.overallGuidance}</p>
      <p className="text-sm">
        Rules {assessment.rulesVersion} · <time dateTime={assessment.assessmentDate}>{assessment.assessmentDate.slice(0, 10)} UTC</time>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded border bg-white p-3">
          <h4 className="font-semibold">Official classifications reported by Steam</h4>
          {assessment.officialClassifications.length
            ? <ul>{assessment.officialClassifications.map(({ authority, rating }) =>
              <li key={authority}>{authority.toUpperCase()} · {rating.toUpperCase()}</li>)}</ul>
            : <p>Unavailable</p>}
        </section>
        <section className="rounded border bg-white p-3">
          <h4 className="font-semibold">Steam-generated ratings</h4>
          {assessment.steamGeneratedRatings.length
            ? <ul>{assessment.steamGeneratedRatings.map(({ authority, rating }) =>
              <li key={authority}>{authority.replaceAll("_", " ")} · {rating.toUpperCase()}</li>)}</ul>
            : <p>Unavailable</p>}
        </section>
      </div>
      <div className="divide-y rounded border bg-white">
        {assessment.categories.map((category) => {
          const presentation = reportFinding(category, coverage);
          return <div key={category.category} className="p-3">
          <h4 className="font-semibold">{category.label}</h4>
          <ReportStatus state={presentation.state} label={presentation.label} tooltip={presentation.tooltip} />
          <p className="mt-2"><ReportExplanation {...presentation} /></p>
          <details className="mt-2">
            <summary className="cursor-pointer">
              Evidence
            </summary>
            <p className="mt-1 text-sm text-gray-700">{presentation.evidenceCoverage}</p>
            {category.evidence.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {category.evidence.map((item, index) => (
                <li key={index}>
                  {[sources[item.source], item.authority?.toUpperCase()].filter(Boolean).join(" · ")} · <strong>{item.label}</strong>
                  {item.weight != null && ` (tag weight ${item.weight})`}
                  {item.sourceUrl && <> <a className="underline" href={item.sourceUrl}>{item.sourceName}</a></>}
                </li>
              ))}
            </ul>}
          </details>
          </div>;
        })}
      </div>
      {showJson && <details className="rounded border bg-white p-3">
        <summary className="cursor-pointer">Assessment JSON and data coverage</summary>
        <pre className="mt-2 max-h-96 overflow-auto bg-gray-100 p-3 text-sm">{JSON.stringify(assessment, null, 2)}</pre>
      </details>}
    </section>
  );
}
