import type { SteamAssessment } from "./assessmentEngine";
import type { SteamGameMetadata } from "./steamMetadata";
import type { MetadataSnapshot } from "./metadataCache";
import { ASSESSMENT_STATE_LABELS } from "./assessmentRules.ts";
import type { AssessmentState, Category } from "./assessmentRules";

type UnresolvedState = "insufficient_information" | "not_mentioned" | "information_unavailable";
export type ReportState = AssessmentState | UnresolvedState;
export type AssessmentSources = Pick<MetadataSnapshot["sources"], "appdetails" | "getItems">;
type CategoryAssessment = SteamAssessment["categories"][number];
type ReportCoverage = Record<Category, UnresolvedState>;

export const REPORT_STATE_LABELS: Record<ReportState, string> = {
  ...ASSESSMENT_STATE_LABELS,
  not_mentioned: "Not mentioned",
  information_unavailable: "Information unavailable",
};

export function reportCoverage(game: SteamGameMetadata, sources: AssessmentSources): ReportCoverage {
  const tags = Array.isArray(game.tags);
  const features = Array.isArray(game.categories) || Boolean(game.multiplayer?.length || game.workshop || game.inAppPurchases);
  const advice = Boolean(game.developerMatureDisclosure || game.contentDescriptors?.notes || game.contentDescriptors?.ids?.length ||
    game.classifications?.some(({ descriptors }) => descriptors) || game.australianClassification?.descriptors ||
    game.steamAustralianRating?.descriptors);
  const coverage = (available: boolean): UnresolvedState => {
    if (!available || (!sources.appdetails && !sources.getItems)) return "information_unavailable";
    return sources.appdetails && sources.getItems ? "not_mentioned" : "insufficient_information";
  };
  const content = coverage(advice || tags);
  const gameplay = coverage(features || tags);
  return {
    violence: content, graphicViolence: content, strongLanguage: content, sexualContent: content,
    substances: content, horror: content, gambling: content, matureThemes: content,
    onlineInteraction: coverage(advice || features || tags), userContent: coverage(advice || features || tags),
    purchases: coverage(advice || features), positive: gameplay,
  };
}

export function reportFinding(finding: CategoryAssessment, coverage: ReportCoverage) {
  const positive = finding.category === "positive";
  const state = finding.state === "insufficient_information"
    ? finding.unresolvedMention ? "insufficient_information" : coverage[finding.category]
    : finding.state;
  const subject = positive ? "feature" : "concern";
  const label = positive && state === "no_concerns_identified" ? "Positive features identified" : REPORT_STATE_LABELS[state];
  const descriptions = {
    not_mentioned: `This ${subject} is not mentioned in the available Steam data.`,
    information_unavailable: `Relevant Steam information about this ${subject} is unavailable.`,
    insufficient_information: `The available evidence does not establish whether this ${subject} applies.`,
  };
  const evidenceCoverage = {
    direct_evidence: "Direct evidence available",
    community_tags_only: "Community tags only",
    no_matching_evidence: state === "information_unavailable" ? "Relevant Steam data unavailable"
      : state === "insufficient_information" ? "Evidence is incomplete or inconclusive" : "Relevant Steam data reviewed",
  }[finding.dataCoverage];
  return {
    state, label, evidenceCoverage,
    explanation: state === "not_mentioned" || state === "information_unavailable" || state === "insufficient_information"
      ? descriptions[state] : finding.explanation,
    tooltip: state === "not_mentioned"
      ? `This ${subject} may not be present in the game, but its absence from Steam's data does not guarantee this.`
      : undefined,
  };
}

export function reportOverviewStatus(categories: SteamAssessment["categories"], coverage: ReportCoverage) {
  const overview = reportOverview(categories);
  if (overview.status !== "insufficient_information") return {
    ...overview, label: overview.status === "significant_concern" ? "Significant concerns identified" : "Potential concerns identified",
  };
  const states = categories.filter(({ category }) => category !== "positive").map((finding) => reportFinding(finding, coverage).state);
  const status: UnresolvedState = states.includes("insufficient_information") ? "insufficient_information"
    : states.every((state) => state === "information_unavailable") ? "information_unavailable" : "not_mentioned";
  return { ...overview, status, label: status === "not_mentioned" ? "No concerns flagged in available data" : REPORT_STATE_LABELS[status] };
}

export function reportOverview(categories: SteamAssessment["categories"]) {
  const significant = categories.filter(({ state }) => state === "significant_concern");
  const potential = categories.filter(({ state }) => state === "potential_concern");
  return {
    status: significant.length ? "significant_concern" : potential.length ? "potential_concern" : "insufficient_information",
    concerns: [...significant, ...potential].slice(0, 4),
  } as const;
}

const positiveTagDescriptions = new Map([
  ["Sandbox", "Players can choose their own goals, experiment or create at their own pace."],
  ["Building", "Players can construct things such as buildings, bases or structures in the game world."],
  ["Crafting", "Players combine materials to make items, tools or equipment."],
  ["Education", "The game includes activities designed to teach or practise a subject or skill."],
  ["Language Learning", "The game includes activities for practising a language."],
  ["Exploration", "Players can discover places, paths or secrets in the game world."],
  ["Puzzle", "Players solve challenges using clues, logic or experimentation."],
  ["Local Co-Op", "Players in the same room can work together toward a shared goal."],
  ["Local Multiplayer", "Players in the same room can play together. The game may support a shared screen, split screen or separate nearby devices."],
  ["Split Screen", "Two or more players use the same display, with a separate view for each player."],
  ["Relaxing", "Players on Steam describe the game as relaxing. How it feels can vary from player to player."],
]);

const positiveListedDescriptions = new Map([
  ["Shared/Split Screen", "Players can use the same display. They may share one view or each have a separate view."],
  ["Shared/Split Screen Co-op", "Players work together on one display, either sharing a view or using separate views."],
  ["Shared/Split Screen PvP", "Players compete against each other on one display, either sharing a view or using separate views."],
]);

export function positiveSteamTags(tags: SteamGameMetadata["tags"]) {
  return [...new Set(tags?.flatMap(({ name }) => name && positiveTagDescriptions.has(name) ? [name] : []))];
}

export function positiveGameplayFeatures(tags: SteamGameMetadata["tags"], findings: SteamAssessment["categories"]) {
  const features = new Map<string, string>();
  for (const tag of positiveSteamTags(tags)) {
    const description = positiveTagDescriptions.get(tag);
    if (description) features.set(tag, description);
  }
  for (const { label, source } of findings.find(({ category }) => category === "positive")?.evidence ?? []) {
    const description = positiveListedDescriptions.get(label);
    if (source === "steam_feature" && description) features.set(label, description);
  }
  return [...features].map(([label, description]) => ({ label, description }));
}

export function australianRatingLabel(value: string) {
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code === "MA15") return "MA 15+";
  if (code === "R18") return "R 18+";
  return value.toUpperCase();
}
