import assert from "node:assert/strict";
import test from "node:test";
import { assessSteamGame } from "../lib/assessmentEngine.ts";
import { canRefreshReport, isIndexableReport, recentReportCards, reportSearchDescription } from "../lib/reportSeo.ts";

const date = "2026-11-26T00:00:00.000Z";
const now = Date.parse(date);
const sources = { appdetails: true, getItems: true, getTagList: true };
const snapshot = {
  metadata: {
    appId: 1, title: "Test Game", appType: "game",
    classifications: [{ authority: "esrb", rating: "T", descriptors: "Violence" }],
  },
  expires_at: "2026-11-27T00:00:00.000Z",
  sources,
};
const eligible = (value) => isIndexableReport(value, assessSteamGame(value.metadata, date), now);

test("recent report cards require complete fresh game data and Steam capsule art", () => {
  const artwork = "https://cdn.cloudflare.steamstatic.com/steam/apps/1/capsule_231x87.jpg";
  const valid = { ...snapshot, sources: { ...sources, getTagList: false }, metadata: { ...snapshot.metadata, capsuleImage: artwork } };
  const rows = [
    { ...valid, expires_at: date },
    { ...valid, sources: { ...sources, getItems: false } },
    { ...valid, metadata: { ...valid.metadata, appType: "dlc" } },
    { ...valid, metadata: { ...valid.metadata, appId: 0 } },
    { ...valid, metadata: { ...valid.metadata, title: " " } },
    { ...valid, metadata: { ...valid.metadata, capsuleImage: "https://example.com/capsule.jpg" } },
    ...Array.from({ length: 8 }, (_, index) => ({ ...valid, metadata: { ...valid.metadata, appId: index + 1 } })),
  ];
  const cards = recentReportCards(rows, now);
  assert.deepEqual(cards.map(({ appId }) => appId), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(cards[0], { appId: 1, title: "Test Game", artwork, href: "/games/1/test-game", expiresAt: Date.parse(valid.expires_at) });
  assert.deepEqual(recentReportCards(rows.slice(0, 6), now), []);
});

test("reports need fresh, complete source coverage and informative direct evidence", () => {
  assert.equal(eligible(snapshot), true);
  assert.equal(eligible({ ...snapshot, expires_at: date }), false);
  assert.equal(eligible({ ...snapshot, sources: { ...sources, getTagList: false } }), false);
  assert.equal(eligible({ ...snapshot, metadata: { ...snapshot.metadata, comingSoon: true } }), false);
  assert.equal(eligible({ ...snapshot, metadata: { ...snapshot.metadata, classifications: null,
    tags: [{ id: 1667 }, { id: 1664 }] } }), false);
  assert.match(reportSearchDescription("Test Game"), /Test Game.*parents guide/);
});

test("crawler, unknown direct, preview and prefetch requests are cache-only", () => {
  const refresh = (headers) => canRefreshReport(new Headers(headers));
  assert.equal(refresh({}), false);
  assert.equal(refresh({ "sec-fetch-mode": "navigate", "user-agent": "Googlebot/2.1" }), false);
  assert.equal(refresh({ "user-agent": "facebookexternalhit/1.1" }), false);
  assert.equal(refresh({ "sec-fetch-mode": "navigate", "sec-purpose": "prefetch" }), false);
  assert.equal(refresh({ rsc: "1", "sec-fetch-site": "same-origin", "next-router-prefetch": "1" }), false);
  assert.equal(refresh({ "sec-fetch-mode": "navigate" }), true);
  assert.equal(refresh({ rsc: "1", "sec-fetch-site": "same-origin" }), true);
  assert.equal(refresh({ rsc: "1", "sec-fetch-site": "cross-site" }), false);
});
