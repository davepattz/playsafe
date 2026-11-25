import assert from "node:assert/strict";
import test from "node:test";
import { australianRatingLabel, positiveSteamTags, reportOverview } from "../lib/reportPresentation.ts";

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

test("Australian rating formatting preserves unknown codes", () => {
  assert.equal(australianRatingLabel("ma15"), "MA 15+");
  assert.equal(australianRatingLabel("R18+"), "R 18+");
  assert.equal(australianRatingLabel("pg"), "PG");
  assert.equal(australianRatingLabel("unrecognised"), "UNRECOGNISED");
});
