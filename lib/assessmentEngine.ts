import type { SteamGameMetadata } from "./steamMetadata";
import { ASSESSMENT_CATEGORIES, ASSESSMENT_RULES } from "./assessmentRules.ts";
import type { AssessmentRules, AssessmentState, Category, Finding } from "./assessmentRules.ts";

type Source = "official_classification" | "developer_disclosure" | "steam_descriptor"
  | "steam_generated_rating" | "steam_feature" | "community_tag" | "manual_review";

type Evidence = {
  source: Source;
  label: string;
  state: Finding;
  id?: number;
  weight?: number | null;
  authority?: string;
  sourceName?: string;
  sourceUrl?: string;
};

type CategoryAssessment = {
  category: Category;
  label: string;
  state: AssessmentState;
  explanation: string;
  evidence: Evidence[];
  dataCoverage: "direct_evidence" | "community_tags_only" | "no_matching_evidence";
};

const sourceOrder: Record<Source, number> = {
  official_classification: 0,
  developer_disclosure: 1,
  manual_review: 2,
  steam_descriptor: 3,
  steam_generated_rating: 4,
  steam_feature: 5,
  community_tag: 6,
};
const strength: Record<Finding, number> = {
  no_concerns_identified: 0,
  potential_concern: 1,
  significant_concern: 2,
};
const categoryKeys = Object.keys(ASSESSMENT_CATEGORIES) as Category[];

function ratingCode(rating: string) {
  return rating.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function matchText(text: string, rules: AssessmentRules) {
  const clauses = text.split(/[,.;!?\n\r]+/).map((clause) => clause.trim());
  return clauses.flatMap((label) => {
    // Treat mixed or negated clauses conservatively. An omitted finding remains unknown.
    if (/\b(no|not|without|never|free of|non[- ])\b/i.test(label)) return [];
    return rules.text.flatMap(({ category, pattern, significant }) =>
      pattern.test(label)
        ? [{ category, label, state: significant?.test(label) ? "significant_concern" as const : "potential_concern" as const }]
        : []);
  });
}

function assessCategory(category: Category, matches: Evidence[]): CategoryAssessment {
  const evidence = matches.sort((left, right) => sourceOrder[left.source] - sourceOrder[right.source]);
  let leading: Evidence | undefined;
  for (const item of evidence) {
    if (!leading || strength[item.state] > strength[leading.state]) leading = item;
  }
  const label = ASSESSMENT_CATEGORIES[category];
  const dataCoverage = evidence.some(({ source }) => source !== "community_tag")
    ? "direct_evidence" : evidence.length ? "community_tags_only" : "no_matching_evidence";
  let explanation = "The available Steam data does not establish whether this concern applies.";
  if (leading?.state === "no_concerns_identified") {
    explanation = category === "positive"
      ? `Available evidence highlights ${leading.label}. These features can coexist with content concerns.`
      : `A documented review found no concerns in this category. ${leading.label}`;
  } else if (leading) {
    const intro = {
      official_classification: "Classification board advice lists",
      developer_disclosure: "The developer disclosure mentions",
      manual_review: "A documented review identifies",
      steam_descriptor: "Steam lists the content descriptor",
      steam_generated_rating: "Steam-generated rating advice lists",
      steam_feature: "Steam lists the feature",
      community_tag: "Steam players tagged this game",
    }[leading.source];
    explanation = `${intro} “${leading.label}”.`;
    if (dataCoverage === "community_tags_only") explanation += " Check this against the store listing or gameplay before deciding.";
  }
  return { category, label, state: leading?.state ?? "insufficient_information", explanation, evidence, dataCoverage };
}

export function assessSteamGame(metadata: SteamGameMetadata, assessmentDate: string, rules = ASSESSMENT_RULES) {
  const eligible = metadata.appType === null || metadata.appType === "game";
  const ratings = [...new Map(
    [...(metadata.classifications ?? []), metadata.australianClassification, metadata.steamAustralianRating]
      .flatMap((rating) => rating ? [[rating.authority.toLowerCase(), rating] as const] : []),
  ).values()];
  const officialClassifications = ratings.filter(({ authority }) => rules.officialAuthorities.includes(authority.toLowerCase()));
  const steamGeneratedRatings = ratings.filter(({ authority }) => /^steam_/i.test(authority));
  const otherRatings = ratings.filter((rating) => !officialClassifications.includes(rating) && !steamGeneratedRatings.includes(rating));
  const evidence = new Map<Category, Evidence[]>();
  function add(category: Category, item: Evidence) {
    const items = evidence.get(category) ?? [];
    items.push(item);
    evidence.set(category, items);
  }
  function addText(text: string | null, source: Source, authority?: string) {
    if (!text) return;
    for (const { category, ...match } of matchText(text, rules)) add(category, { ...match, source, authority });
  }

  if (eligible) {
    for (const { authority, descriptors } of officialClassifications) addText(descriptors, "official_classification", authority);
    for (const { authority, descriptors } of steamGeneratedRatings) addText(descriptors, "steam_generated_rating", authority);
    addText(metadata.developerMatureDisclosure ?? metadata.contentDescriptors?.notes ?? null, "developer_disclosure");
    for (const id of new Set(metadata.contentDescriptors?.ids)) {
      const signal = rules.descriptors[id];
      if (signal) add(signal.category, { ...signal, source: "steam_descriptor", id });
    }
    const ids = new Set<number>(metadata.categories?.map(({ id }) => id));
    for (const { id } of metadata.multiplayer ?? []) {
      if (id !== null) ids.add(id);
    }
    if (metadata.workshop && !ids.has(51)) ids.add(30);
    if (metadata.inAppPurchases) ids.add(35);
    for (const id of ids) {
      const signal = rules.features[id];
      if (signal) add(signal.category, { ...signal, source: "steam_feature", id });
    }
    for (const { id, weight } of metadata.tags ?? []) {
      const signal = rules.tags[id];
      if (signal) {
        add(signal.category, {
          label: signal.label,
          state: signal.state === "significant_concern" ? "potential_concern" : signal.state,
          source: "community_tag",
          id,
          weight,
        });
      }
    }
    for (const override of rules.overrides) {
      if (override.appId === metadata.appId) {
        add(override.category, {
          source: "manual_review", label: override.reason, state: override.state,
          sourceName: override.sourceName, sourceUrl: override.sourceUrl,
        });
      }
    }
  }

  const categories = categoryKeys.map((category) => assessCategory(category, evidence.get(category) ?? []));
  const concerns = categories.filter(({ state }) => state === "significant_concern" || state === "potential_concern");
  const significant = concerns.filter(({ state }) => state === "significant_concern");
  const listed = (significant.length ? significant : concerns).slice(0, 3).map(({ label }) => label.toLowerCase()).join(", ");
  const unknownCount = categories.filter(({ state }) => state === "insufficient_information").length;
  const summary = !eligible ? "This Steam listing is outside the game assessment scope."
    : significant.length ? `Available evidence shows significant concerns about ${listed}.`
    : concerns.length ? `Check these potential concerns before play: ${listed}.`
    : "The available evidence is too limited to establish suitability.";
  const australianOfficial = officialClassifications.find(({ authority }) => /^(acb|oflc)$/i.test(authority));
  const australianSteam = steamGeneratedRatings.find(({ authority }) => /^steam_australia$/i.test(authority));
  const restricted = australianOfficial && rules.restrictedAustralianRatings.includes(ratingCode(australianOfficial.rating));
  const overallGuidance = !eligible ? "Select the base game to review its available evidence."
    : restricted ? `Steam lists an Australian board classification of ${australianOfficial.rating.toUpperCase()}. Check the official classification and consumer advice for this edition before making a decision.`
    : significant.length ? "Review the significant findings and their sources before deciding whether to allow play."
    : concerns.length ? "Review the flagged features and content, and check the game or its store listing where evidence is limited."
    : "Check the game, its store listing, and any available official classification before deciding.";

  return {
    appId: metadata.appId,
    assessmentDate,
    rulesVersion: rules.version,
    categories,
    dataCoverage: {
      appType: metadata.appType,
      weightedTags: metadata.tags?.length ?? 0,
      listedFeatures: metadata.categories?.length ?? 0,
      developerDisclosure: Boolean(metadata.developerMatureDisclosure ?? metadata.contentDescriptors?.notes),
      steamDescriptorIds: metadata.contentDescriptors?.ids ?? null,
      unknownCategories: unknownCount,
    },
    officialClassifications,
    steamGeneratedRatings,
    otherRatings,
    australianOfficialClassification: australianOfficial ?? null,
    steamAustralianRating: australianSteam ?? null,
    summary: eligible && unknownCount ? `${summary} Some areas still have insufficient information.` : summary,
    overallGuidance,
  };
}

export type SteamAssessment = ReturnType<typeof assessSteamGame>;
