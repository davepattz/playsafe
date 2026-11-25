import "server-only";

import { createMetadataCache } from "./metadataCache.ts";
import type { MetadataSnapshot } from "./metadataCache";
import { inspectSteamGame, STEAM_CONTEXT } from "./steamMetadata";
import { positiveEnv, v2Database, v2DatabaseConfigured } from "./v2Database";
import { allowV2Request } from "./v2RateLimit";

const region = STEAM_CONTEXT.country_code;
const language = STEAM_CONTEXT.language;
const enabled = v2DatabaseConfigured();
const cache = createMetadataCache({
  ttlSeconds: positiveEnv(process.env.V2_METADATA_TTL_SECONDS, 7 * 24 * 60 * 60, 60 * 24 * 60 * 60),
  read: enabled ? async (appId) => {
    const params = new URLSearchParams({
      select: "metadata,sources,coverage,retrieved_at,expires_at",
      app_id: `eq.${appId}`, region: `eq.${region}`, language: `eq.${language}`, limit: "1",
    });
    const records = await v2Database<MetadataSnapshot[]>(`v2_game_metadata?${params}`);
    const record = Array.isArray(records) ? records[0] : null;
    return record?.metadata?.appId === appId && record.metadata.appType === "game" && record.metadata.title
      && record.sources && record.coverage
      && Number.isFinite(Date.parse(record.retrieved_at)) && Number.isFinite(Date.parse(record.expires_at)) ? record : null;
  } : undefined,
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
