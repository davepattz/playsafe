import assert from "node:assert/strict";
import test from "node:test";
import {
  gameReportPath, gameSlug, moveSearchSelection, normalizeGameQuery, parseSteamAppId, rankGameTitles,
} from "../lib/gameSearch.ts";

test("search trims, collapses whitespace, and caps query length", () => {
  assert.equal(normalizeGameQuery("  Stardew \n Valley  "), "Stardew Valley");
  assert.equal(normalizeGameQuery("a".repeat(120)).length, 100);
});

test("exact title ranks above prefix and token matches, with stable ties", () => {
  const titles = ["Farming Valley", "Stardew Valley Expanded", "Valley of Stardew", "Stardew Valley", "Stardew Valley Deluxe"];
  const results = rankGameTitles(titles.map((title) => ({ title })), "stardew valley").map(({ title }) => title);
  assert.deepEqual(results, ["Stardew Valley", "Stardew Valley Expanded", "Stardew Valley Deluxe", "Valley of Stardew", "Farming Valley"]);
  assert.equal(rankGameTitles([{ title: "BeamNG.drive" }, { title: "BeamNG.drive Demo" }].reverse(), "BeamNG drive")[0].title, "BeamNG.drive");
});

test("report paths use validated app IDs and readable encoded slugs", () => {
  assert.equal(gameReportPath(4000, "Garry’s Mod"), "/games/4000/garrys-mod");
  assert.equal(gameSlug("Éditions: 中文!"), "editions-中文");
  assert.equal(gameReportPath(1, "雪"), "/games/1/%E9%9B%AA");
  assert.doesNotThrow(() => gameReportPath(1, "a".repeat(89) + "𠮷"));
  assert.equal(gameSlug("!!!"), "game");
  for (const invalid of ["", "0", "-1", "1.1", "1e3", "4294967296", "1/2"]) assert.equal(parseSteamAppId(invalid), null);
  assert.equal(parseSteamAppId("4294967295"), 4294967295);
});

test("keyboard selection starts at the correct end and wraps", () => {
  assert.equal(moveSearchSelection(-1, 3, 1), 0);
  assert.equal(moveSearchSelection(-1, 3, -1), 2);
  assert.equal(moveSearchSelection(2, 3, 1), 0);
  assert.equal(moveSearchSelection(0, 3, -1), 2);
  assert.equal(moveSearchSelection(-1, 0, 1), -1);
});
