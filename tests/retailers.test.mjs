import assert from "node:assert/strict";
import test from "node:test";
import { track } from "../lib/analytics.ts";
import { isApprovedRetailerUrl, retailerSearchLinks } from "../lib/retailers.ts";

test("retailer links search the approved storefront for the original Steam title", () => {
  for (const title of [
    "Hogwarts Legacy", "Minecraft Dungeons", "Disney Dreamlight Valley", "Cyberpunk 2077",
    "Red Dead Redemption 2", "Baldur's Gate 3", "Sid Meier’s Civilization® VI", "The Last Clockwinder",
    "The Witcher 3: Wild Hunt – Complete Edition", "Wobbly Life", "A/B #1 & DLC? next=https://example.org",
  ]) {
    const links = retailerSearchLinks({ title, isFree: false, genres: null });
    assert.deepEqual(links.map(({ name }) => name), ["Fanatical", "Green Man Gaming", "Humble Store"]);
    for (const [link, origin, path, parameter] of [
      [links[0], "https://www.fanatical.com", "/en/search", "search"],
      [links[1], "https://www.greenmangaming.com", "/search", "query"],
      [links[2], "https://www.humblebundle.com", "/search", "query"],
    ]) {
      const url = new URL(link.href);
      assert.equal(url.origin, origin);
      assert.equal(url.pathname, path);
      assert.deepEqual([...url.searchParams], [[parameter, title]]);
      assert.doesNotMatch(url.search, /\+/);
      assert.equal(url.hash, "");
      assert.equal(link.linkType, "retailer_search");
      assert.equal(link.affiliate, false);
    }
  }
});

test("free-to-play reports hide retailer search links and older metadata remains compatible", () => {
  const title = "Counter-Strike 2";
  const genres = [{ id: 37, name: "Free To Play" }];
  assert.deepEqual(retailerSearchLinks({ title, isFree: true, genres: null }), []);
  assert.deepEqual(retailerSearchLinks({ title, genres }), []);
  assert.deepEqual(retailerSearchLinks({ title: " ", genres: null }), []);
  assert.equal(retailerSearchLinks({ title: "Older cached paid report", genres: null }).length, 3);
  assert.equal(retailerSearchLinks({ title: "Paid listing", genres, isFree: false }).length, 3);
});

test("retailer allowlist rejects unsafe protocols, credentials and lookalike origins", () => {
  assert.equal(isApprovedRetailerUrl("https://www.fanatical.com/en/search"), true);
  assert.equal(isApprovedRetailerUrl("https://www.greenmangaming.com/search"), true);
  assert.equal(isApprovedRetailerUrl("https://www.humblebundle.com/search"), true);
  for (const url of [
    "http://www.fanatical.com/en/search", "https://www.fanatical.com.evil.example",
    "https://www.fanatical.com@evil.example", "https://user@www.fanatical.com",
    "https://www.fanatical.com:444/en/search", "javascript:alert(1)", "/en/search",
    "https://www.greenmangaming.com.evil.example", "https://www.humblebundle.com.evil.example",
  ]) assert.equal(isApprovedRetailerUrl(url), false, url);
});

test("retailer and Steam analytics use consent and strip search parameters from the page URL", (t) => {
  let consent = "no";
  const events = [];
  globalThis.window = {
    localStorage: { getItem: () => consent },
    gtag: (...args) => events.push(args),
    location: { origin: "https://playsafe.games", pathname: "/games/620/portal-2", search: "?q=private" },
  };
  t.after(() => { delete globalThis.window; });
  const open = () => track("where_to_buy_opened", { steam_app_id: 620 });
  const click = () => track("retailer_link_clicked", {
    steam_app_id: 620, retailer_name: "Fanatical", link_type: "retailer_search", affiliate: false,
  });
  const steam = () => track("steam_store_clicked", {
    steam_app_id: 620, retailer_name: "Steam", link_type: "steam_store", affiliate: false,
  });
  assert.deepEqual([open(), click(), steam()], [false, false, false]);
  consent = "yes";
  assert.deepEqual([open(), click(), steam()], [true, true, true]);
  assert.deepEqual(events.map(([, event]) => event), ["where_to_buy_opened", "retailer_link_clicked", "steam_store_clicked"]);
  assert.deepEqual(events[1][2], {
    steam_app_id: 620, retailer_name: "Fanatical", link_type: "retailer_search", affiliate: false,
    page_location: "https://playsafe.games/games/620/portal-2", page_referrer: "",
  });
});
