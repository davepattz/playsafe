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

const { inspectSteamGame, searchSteamGames, steamSearchErrorResponse } = await import("../lib/steamMetadata.ts");

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
