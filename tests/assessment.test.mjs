import assert from "node:assert/strict";
import test from "node:test";
import { assessSteamGame } from "../lib/assessmentEngine.ts";
import { ASSESSMENT_RULES } from "../lib/assessmentRules.ts";

const date = "2026-11-25T00:00:00.000Z";
const base = {
  appId: 1, appType: "game", title: "Test game",
  tags: null, categories: null, classifications: null, australianClassification: null,
  steamAustralianRating: null, contentDescriptors: null, developerMatureDisclosure: null,
  multiplayer: null, workshop: null, inAppPurchases: null,
};
const tag = (id, weight = 100) => ({ id, name: null, weight });
const feature = (id, name) => ({ id, name });
const rating = (authority, value, descriptors = null) => ({ authority, rating: value, descriptors });
const assess = (patch, rules) => assessSteamGame({ ...base, ...patch }, date, rules);
const category = (result, name) => result.categories.find((item) => item.category === name);

test("missing and empty fields stay insufficient across all categories", () => {
  const result = assess({ tags: [], categories: [], contentDescriptors: { ids: [], notes: null } });
  assert.equal(result.categories.length, 12);
  assert.ok(result.categories.every(({ state, dataCoverage }) =>
    state === "insufficient_information" && dataCoverage === "no_matching_evidence"));
  assert.equal(result.officialClassifications.length, 0);
  assert.equal(result.australianOfficialClassification, null);
  assert.equal(result.assessmentDate, date);
  assert.equal(result.rulesVersion, ASSESSMENT_RULES.version);
});

test("positive tags and their weights cannot cancel a mature disclosure", () => {
  const inputs = {
    tags: [tag(1036, 10000), tag(4345, 1)],
    developerMatureDisclosure: "Includes intense violence and blood, strong language, and gore.",
  };
  const result = assess(inputs);
  assert.equal(category(result, "positive").state, "no_concerns_identified");
  assert.equal(category(result, "graphicViolence").state, "significant_concern");
  assert.equal(category(result, "strongLanguage").state, "significant_concern");
  assert.equal(category(result, "violence").state, "significant_concern");
  assert.match(result.summary, /significant concerns/);
  assert.deepEqual(result, assess(inputs));
});

test("weights are metadata and even configured severe community tags stay potential", () => {
  const rules = {
    ...ASSESSMENT_RULES,
    tags: { ...ASSESSMENT_RULES.tags, 4345: { ...ASSESSMENT_RULES.tags[4345], state: "significant_concern" } },
  };
  for (const weight of [0, 99999]) {
    const finding = category(assess({ tags: [tag(4345, weight)] }, rules), "graphicViolence");
    assert.equal(finding.state, "potential_concern");
    assert.equal(finding.evidence[0].weight, weight);
    assert.equal(finding.dataCoverage, "community_tags_only");
  }
});

test("board advice leads over equally severe tags and disclosures and rating systems remain separate", () => {
  const result = assess({
    classifications: [
      rating("steam_australia", "MA15", "Strong violence"),
      rating("oflc", "r18", "Strong violence"),
      rating("esrb", "m"),
      rating("unrecognised", "18", "Gore"),
    ],
    developerMatureDisclosure: "Strong violence.",
    tags: [tag(4667)],
  });
  const violence = category(result, "violence");
  assert.equal(violence.state, "significant_concern");
  assert.match(violence.explanation, /Classification board/);
  assert.deepEqual(violence.evidence.map(({ source }) => source), [
    "official_classification", "developer_disclosure", "steam_generated_rating", "community_tag",
  ]);
  assert.deepEqual(result.officialClassifications.map(({ authority }) => authority), ["oflc", "esrb"]);
  assert.equal(result.steamAustralianRating.rating, "MA15");
  assert.equal(result.australianOfficialClassification.rating, "r18");
  assert.equal(category(result, "graphicViolence").state, "insufficient_information");
});

test("a Steam-generated rating or a low board rating alone establishes no categories", () => {
  const result = assess({ classifications: [rating("steam_australia", "R18"), rating("esrb", "e")] });
  assert.equal(result.steamAustralianRating.rating, "R18");
  assert.equal(result.australianOfficialClassification, null);
  assert.ok(result.categories.every(({ state }) => state === "insufficient_information"));
});

test("local, LAN and generic multiplayer do not establish online interaction", () => {
  const local = assess({
    categories: [feature(1, "Multi-player"), feature(39, "Shared/Split Screen Co-op"), feature(47, "LAN PvP")],
  });
  assert.equal(category(local, "onlineInteraction").state, "insufficient_information");
  assert.equal(category(local, "positive").state, "no_concerns_identified");
  const online = assess({ multiplayer: [feature(38, "Online Co-op")], workshop: true, inAppPurchases: true });
  for (const key of ["onlineInteraction", "userContent", "purchases"]) {
    assert.equal(category(online, key).state, "potential_concern");
    assert.equal(category(online, key).evidence[0].source, "steam_feature");
  }
});

test("Steam descriptor IDs distinguish general mature content and explicit sexual material", () => {
  const result = assess({ contentDescriptors: { ids: [3, 5, 999], notes: null } });
  assert.equal(category(result, "sexualContent").state, "significant_concern");
  assert.equal(category(result, "matureThemes").state, "potential_concern");
  assert.equal(category(result, "violence").state, "insufficient_information");
  assert.equal(category(result, "sexualContent").evidence[0].source, "steam_descriptor");
  const frequent = assess({ contentDescriptors: { ids: [4], notes: null } });
  assert.equal(category(frequent, "sexualContent").state, "significant_concern");
});

test("sparse board advice, genre labels and negative phrases avoid broad false positives", () => {
  const result = assess({
    tags: [tag(5350), tag(1663), tag(1685), tag(5228)],
    classifications: [rating("esrb", "e10", "Mild Blood\nMild Language\nSimulated Gambling\nUse of Alcohol and Tobacco")],
    developerMatureDisclosure: "No nudity or sexual content. This is a language learning game without gore.",
    shortDescription: "A casino card game with puzzles and shooting.",
  });
  for (const key of ["graphicViolence", "strongLanguage", "sexualContent", "violence", "onlineInteraction", "positive"]) {
    assert.equal(category(result, key).state, "insufficient_information", key);
  }
  assert.equal(category(result, "gambling").state, "potential_concern");
  assert.equal(category(result, "substances").state, "potential_concern");
});

test("manual findings retain a reason and source and cannot suppress contrary evidence", () => {
  const rules = {
    ...ASSESSMENT_RULES,
    overrides: [{
      appId: 1, category: "gambling", state: "no_concerns_identified",
      reason: "Reviewed the specified release.", sourceName: "Test source", sourceUrl: "https://example.com/review",
    }],
  };
  const cleared = category(assess({}, rules), "gambling");
  assert.equal(cleared.state, "no_concerns_identified");
  assert.equal(cleared.evidence[0].sourceUrl, "https://example.com/review");
  assert.equal(category(assess({ appId: 2 }, rules), "gambling").state, "insufficient_information");
  const conflicting = category(assess({ tags: [tag(16250)] }, rules), "gambling");
  assert.equal(conflicting.state, "potential_concern");
  assert.equal(conflicting.evidence.length, 2);
});

test("explicit DLC is outside the assessment scope", () => {
  const result = assess({ appType: "dlc", developerMatureDisclosure: "Intense violence." });
  assert.match(result.summary, /outside the game assessment scope/);
  assert.equal(category(result, "violence").state, "insufficient_information");
});
