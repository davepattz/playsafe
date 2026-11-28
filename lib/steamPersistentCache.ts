import "server-only";

import { unstable_cache } from "next/cache";
import { createMetadataCache } from "./metadataCache.ts";
import type { MetadataSnapshot } from "./metadataCache";
import { recentReportCards } from "./reportSeo";
import { inspectSteamGame, STEAM_CONTEXT } from "./steamMetadata";
import { positiveEnv, v2Database, v2DatabaseConfigured } from "./v2Database";
import { allowV2Request } from "./v2RateLimit";

const region = STEAM_CONTEXT.country_code;
const language = STEAM_CONTEXT.language;
const enabled = v2DatabaseConfigured();
const selection = { select: "metadata,sources,coverage,retrieved_at,expires_at", region: `eq.${region}`, language: `eq.${language}` };

function validSnapshot(record: MetadataSnapshot | null | undefined): record is MetadataSnapshot {
  return Boolean(record?.metadata?.appType === "game" && record.metadata.title &&
    record.sources && record.coverage &&
    Number.isFinite(Date.parse(record.retrieved_at)) && Number.isFinite(Date.parse(record.expires_at)));
}

async function readSnapshot(appId: number) {
  const params = new URLSearchParams({ ...selection, app_id: `eq.${appId}`, limit: "1" });
  const records = await v2Database<MetadataSnapshot[]>(`v2_game_metadata?${params}`);
  const record = Array.isArray(records) ? records[0] : null;
  return validSnapshot(record) && record.metadata.appId === appId ? record : null;
}

export async function readPublishedReport(appId: number) {
  return enabled ? readSnapshot(appId) : null;
}

export async function listFreshReportSnapshots(now: string, { limit = 500, requireTagList = true } = {}) {
  if (!enabled) return [];
  const requiredSources = { appdetails: true, getItems: true, ...(requireTagList ? { getTagList: true } : {}) };
  const params = new URLSearchParams({
    ...selection, expires_at: `gt.${now}`, sources: `cs.${JSON.stringify(requiredSources)}`,
    order: "retrieved_at.desc,app_id.asc", limit: String(limit),
  });
  const records = await v2Database<MetadataSnapshot[]>(`v2_game_metadata?${params}`);
  return Array.isArray(records) ? records.filter(validSnapshot) : [];
}

const readRecentReportCards = unstable_cache(async () => {
  const now = Date.now();
  const snapshots = await listFreshReportSnapshots(new Date(now).toISOString(), { limit: 18, requireTagList: false });
  return recentReportCards(snapshots, now);
}, ["recent-assessed-games"], { revalidate: 300 });

export async function listRecentReportCards() {
  if (!enabled) return [];
  try {
    const cards = await readRecentReportCards();
    return cards.filter(({ expiresAt }) => expiresAt > Date.now());
  } catch {
    return [];
  }
}

const cache = createMetadataCache({
  ttlSeconds: positiveEnv(process.env.V2_METADATA_TTL_SECONDS, 7 * 24 * 60 * 60, 60 * 24 * 60 * 60),
  read: enabled ? readSnapshot : undefined,
  save: enabled ? (appId, record) => v2Database<boolean>("rpc/v2_save_metadata", {
    body: { p_app_id: appId, p_region: region, p_language: language, p_metadata: record.metadata,
      p_sources: record.sources, p_coverage: record.coverage,
      p_retrieved_at: record.retrieved_at, p_expires_at: record.expires_at },
  }) : undefined,
  load: async (appId) => {
    const { metadata, sources } = await inspectSteamGame(appId, { bypassMemoryCache: true });
    return { metadata,
      sources: { appdetails: sources.appdetails.available, getItems: sources.getItems.available, getTagList: sources.getTagList.available },
      failed: Boolean(sources.appdetails.error || sources.getItems.error),
    };
  },
});

export function getCachedSteamGame(appId: number, headers: Pick<Headers, "get">) {
  return cache(appId, () => allowV2Request("metadata", headers));
}

export async function recordReportView(appId: number) {
  if (!enabled) return;
  await v2Database("rpc/v2_increment_popularity", { body: { p_app_id: appId, p_region: region } }).catch(() => undefined);
}
