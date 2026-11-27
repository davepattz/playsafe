import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return next("data:text/javascript,export%20%7B%7D", context);
    const local = context.parentURL?.startsWith(new URL("../lib/", import.meta.url).href);
    return next(local && /^\.\/[^.]+$/.test(specifier) ? specifier + ".ts" : specifier, context);
  },
});

const { inspectSteamGame, normalizeSteamMetadata, searchSteamGames, steamSearchErrorResponse } = await import("../lib/steamMetadata.ts");
const { reportClassifications } = await import("../lib/reportClassifications.ts");
const { assessSteamGame } = await import("../lib/assessmentEngine.ts");

const rating = (authority, value, descriptors = null, generated) => ({ authority, rating: value, descriptors, generated });

test("mixed Steam ratings are grouped and sorted by region with their source values intact", () => {
  const metadata = normalizeSteamMetadata(620, { 620: { success: true, data: { ratings: {
    esrb: { rating: "t" },
    cero: { rating: "c", descriptors: "暴力" },
    pegi: { rating: 12 },
    steam_germany: { rating: "12", rating_generated: "1" },
    dejus: { rating: "12", descriptors: "Linguagem imprópria", rating_generated: "1" },
    steam_australia: { rating: "PG" },
  } } } }, { response: { store_items: [{ appid: 620, game_rating: {
    type: "dejus", rating: "12",
  } }] } });
  const report = reportClassifications(metadata, true);
  assert.deepEqual(report.official.map(({ region, rating }) => [region, rating]), [
    ["Europe", "12"], ["Japan", "c"], ["North America", "t"],
  ]);
  assert.deepEqual(report.generated.map(({ region }) => region), ["Australia", "Brazil", "Germany"]);
  assert.deepEqual(report.unverified, []);
  assert.equal(report.official[0].descriptors, null);
  assert.equal(report.official[1].descriptors, "暴力");
  assert.equal(report.official[1].englishDescriptors, "Violence");
  assert.equal(report.generated[1].descriptors, "Linguagem imprópria");
  assert.equal(report.generated[1].englishDescriptors, "Inappropriate language");
  const { reportedClassifications, ...oldMetadata } = metadata;
  const date = "2026-11-27";
  assert.ok(reportedClassifications.length);
  assert.deepEqual(assessSteamGame(metadata, date), assessSteamGame(oldMetadata, date));
});

test("official-only legacy reports merge duplicate entries without losing distinct ratings or descriptors", () => {
  const metadata = JSON.parse(JSON.stringify({
    classifications: [rating("oflc", "pg"), rating("ACB", "PG", "Mild violence"),
      rating("acb", "PG", "Mild violence"), rating("pegi", "7"), rating("pegi", "12")],
    australianClassification: rating("oflc", "pg", "Mild themes"),
    steamAustralianRating: null,
  }));
  const report = reportClassifications(metadata, true);
  assert.equal(report.state, "available");
  assert.deepEqual(report.generated, []);
  assert.equal(report.official.length, 3);
  assert.equal(report.official[0].authority, "Australian Classification Board");
  assert.equal(report.official[0].descriptors, "Mild violence\nMild themes");
});

test("Steam-generated-only reports keep unknown regions and omit the official group", () => {
  const report = reportClassifications({ reportedClassifications: [
    rating("steam_germany", "6"), rating("steam_unknown", "7"), rating("steam_australia", "G"),
  ] }, true);
  assert.deepEqual(report.official, []);
  assert.deepEqual(report.generated.map(({ region }) => region), ["Australia", "Country or region unspecified", "Germany"]);
  assert.equal(report.generated[1].sourceIdentifier, "steam_unknown");
});

test("unknown authorities and ambiguous cached Brazil ratings remain visible with fallback labels", () => {
  const report = reportClassifications({ classifications: [
    rating("toString", "7"), rating("dejus", "12"), rating("invalid", " "),
  ], australianClassification: null, steamAustralianRating: null }, true);
  assert.deepEqual(report.official, []);
  assert.deepEqual(report.generated, []);
  assert.deepEqual(report.unverified.map(({ region, authority, sourceIdentifier }) => [region, authority, sourceIdentifier]), [
    ["Brazil", "DEJUS", null], ["Country or region unspecified", "Unverified authority", "toString"],
  ]);
});

test("confirmed absence and partial Steam retrieval use different empty states", () => {
  assert.equal(reportClassifications({ reportedClassifications: [] }, true).state, "missing");
  assert.equal(reportClassifications({ reportedClassifications: [] }, false).state, "temporarily_unavailable");
  assert.equal(reportClassifications({ reportedClassifications: [rating("esrb", "e")] }, false).state, "available");
});

test("Steam throttling, unavailability and timeout produce distinct autocomplete errors", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch");
  const timeout = t.mock.method(AbortSignal, "timeout");
  const controller = new AbortController();
  timeout.mock.mockImplementation(() => controller.signal);
  for (const [upstream, expected] of [[429, 503], [503, 502]]) {
    fetch.mock.mockImplementation(async () => new Response(null, { status: upstream }));
    await assert.rejects(searchSteamGames("Portal"), (error) => {
      const response = steamSearchErrorResponse(error);
      assert.equal(response.status, expected);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.equal(response.headers.get("Retry-After"), upstream === 429 ? "60" : null);
      return true;
    });
  }
  controller.abort();
  fetch.mock.mockImplementation(async () => { throw controller.signal.reason; });
  await assert.rejects(searchSteamGames("Portal"), (error) => steamSearchErrorResponse(error).status === 504);
});

test("missing browse and tag services preserve verified app details as partial evidence", async (t) => {
  const appId = 620;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.redirect, "error");
    if (url.hostname === "store.steampowered.com") {
      return Response.json({ [appId]: { success: true, data: { name: "Portal 2", type: "game" } } });
    }
    return new Response(null, { status: 503 });
  });
  const { metadata, sources } = await inspectSteamGame(appId);
  assert.equal(metadata.appType, "game");
  assert.equal(metadata.title, "Portal 2");
  assert.equal(metadata.tags, null);
  assert.equal(sources.appdetails.available, true);
  assert.equal(sources.getItems.available, false);
  assert.equal(sources.getTagList.available, false);
  assert.equal(reportClassifications(metadata, sources.appdetails.available && sources.getItems.available).state,
    "temporarily_unavailable");
});

test("an exact but sparse catalogue match merges live alternatives and survives Steam outages", async (t) => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    V2_SUPABASE_URL: "http://127.0.0.1:3110",
    V2_SUPABASE_ALLOWED_ORIGIN: "http://127.0.0.1:3110",
    V2_SUPABASE_SERVICE_ROLE_KEY: "sb_secret_fixture",
  };
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  t.after(() => { process.env = originalEnv; });
  const { searchGameCatalogue } = await import("../lib/steamCatalogue.ts");
  const art = "https://cdn.akamai.steamstatic.com/portal.jpg";
  const local = [{ app_id: 400, title: "Portal", capsule_image: art, release_year: 2007, platforms: ["Windows"] }];
  let offline = false;
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/v2_find_games")) return Response.json(local);
    if (url.pathname.endsWith("/v2_game_catalogue")) return new Response(null, { status: 204 });
    if (offline) return new Response(null, { status: 503 });
    if (url.pathname.endsWith("/storesearch/")) {
      return Response.json({ items: [
        { id: 620, type: "app", name: "Portal 2" }, { id: 400, type: "app", name: "Portal" },
      ] });
    }
    assert.match(url.pathname, /\/GetItems\//);
    return Response.json({ response: { store_items: [400, 620].map((appid) => ({
      appid, success: 1, item_type: 0, type: 0,
    })) } });
  });
  const merged = await searchGameCatalogue("Portal");
  assert.deepEqual(merged.map(({ appId }) => appId), [400, 620]);
  assert.equal(merged[0].capsuleImage, art);
  offline = true;
  assert.deepEqual((await searchGameCatalogue("Portal 2")).map(({ appId }) => appId), [400]);
});
