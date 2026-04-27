import { createHash } from "crypto";

const DEFAULT_CACHE_TTL_SECONDS = 60 * 60 * 6;
const DEFAULT_CACHE_CLEANUP_SAMPLE_RATE = 0.02;

interface CacheRecord<TPayload> {
  cache_key: string;
  payload: TPayload;
  expires_at: string;
}

interface SteamResultsCacheConfig {
  anonOrServiceKey: string;
  cleanupSampleRate: number;
  tableName: string;
  ttlSeconds: number;
  url: string;
}

export type SteamResultsCacheStatus = "disabled" | "hit" | "miss" | "stale";

interface SteamResultsCacheResult<TPayload> {
  payload: TPayload | null;
  status: SteamResultsCacheStatus;
}

function getSteamResultsCacheConfig(): SteamResultsCacheConfig | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonOrServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tableName = process.env.SUPABASE_STEAM_CACHE_TABLE ?? "steam_results_cache";
  const ttlSeconds = Number.parseInt(
    process.env.STEAM_RESULTS_CACHE_TTL_SECONDS ?? String(DEFAULT_CACHE_TTL_SECONDS),
    10,
  );
  const cleanupSampleRate = Number.parseFloat(
    process.env.STEAM_RESULTS_CACHE_CLEANUP_SAMPLE_RATE ??
      String(DEFAULT_CACHE_CLEANUP_SAMPLE_RATE),
  );

  if (!url || !anonOrServiceKey) {
    return null;
  }

  return {
    anonOrServiceKey,
    cleanupSampleRate:
      Number.isFinite(cleanupSampleRate) && cleanupSampleRate >= 0
        ? Math.min(cleanupSampleRate, 1)
        : DEFAULT_CACHE_CLEANUP_SAMPLE_RATE,
    tableName,
    ttlSeconds: Number.isFinite(ttlSeconds) && ttlSeconds > 0
      ? ttlSeconds
      : DEFAULT_CACHE_TTL_SECONDS,
    url: url.replace(/\/$/, ""),
  };
}

function getCacheHeaders(config: SteamResultsCacheConfig) {
  return {
    apikey: config.anonOrServiceKey,
    Authorization: `Bearer ${config.anonOrServiceKey}`,
    "Content-Type": "application/json",
  };
}

export function createSteamResultsCacheKey(parts: Record<string, unknown>) {
  return createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex");
}

export async function readSteamResultsCache<TPayload>(
  cacheKey: string,
): Promise<SteamResultsCacheResult<TPayload>> {
  const config = getSteamResultsCacheConfig();

  if (!config) {
    return {
      payload: null,
      status: "disabled",
    };
  }

  const params = new URLSearchParams({
    select: "payload,expires_at",
    cache_key: `eq.${cacheKey}`,
    limit: "1",
  });

  try {
    const response = await fetch(
      `${config.url}/rest/v1/${config.tableName}?${params.toString()}`,
      {
        headers: getCacheHeaders(config),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Supabase cache read failed", response.status, await response.text());
      return {
        payload: null,
        status: "miss",
      };
    }

    const records = (await response.json()) as Array<CacheRecord<TPayload>>;
    const record = records[0];

    if (!record || Date.parse(record.expires_at) <= Date.now()) {
      return {
        payload: null,
        status: record ? "stale" : "miss",
      };
    }

    return {
      payload: record.payload,
      status: "hit",
    };
  } catch (error) {
    console.error("Supabase cache read failed", error);
    return {
      payload: null,
      status: "miss",
    };
  }
}

async function cleanupExpiredSteamResultsCache(config: SteamResultsCacheConfig) {
  const params = new URLSearchParams({
    expires_at: `lt.${new Date().toISOString()}`,
  });

  try {
    const response = await fetch(
      `${config.url}/rest/v1/${config.tableName}?${params.toString()}`,
      {
        method: "DELETE",
        headers: getCacheHeaders(config),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Supabase cache cleanup failed", response.status, await response.text());
    }
  } catch (error) {
    console.error("Supabase cache cleanup failed", error);
  }
}

export async function writeSteamResultsCache<TPayload>(
  cacheKey: string,
  payload: TPayload,
) {
  const config = getSteamResultsCacheConfig();

  if (!config) {
    return;
  }

  const expiresAt = new Date(Date.now() + config.ttlSeconds * 1000).toISOString();
  const params = new URLSearchParams({
    on_conflict: "cache_key",
  });

  try {
    const response = await fetch(
      `${config.url}/rest/v1/${config.tableName}?${params.toString()}`,
      {
        method: "POST",
        headers: {
          ...getCacheHeaders(config),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          cache_key: cacheKey,
          payload,
          expires_at: expiresAt,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Supabase cache write failed", response.status, await response.text());
      return;
    }

    if (Math.random() < config.cleanupSampleRate) {
      await cleanupExpiredSteamResultsCache(config);
    }
  } catch (error) {
    console.error("Supabase cache write failed", error);
  }
}
