import assert from "node:assert/strict";
import test from "node:test";
import { createMetadataCache, metadataCoverage } from "../lib/metadataCache.ts";
import { assessSteamGame } from "../lib/assessmentEngine.ts";
import { ASSESSMENT_RULES } from "../lib/assessmentRules.ts";

const timestamp = Date.parse("2026-11-25T03:00:00.000Z");
const metadata = {
  appId: 1, appType: "game", title: "Fixture",
  classifications: [{ authority: "oflc", rating: "PG", descriptors: "Mild violence" }],
  tags: [{ id: 4667, name: "Violent", weight: 1 }],
};
const sources = { appdetails: true, getItems: true, getTagList: true };
const observation = { metadata, sources, failed: false };
const record = {
  metadata, sources, coverage: metadataCoverage(metadata, sources),
  retrieved_at: new Date(timestamp - 3600_000).toISOString(),
  expires_at: new Date(timestamp + 1000).toISOString(),
};
const expired = { ...record, expires_at: new Date(timestamp - 1).toISOString() };

function fixtures(overrides = {}) {
  let reads = 0;
  let loads = 0;
  let writes = 0;
  let clock = timestamp;
  const cache = createMetadataCache({
    ttlSeconds: 604800, now: () => clock,
    read: async () => { reads++; return null; },
    save: async () => { writes++; return true; },
    load: async () => { loads++; return observation; },
    ...overrides,
  });
  return { cache, setClock: (time) => { clock = time; }, counts: () => ({ reads, loads, writes }) };
}

test("fresh persistent records never require Steam and carry retrieval age", async () => {
  const { cache, counts } = fixtures({ read: async () => record });
  const result = await cache(1);
  assert.equal(result.snapshot, record);
  assert.deepEqual(result.diagnostics, { cache: "hit", refresh: "not_needed", ageSeconds: 3600 });
  assert.equal(counts().loads, 0);
});

test("a miss writes a complete snapshot with a seven-day expiry", async () => {
  const { cache, counts } = fixtures();
  const found = await cache(1);
  assert.deepEqual(counts(), { reads: 1, loads: 1, writes: 1 });
  assert.equal(found.diagnostics.refresh, "stored");
  assert.equal(Date.parse(found.snapshot.expires_at) - Date.parse(found.snapshot.retrieved_at), 604800_000);
  assert.equal((await cache(1)).diagnostics.cache, "hit");
});

test("simultaneous requests for the same app share one lookup and refresh", async () => {
  const { cache, counts } = fixtures();
  const requests = [cache(1), cache(1), cache(1)];
  assert.equal(requests[0], requests[1]);
  await Promise.all(requests);
  assert.deepEqual(counts(), { reads: 1, loads: 1, writes: 1 });
});

test("Steam failure serves the stale snapshot and defers repeat refreshes", async () => {
  const { cache, counts } = fixtures({
    read: async () => expired,
    load: async () => { throw new Error("Steam offline"); },
  });
  const result = await cache(1);
  assert.equal(result.snapshot, expired);
  assert.equal(result.diagnostics.cache, "stale");
  assert.equal(result.diagnostics.refresh, "failed");
  assert.equal((await cache(1)).diagnostics.refresh, "deferred");
  assert.equal(counts().writes, 0);
});

test("a successful but thinner observation does not replace classification advice", async () => {
  const { cache, counts } = fixtures({
    read: async () => expired,
    load: async () => ({ ...observation, metadata: { ...metadata, classifications: [{ authority: "oflc", rating: "PG" }] } }),
  });
  const result = await cache(1);
  assert.equal(result.diagnostics.refresh, "incomplete");
  assert.strictEqual(result.snapshot, expired);
  assert.equal(counts().writes, 0);
});

test("a partial first observation can render without being persisted", async () => {
  const { cache, counts } = fixtures({
    load: async () => ({ ...observation, sources: { ...sources, appdetails: false } }),
  });
  assert.equal((await cache(1)).diagnostics.refresh, "incomplete");
  assert.equal(counts().writes, 0);
});

test("dropping some tags cannot overwrite a more complete catalogue observation", async () => {
  const richer = { ...metadata, tags: [...metadata.tags, { id: 1, name: "Other", weight: 2 }] };
  const past = { ...expired, metadata: richer, coverage: metadataCoverage(richer, sources) };
  const { cache, counts } = fixtures({ read: async () => past });
  assert.strictEqual((await cache(1)).snapshot, past);
  assert.equal(counts().writes, 0);
});

test("successful refresh after expiry stores new Steam evidence", async () => {
  const { cache, counts } = fixtures({ read: async () => expired });
  const result = await cache(1);
  assert.equal(result.diagnostics.refresh, "stored");
  assert.equal(Date.parse(result.snapshot.retrieved_at), timestamp);
  assert.equal(counts().writes, 1);
});

test("database failure falls back to live metadata, then to remembered stale evidence when both are down", async () => {
  let offline = false;
  const { cache, setClock } = fixtures({
    read: async () => { throw new Error("DB offline"); },
    save: async () => { throw new Error("DB offline"); },
    load: async () => { if (offline) throw new Error("Steam offline"); return observation; },
  });
  assert.equal((await cache(1)).diagnostics.cache, "database_error");
  offline = true;
  setClock(timestamp + 8 * 86400_000);
  assert.equal((await cache(1)).diagnostics.cache, "stale");
});

test("missing app, outage, and rate-limited refresh have distinct outcomes", async () => {
  const { cache } = fixtures({
    load: async () => ({ metadata: { appType: null }, sources: {}, failed: false }),
  });
  assert.equal((await cache(1)).diagnostics.refresh, "unavailable");
  assert.equal((await cache(1, async () => false)).diagnostics.refresh, "rate_limited");
  const offline = fixtures({ load: async () => { throw new Error("Steam offline"); } });
  assert.equal((await offline.cache(1)).diagnostics.refresh, "failed");
});

test("an atomic write rejected by another process returns the stored winner", async () => {
  let reads = 0;
  const { cache } = fixtures({
    read: async () => ++reads === 1 ? expired : record,
    save: async () => false,
  });
  assert.equal((await cache(1)).snapshot, record);
});

test("reports regenerate from identical cached metadata when rules or overrides change", () => {
  const before = assessSteamGame(record.metadata, record.retrieved_at);
  const after = assessSteamGame(record.metadata, record.retrieved_at, {
    ...ASSESSMENT_RULES, version: "test-next",
    overrides: [{ appId: 1, category: "violence", state: "significant_concern", reason: "Updated source",
      sourceName: "Fixture", sourceUrl: "https://example.com" }],
  });
  assert.notEqual(before.rulesVersion, after.rulesVersion);
  assert.equal(before.categories.find(({ category }) => category === "violence").state, "potential_concern");
  assert.equal(after.categories.find(({ category }) => category === "violence").state, "significant_concern");
});
