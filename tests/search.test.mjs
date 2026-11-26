import assert from "node:assert/strict";
import test from "node:test";
import {
  gameReportPath, gameSlug, hasEnoughLocalSuggestions, moveSearchSelection, normalizeGameQuery, parseSteamAppId, rankGameTitles, steamArtworkUrl,
} from "../lib/gameSearch.ts";

test("search trims, collapses whitespace, and caps query length", () => {
  assert.equal(normalizeGameQuery("  Stardew \n Valley  "), "Stardew Valley");
  assert.equal(normalizeGameQuery("a".repeat(120)).length, 100);
  assert.equal(normalizeGameQuery("\0 Portal\u007f 2 "), "Portal 2");
  assert.equal(normalizeGameQuery("a".repeat(99) + "🎮 games"), "a".repeat(99) + "🎮");
});

test("sparse exact matches and title-only exports still require Steam fallback", () => {
  const regional = { title: "Portal", capsuleImage: "https://cdn.akamai.steamstatic.com/portal.jpg" };
  assert.equal(hasEnoughLocalSuggestions([regional]), false);
  assert.equal(hasEnoughLocalSuggestions(Array(7).fill(regional)), false);
  assert.equal(hasEnoughLocalSuggestions([...Array(7).fill(regional), { title: "Portal 2" }]), false);
  assert.equal(hasEnoughLocalSuggestions(Array(8).fill(regional)), true);
});

test("only credential-free HTTPS Steam artwork is allowed", () => {
  const artwork = "https://shared.akamai.steamstatic.com/store/game.jpg";
  assert.equal(steamArtworkUrl(artwork), artwork);
  for (const invalid of ["http://steamstatic.com/a", "https://steamstatic.com.example.org/a",
    "https://user@steamstatic.com/a", "https://steamstatic.com:8443/a", "/images/foo.jpg"]) {
    assert.equal(steamArtworkUrl(invalid), undefined);
  }
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
