import assert from "node:assert/strict";
import test from "node:test";
import { australianRatingLabel, gameplayFeatures, positiveGameplayFeatures, positiveSteamTags, reportCoverage, reportFinding, reportOverview, reportOverviewStatus } from "../lib/reportPresentation.ts";
import { assessSteamGame } from "../lib/assessmentEngine.ts";

const completeSources = { appdetails: true, getItems: true };
const cachedGame = {
  appId: 101, appType: "game", title: "Test Game",
  categories: [{ id: 2, name: "Single-player" }],
  tags: [{ id: 19, name: "Action", weight: 1 }],
  classifications: [{ authority: "esrb", rating: "E", descriptors: "Comic mischief" }],
};

function present(game, sources = completeSources) {
  const { categories } = assessSteamGame(game, "2026-11-27");
  const coverage = reportCoverage(game, sources);
  return {
    categories: Object.fromEntries(categories.map((finding) => [finding.category, reportFinding(finding, coverage)])),
    overall: reportOverviewStatus(categories, coverage),
  };
}

test("gameplay chips combine listed play modes and community features without duplicates", () => {
  const game = {
    ...cachedGame,
    categories: [...cachedGame.categories, { id: 38, name: "Online Co-op" }, { id: 48, name: "LAN Co-op" }, { id: 35, name: "In-App Purchases" }],
    multiplayer: [{ id: 38, name: "Online Co-op" }],
    tags: [{ name: "Online Co-Op" }, { name: "Local Co-Op" }, { name: "Puzzle" }],
  };
  assert.deepEqual(
    gameplayFeatures(game, []).map(({ label }) => label),
    ["Single-player", "Online Co-op", "LAN Co-op", "Local Co-Op", "Puzzle"],
  );
});

test("cached Steam data distinguishes unmentioned concerns across all report sections", () => {
  const { categories, overall } = present(JSON.parse(JSON.stringify(cachedGame)));
  for (const key of ["violence", "onlineInteraction", "userContent", "purchases"]) {
    assert.equal(categories[key].label, "Not mentioned");
    assert.equal(categories[key].explanation, "This concern is not mentioned in the available Steam data.");
    assert.equal(categories[key].tooltip, "This concern may not be present in the game, but its absence from Steam's data does not guarantee this.");
    assert.equal(categories[key].evidenceCoverage, "Relevant Steam data reviewed");
  }
  assert.equal(categories.positive.label, "Not mentioned");
  assert.equal(categories.positive.explanation, "This feature is not mentioned in the available Steam data.");
  assert.match(categories.positive.tooltip, /^This feature may not be present/);
  assert.equal(overall.label, "No concerns flagged in available data");
});

test("missing relevant fields and failed requests display Information unavailable", () => {
  const missing = present({ appId: 101, appType: "game", title: "Test Game" });
  const failed = present(cachedGame, { appdetails: false, getItems: false });
  for (const report of [missing, failed]) {
    assert.equal(report.overall.label, "Information unavailable");
    for (const category of Object.values(report.categories)) {
      assert.equal(category.label, "Information unavailable");
      assert.equal(category.tooltip, undefined);
    }
  }
  const featureOnly = present({ appId: 101, appType: "game", categories: cachedGame.categories });
  assert.equal(featureOnly.categories.violence.label, "Information unavailable");
  assert.equal(featureOnly.categories.purchases.label, "Not mentioned");
});

test("partial retrieval and unresolved mentions retain Insufficient information", () => {
  const partial = present(cachedGame, { appdetails: true, getItems: false });
  assert.equal(partial.categories.violence.label, "Insufficient information");
  assert.equal(partial.categories.violence.tooltip, undefined);
  assert.equal(partial.overall.label, "Insufficient information");
  const ambiguous = present({ ...cachedGame, developerMatureDisclosure: "No violence or gambling" });
  assert.equal(ambiguous.categories.violence.label, "Insufficient information");
  assert.equal(ambiguous.categories.gambling.label, "Insufficient information");
  assert.equal(ambiguous.categories.horror.label, "Not mentioned");
});

test("supported concerns and positive findings keep their existing status even with partial coverage", () => {
  const { categories, overall } = present({
    ...cachedGame, developerMatureDisclosure: "Strong violence",
    categories: [...cachedGame.categories, { id: 35, name: "In-App Purchases" }, { id: 24, name: "Shared/Split Screen" }],
  }, { appdetails: true, getItems: false });
  assert.equal(categories.violence.label, "Significant concern");
  assert.equal(categories.purchases.label, "Potential concern");
  assert.equal(categories.positive.label, "Positive features identified");
  assert.equal(categories.positive.tooltip, undefined);
  assert.deepEqual(categories.positive.explanationEvidence, {
    start: "Available evidence highlights ".length,
    label: "Shared/Split Screen",
  });
  assert.equal(overall.label, "Significant concerns identified");
});

test("potential online safety concerns explain online interaction and player-made content separately", () => {
  const { categories } = present({
    ...cachedGame, categories: [
      { id: 38, name: "Online Co-op" }, { id: 30, name: "Steam Workshop" }, { id: 35, name: "In-App Purchases" },
    ],
  });
  assert.equal(categories.onlineInteraction.label, "Potential concern");
  assert.match(categories.onlineInteraction.tooltip, /interact with other people online/);
  assert.deepEqual(categories.onlineInteraction.explanationEvidence, {
    start: "Steam lists the feature “".length,
    label: "Online Co-op",
  });
  assert.equal(categories.userContent.label, "Potential concern");
  assert.match(categories.userContent.tooltip, /content made by other players/);
  assert.equal(categories.purchases.tooltip, undefined);
});

test("report highlights significant concerns first without including positive or unknown findings", () => {
  const categories = [
    { category: "violence", state: "potential_concern" },
    { category: "graphicViolence", state: "significant_concern" },
    { category: "gambling", state: "insufficient_information" },
    { category: "positive", state: "no_concerns_identified" },
  ];
  const result = reportOverview(categories);
  assert.equal(result.status, "significant_concern");
  assert.deepEqual(result.concerns.map(({ category }) => category), ["graphicViolence", "violence"]);
  assert.equal(reportOverview([categories[0]]).status, "potential_concern");
});

test("positive or missing evidence cannot produce an overall clearance", () => {
  assert.deepEqual(reportOverview([{ category: "positive", state: "no_concerns_identified" }]), {
    status: "insufficient_information", concerns: [],
  });
});

test("report shows only recognised positive tags and avoids duplicate or missing labels", () => {
  assert.deepEqual(positiveSteamTags(null), []);
  assert.deepEqual(positiveSteamTags([
    { name: "Exploration" }, { name: "Exploration" }, { name: "Puzzle" }, { name: "Gore" }, { name: null },
  ]), ["Exploration", "Puzzle"]);
});

test("gameplay explanations cover reported community tags and Steam-listed local features", () => {
  const game = {
    ...cachedGame,
    tags: [
      { name: "Sandbox" }, { name: "Local Multiplayer" }, { name: "Split Screen" },
      { name: "Sandbox" }, { name: "Unsupported tag" },
    ],
    categories: [{ id: 39, name: "Shared/Split Screen Co-op" }],
  };
  const assessment = assessSteamGame(game, "2026-11-27");
  const features = positiveGameplayFeatures(game.tags, assessment.categories);
  assert.deepEqual(features.map(({ label }) => label), ["Sandbox", "Local Multiplayer", "Split Screen", "Shared/Split Screen Co-op"]);
  assert.match(features[0].description, /choose their own goals/);
  assert.match(features[1].description, /same room/);
  assert.match(features[2].description, /separate view/);
  assert.match(features[3].description, /work together/);
  assert.deepEqual(positiveGameplayFeatures(null, []), []);
});

test("gameplay explanations only appear on reports for games that list those features", () => {
  const fixtures = [
    { tags: [{ name: "Sandbox" }], categories: null, expected: ["Sandbox"] },
    { tags: null, categories: [{ id: 24, name: "Shared/Split Screen" }], expected: ["Shared/Split Screen"] },
    { tags: [{ name: "Local Multiplayer" }], categories: null, expected: ["Local Multiplayer"] },
    { tags: null, categories: null, expected: [] },
  ];
  fixtures.forEach(({ tags, categories, expected }, index) => {
    const game = { ...cachedGame, appId: 1000 + index, tags, categories };
    const assessment = assessSteamGame(game, "2026-11-27");
    assert.deepEqual(positiveGameplayFeatures(game.tags, assessment.categories).map(({ label }) => label), expected);
  });
});

test("Australian rating formatting preserves unknown codes", () => {
  assert.equal(australianRatingLabel("ma15"), "MA 15+");
  assert.equal(australianRatingLabel("R18+"), "R 18+");
  assert.equal(australianRatingLabel("pg"), "PG");
  assert.equal(australianRatingLabel("unrecognised"), "UNRECOGNISED");
});
