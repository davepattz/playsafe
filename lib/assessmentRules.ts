export const ASSESSMENT_CATEGORIES = {
  violence: "Violence",
  graphicViolence: "Graphic violence and gore",
  strongLanguage: "Strong language",
  sexualContent: "Sexual content and nudity",
  substances: "Drugs and alcohol",
  horror: "Horror and frightening content",
  gambling: "Gambling",
  matureThemes: "Mature themes",
  onlineInteraction: "Online interaction",
  userContent: "User-generated content and modifications",
  purchases: "In-game purchases",
  positive: "Positive gameplay and educational features",
} as const;

export type Category = keyof typeof ASSESSMENT_CATEGORIES;
export type Finding = "potential_concern" | "significant_concern" | "no_concerns_identified";
export type AssessmentState = Finding | "insufficient_information";
export const ASSESSMENT_STATE_LABELS: Record<AssessmentState, string> = {
  no_concerns_identified: "No concerns identified in available data",
  potential_concern: "Potential concern",
  significant_concern: "Significant concern",
  insufficient_information: "Insufficient information",
};
type Signal = {
  category: Category;
  label: string;
  state: Finding;
};
type TextRule = { category: Category; pattern: RegExp; significant?: RegExp };
export type ManualOverride = {
  appId: number;
  category: Category;
  state: Finding;
  reason: string;
  sourceName: string;
  sourceUrl: string;
};

export type AssessmentRules = {
  version: string;
  tags: Readonly<Partial<Record<number, Signal>>>;
  descriptors: Readonly<Partial<Record<number, Signal>>>;
  features: Readonly<Partial<Record<number, Signal>>>;
  text: readonly TextRule[];
  officialAuthorities: readonly string[];
  restrictedAustralianRatings: readonly string[];
  overrides: readonly ManualOverride[];
};

export const ASSESSMENT_RULES: AssessmentRules = {
  version: "1.0.0",
  tags: {
    4667: { category: "violence", label: "Violent", state: "potential_concern" },
    4345: { category: "graphicViolence", label: "Gore", state: "potential_concern" },
    6650: { category: "sexualContent", label: "Nudity", state: "potential_concern" },
    12095: { category: "sexualContent", label: "Sexual Content", state: "potential_concern" },
    40500: { category: "sexualContent", label: "Sexual Themes", state: "potential_concern" },
    1667: { category: "horror", label: "Horror", state: "potential_concern" },
    1721: { category: "horror", label: "Psychological Horror", state: "potential_concern" },
    3978: { category: "horror", label: "Survival Horror", state: "potential_concern" },
    16250: { category: "gambling", label: "Gambling", state: "potential_concern" },
    3843: { category: "onlineInteraction", label: "Online Co-Op", state: "potential_concern" },
    1669: { category: "userContent", label: "Moddable", state: "potential_concern" },
    1036: { category: "positive", label: "Education", state: "no_concerns_identified" },
    21635: { category: "positive", label: "Language Learning", state: "no_concerns_identified" },
    1654: { category: "positive", label: "Relaxing", state: "no_concerns_identified" },
    1664: { category: "positive", label: "Puzzle", state: "no_concerns_identified" },
    3841: { category: "positive", label: "Local Co-Op", state: "no_concerns_identified" },
  },
  descriptors: {
    1: { category: "sexualContent", label: "Some nudity or sexual content", state: "potential_concern" },
    2: { category: "graphicViolence", label: "Frequent violence or gore", state: "potential_concern" },
    3: { category: "sexualContent", label: "Adult-only sexual content", state: "significant_concern" },
    4: { category: "sexualContent", label: "Frequent nudity or sexual content", state: "significant_concern" },
    5: { category: "matureThemes", label: "General mature content", state: "potential_concern" },
  },
  features: {
    24: { category: "positive", label: "Shared/Split Screen", state: "no_concerns_identified" },
    27: { category: "onlineInteraction", label: "Cross-Platform Multiplayer", state: "potential_concern" },
    30: { category: "userContent", label: "Steam Workshop", state: "potential_concern" },
    35: { category: "purchases", label: "In-App Purchases", state: "potential_concern" },
    36: { category: "onlineInteraction", label: "Online PvP", state: "potential_concern" },
    37: { category: "positive", label: "Shared/Split Screen PvP", state: "no_concerns_identified" },
    38: { category: "onlineInteraction", label: "Online Co-op", state: "potential_concern" },
    39: { category: "positive", label: "Shared/Split Screen Co-op", state: "no_concerns_identified" },
    51: { category: "userContent", label: "Steam Workshop", state: "potential_concern" },
  },
  text: [
    { category: "violence", pattern: /\b(?<!sexual )violence\b|\bviolent combat\b/i, significant: /\b(strong|intense|extreme|graphic|high impact) violence\b/i },
    { category: "graphicViolence", pattern: /\b(gore|gory|dismemberment|graphic violence|graphic blood)\b/i, significant: /\b(gore|gory|dismemberment|graphic violence|graphic blood)\b/i },
    { category: "strongLanguage", pattern: /\b(strong|very strong|explicit|offensive|bad|coarse|frequent) language\b|\b(profanity|swearing)\b/i, significant: /\b(strong|explicit|frequent) (coarse )?language\b/i },
    { category: "sexualContent", pattern: /\b(nudity|sex|sexual content|sexual material|sexual themes?|sexual violence)\b/i, significant: /\b(sexual violence|explicit sex(ual content)?|strong sexual content|high impact sexual themes?|graphic nudity)\b/i },
    { category: "substances", pattern: /\b(alcohol|tobacco|drugs?|drug use|substance abuse)\b/i, significant: /\b(strong|graphic|high impact) (drug use|substance abuse)\b/i },
    { category: "horror", pattern: /\b(horror|jump scares?|frightening (content|scenes|images))\b/i, significant: /\b(intense|strong|high impact) (horror|frightening (content|scenes|images))\b/i },
    { category: "gambling", pattern: /\b(gambling|wagering|betting with real money)\b/i, significant: /\b(real[- ]money gambling|gambling with real money|real[- ]money wagering)\b/i },
    { category: "matureThemes", pattern: /\b(mature themes?|adult themes?|strong themes?|high impact themes?|suicide|self[- ]harm)\b/i, significant: /\b(strong themes?|high impact themes?|graphic self[- ]harm)\b/i },
    { category: "onlineInteraction", pattern: /\b(users interact|online interactivity|online interaction|online multiplayer|voice chat|online chat)\b/i },
    { category: "userContent", pattern: /\b(user[- ]generated content|steam workshop)\b/i },
    { category: "purchases", pattern: /\b(in[- ](?:game|app) purchases?|microtransactions?|paid random items|loot boxes? available for purchase)\b/i },
  ],
  officialAuthorities: ["acb", "oflc", "nzoflc", "esrb", "pegi", "usk", "dejus", "kgrb", "cero", "fpb", "mda", "csrr"],
  restrictedAustralianRatings: ["MA15", "R18", "RC"],
  overrides: [
    {
      appId: 1091500,
      category: "matureThemes",
      state: "significant_concern",
      reason: "The Australian Classification record for the original release lists high impact themes in its consumer advice.",
      sourceName: "Australian Classification · Cyberpunk 2077 (original release)",
      sourceUrl: "https://www.classification.gov.au/titles/cyberpunk-2077",
    },
  ],
};
