import type { SteamAssessment } from "@/lib/assessmentEngine";
import { ASSESSMENT_STATE_LABELS } from "@/lib/assessmentRules";

const sources: Record<SteamAssessment["categories"][number]["evidence"][number]["source"], string> = {
  official_classification: "Classification board",
  developer_disclosure: "Developer disclosure",
  manual_review: "Documented game-specific review",
  steam_descriptor: "Steam content descriptor",
  steam_generated_rating: "Steam-generated rating",
  steam_feature: "Steam feature",
  community_tag: "Community tag",
};
const coverage = {
  direct_evidence: "Direct evidence available",
  community_tags_only: "Community tags only",
  no_matching_evidence: "No matching evidence",
};

export default function AssessmentPanel({ assessment, showJson = false }: { assessment: SteamAssessment; showJson?: boolean }) {
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
        {assessment.categories.map((category) => (
          <details key={category.category} className="p-3">
            <summary className="cursor-pointer">
              <span className="font-semibold">{category.label}</span> · {ASSESSMENT_STATE_LABELS[category.state]}
            </summary>
            <p className="mt-2">{category.explanation}</p>
            <p className="mt-1 text-sm text-gray-700">{coverage[category.dataCoverage]}</p>
            {category.evidence.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {category.evidence.map((item, index) => (
                <li key={index}>
                  {[sources[item.source], item.authority?.toUpperCase(), item.label].filter(Boolean).join(" · ")}
                  {item.weight != null && ` (tag weight ${item.weight})`}
                  {item.sourceUrl && <> <a className="underline" href={item.sourceUrl}>{item.sourceName}</a></>}
                </li>
              ))}
            </ul>}
          </details>
        ))}
      </div>
      {showJson && <details className="rounded border bg-white p-3">
        <summary className="cursor-pointer">Assessment JSON and data coverage</summary>
        <pre className="mt-2 max-h-96 overflow-auto bg-gray-100 p-3 text-sm">{JSON.stringify(assessment, null, 2)}</pre>
      </details>}
    </section>
  );
}
