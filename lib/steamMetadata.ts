import "server-only";

import { STEAM_APP_DETAILS_URL, STEAM_REQUEST_HEADERS, STEAM_STORE } from "./steamStore";
import { GAME_SEARCH_MIN_LENGTH, normalizeGameQuery, rankGameTitles, steamArtworkUrl } from "./gameSearch";

export const STEAM_CONTEXT = { country_code: "AU", language: "english" } as const;
const WEB_API = "https://api.steampowered.com";

type JsonObject = Record<string, unknown>;
type Feature = { id: number; name: string };
type Tag = { id: number; name: string | null; weight: number | null };
type Rating = { authority: string; rating: string; descriptors: string | null };
export type SteamClassification = Rating & { generated?: boolean };
type Evidence = { id: number | null; name: string };
const STORE_GAME_TYPE = 0;
export type SteamSuggestion = { appId: number; title: string; capsuleImage?: string; releaseYear?: number; platforms?: string[] };
export type SteamGameMetadata = {
  appId: number;
  title: string | null;
  appType: string | null;
  isFree?: boolean;
  headerImage: string | null;
  capsuleImage: string | null;
  shortDescription: string | null;
  tags: Tag[] | null;
  genres: Feature[] | null;
  platforms: string[] | null;
  downloadableContent: true | null;
  categories: Feature[] | null;
  classifications: Rating[] | null;
  reportedClassifications?: SteamClassification[];
  australianClassification: Rating | null;
  steamAustralianRating: Rating | null;
  contentDescriptors: { ids: number[] | null; notes: string | null } | null;
  developerMatureDisclosure: string | null;
  multiplayer: Evidence[] | null;
  inAppPurchases: true | null;
  workshop: true | null;
  releaseDate: string | null;
  comingSoon: boolean | null;
  storeUrl: string;
};

function object(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function string(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function steamPlatforms(value: unknown) {
  const flags = object(value);
  const platforms = [["windows", "Windows"], ["mac", "macOS"], ["linux", "Linux"]]
    .filter(([name]) => flags?.[name] === true).map(([, label]) => label);
  return platforms.length ? platforms : null;
}

function number(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return typeof value === "string" && /^\d+$/.test(value) ? Number(value) : null;
}

function entries<T>(value: unknown, map: (entry: JsonObject) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const mapped = value.flatMap((item) => {
    const entry = object(item);
    const result = entry ? map(entry) : null;
    return result === null ? [] : [result];
  });
  return mapped.length ? mapped : null;
}

function features(value: unknown) {
  return entries(value, (entry) => {
    const id = number(entry.id);
    const name = string(entry.description);
    return id === null || !name ? null : { id, name };
  });
}

export class SteamRequestError extends Error {
  readonly reason: "timeout" | "network" | "http" | "invalid";
  readonly status?: number;

  constructor(reason: SteamRequestError["reason"], status?: number) {
    super(status ? `Steam returned HTTP ${status}` : `Steam request failed (${reason})`);
    this.reason = reason;
    this.status = status;
  }
}

type SteamResponse = { data: unknown; status: number; elapsedMs: number; cached: boolean };
export function steamSearchErrorResponse(error: unknown) {
  const timeout = error instanceof SteamRequestError && error.reason === "timeout";
  const upstreamLimited = error instanceof SteamRequestError && error.status === 429;
  return Response.json({
    error: timeout ? "Steam search timed out. Try again."
      : upstreamLimited ? "Steam is limiting searches. Try again in a moment."
      : "Steam search is unavailable. Try again.",
  }, {
    status: timeout ? 504 : upstreamLimited ? 503 : 502,
    headers: { "Cache-Control": "no-store", ...(upstreamLimited ? { "Retry-After": "60" } : {}) },
  });
}

const cache = new Map<string, { expires: number; result: SteamResponse }>();

async function request(url: URL, ttlMs: number, validate: (result: unknown) => boolean, bypassMemoryCache = false): Promise<SteamResponse> {
  const key = url.href;
  const previous = cache.get(key);
  if (!bypassMemoryCache && previous && previous.expires > Date.now()) return { ...previous.result, cached: true };
  const started = performance.now();
  const signal = AbortSignal.timeout(4500);
  try {
    const response = await fetch(url, { headers: STEAM_REQUEST_HEADERS, signal, cache: "no-store", redirect: "error" });
    if (!response.ok) throw new SteamRequestError("http", response.status);
    const data: unknown = await response.json();
    const result = { data, status: response.status, elapsedMs: Math.round(performance.now() - started), cached: false };
    if (validate(data)) {
      cache.delete(key);
      if (cache.size >= 256) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(key, { expires: Date.now() + ttlMs, result });
    }
    return result;
  } catch (error) {
    if (error instanceof SteamRequestError) throw error;
    if (signal.aborted) throw new SteamRequestError("timeout");
    throw new SteamRequestError(error instanceof SyntaxError ? "invalid" : "network");
  }
}

function storeUrl(path: string, params: Record<string, string>) {
  const url = new URL(path, STEAM_STORE);
  url.search = new URLSearchParams({ ...params, cc: STEAM_CONTEXT.country_code, l: STEAM_CONTEXT.language }).toString();
  return url;
}

function webUrl(method: string, payload: JsonObject) {
  const url = new URL(method + "/v1/", WEB_API);
  url.searchParams.set("input_json", JSON.stringify(payload));
  return url;
}

export async function searchSteamGames(query: string): Promise<SteamSuggestion[]> {
  const term = normalizeGameQuery(query);
  if (term.length < GAME_SEARCH_MIN_LENGTH) return [];
  const result = await request(storeUrl("/api/storesearch/", { term }), 60_000, (data) => Array.isArray(object(data)?.items));
  const items = object(result.data)?.items;
  if (!Array.isArray(items)) throw new SteamRequestError("invalid");
  const unique = new Map<number, SteamSuggestion>();
  for (const item of items) {
    const row = object(item);
    const appId = number(row?.id);
    const title = string(row?.name);
    if (row?.type !== "app" || appId === null || !Number.isSafeInteger(appId) || appId <= 0 || appId > 0xffffffff || !title) continue;
    const capsuleImage = string(row.tiny_image);
    const platforms = steamPlatforms(row.platforms) ?? undefined;
    unique.set(appId, {
      appId, title, platforms,
      capsuleImage: steamArtworkUrl(capsuleImage),
    });
    if (unique.size === 16) break;
  }
  if (!unique.size) return [];
  const verified = await request(browseItemsUrl([...unique.keys()], { include_release: true }), 5 * 60_000,
    (data) => Boolean(browseItems(data)));
  const candidates = browseItems(verified.data);
  if (!candidates) throw new SteamRequestError("invalid");
  const games = new Map(candidates.filter(isStoreGame).map((item) => [number(item.appid), item]));
  const playable = [...unique.values()].flatMap((suggestion) => {
    const item = games.get(suggestion.appId);
    if (!item) return [];
    const timestamp = number(object(item.release)?.steam_release_date);
    const year = timestamp && timestamp > 0 ? new Date(timestamp * 1000).getUTCFullYear() : null;
    return [{ ...suggestion, releaseYear: year && Number.isFinite(year) ? year : undefined }];
  });
  return rankGameTitles(playable, term).slice(0, 8);
}

function browseItemsUrl(appIds: number[], dataRequest: JsonObject) {
  return webUrl("/IStoreBrowseService/GetItems", {
    ids: appIds.map((appid) => ({ appid })),
    context: STEAM_CONTEXT,
    data_request: dataRequest,
  });
}

function browseItems(data: unknown) {
  const items = object(object(data)?.response)?.store_items;
  return Array.isArray(items) ? items.flatMap((item) => {
    const row = object(item);
    return row ? [row] : [];
  }) : undefined;
}

function isStoreGame(item: JsonObject) {
  return item.success === 1 && item.item_type === 0 && item.type === STORE_GAME_TYPE && item.visible !== false;
}

function itemFor(data: unknown, appId: number) {
  return browseItems(data)?.find((entry) => number(entry.appid) === appId && (entry.success === undefined || entry.success === 1));
}

function detailsFor(data: unknown, appId: number) {
  const envelope = object(object(data)?.[String(appId)]);
  return envelope?.success === true ? object(envelope.data) : undefined;
}

function classifications(details: JsonObject | undefined, item: JsonObject | undefined) {
  const ratings = new Map<string, Rating>();
  const reported: SteamClassification[] = [];
  const add = (authority: string, value: unknown, fromDetails = false) => {
    const row = object(value);
    const rating = string(row?.rating);
    const descriptors = string(row?.descriptors);
    if (rating) ratings.set(authority.toLowerCase(), { authority, rating, descriptors });
    const displayRating = rating ?? (typeof row?.rating === "number" && Number.isFinite(row.rating) ? String(row.rating) : null);
    if (!displayRating || !authority.trim()) return;
    const flag = row?.rating_generated;
    const generated = flag === true || flag === 1 || flag === "1" || flag === "true"
      ? true
      : flag === false || flag === 0 || flag === "0" || flag === "false" || (flag == null && fromDetails)
        ? false : undefined;
    reported.push({ authority, rating: displayRating, descriptors, generated });
  };
  const browseRating = object(item?.game_rating);
  const type = string(browseRating?.type);
  if (type) add(type, browseRating);
  for (const [authority, rating] of Object.entries(object(details?.ratings) ?? {})) add(authority, rating, true);
  return { ratings: ratings.size ? [...ratings.values()] : null, reported };
}

function localizedTags(data: unknown) {
  const tags = object(object(data)?.response)?.tags;
  const names = new Map<number, string>();
  if (!Array.isArray(tags)) return names;
  for (const value of tags) {
    const tag = object(value);
    const id = number(tag?.tagid);
    const name = string(tag?.name);
    if (id !== null && name) names.set(id, name);
  }
  return names;
}

export function normalizeSteamMetadata(appId: number, detailsRaw: unknown, browseRaw: unknown, tagsRaw?: unknown): SteamGameMetadata {
  const details = detailsFor(detailsRaw, appId);
  const item = itemFor(browseRaw, appId);
  const categories = features(details?.categories);
  const { ratings, reported } = classifications(details, item);
  const content = object(details?.content_descriptors);
  const ids = Array.isArray(content?.ids) ? content.ids.filter((id): id is number => Number.isInteger(id)) : [];
  const notes = string(content?.notes);
  const release = object(details?.release_date);
  const browseCategories = object(item?.categories);
  const browseFeatures = Array.isArray(browseCategories?.feature_categoryids) ? browseCategories.feature_categoryids : [];
  const multiplayer = categories?.filter(({ name }) => /multi.player|co.op|pvp/i.test(name));
  const names = localizedTags(tagsRaw);
  return {
    appId,
    title: string(details?.name) ?? string(item?.name),
    appType: string(details?.type) ?? (item && isStoreGame(item) ? "game" : null),
    isFree: typeof details?.is_free === "boolean" ? details.is_free : undefined,
    headerImage: string(details?.header_image),
    capsuleImage: string(details?.capsule_image),
    shortDescription: string(details?.short_description) ?? string(object(item?.basic_info)?.short_description),
    tags: entries(item?.tags, (tag) => {
      const id = number(tag.tagid);
      return id === null ? null : { id, name: string(tag.name) ?? names.get(id) ?? null, weight: number(tag.weight) };
    }),
    genres: features(details?.genres),
    platforms: steamPlatforms(details?.platforms),
    downloadableContent: Array.isArray(details?.dlc) && details.dlc.some((id) => Number.isInteger(id)) ? true : null,
    categories,
    classifications: ratings,
    reportedClassifications: reported,
    australianClassification: ratings?.find(({ authority }) => /^(acb|oflc)$/i.test(authority)) ?? null,
    steamAustralianRating: ratings?.find(({ authority }) => /^steam_australia$/i.test(authority)) ?? null,
    contentDescriptors: ids.length || notes ? { ids: ids.length ? ids : null, notes } : null,
    developerMatureDisclosure: notes,
    multiplayer: multiplayer?.length ? multiplayer : null,
    inAppPurchases: browseFeatures.includes(35) || categories?.some(({ id }) => id === 35) ? true : null,
    workshop: browseFeatures.includes(30) || browseFeatures.includes(51) || categories?.some(({ id }) => id === 30 || id === 51) ? true : null,
    releaseDate: string(release?.date),
    comingSoon: typeof release?.coming_soon === "boolean" ? release.coming_soon : null,
    storeUrl: `${STEAM_STORE}/app/${appId}/`,
  };
}

export async function inspectSteamGame(appId: number, { bypassMemoryCache = false } = {}) {
  if (!Number.isSafeInteger(appId) || appId < 1 || appId > 0xffffffff) {
    throw new RangeError("Invalid Steam app ID");
  }
  const detailsUrl = storeUrl(STEAM_APP_DETAILS_URL, { appids: String(appId) });
  const browseUrl = browseItemsUrl([appId], {
    include_assets: true, include_basic_info: true, include_tag_count: 20, include_release: true, include_game_rating: true,
  });
  const ttl = 30 * 60_000;
  const tagsUrl = webUrl("/IStoreService/GetTagList", { language: STEAM_CONTEXT.language });
  const [appdetails, getItems, getTagList] = await Promise.allSettled([
    request(detailsUrl, ttl, (data) => Boolean(detailsFor(data, appId)), bypassMemoryCache),
    request(browseUrl, ttl, (data) => Boolean(itemFor(data, appId)), bypassMemoryCache),
    request(tagsUrl, 24 * 60 * 60_000, (data) => localizedTags(data).size > 0),
  ]);
  const detailsRaw = appdetails.status === "fulfilled" ? appdetails.value.data : null;
  const browseRaw = getItems.status === "fulfilled" ? getItems.value.data : null;
  const tagsRaw = getTagList.status === "fulfilled" ? getTagList.value.data : null;
  function diagnostic(result: PromiseSettledResult<SteamResponse>, available: boolean) {
    if (result.status === "fulfilled") return { ...result.value, available };
    const error = result.reason;
    return {
      available: false,
      status: error instanceof SteamRequestError ? error.status : undefined,
      error: error instanceof SteamRequestError ? error.message : "Steam request failed",
    };
  }
  return {
    context: STEAM_CONTEXT,
    metadata: normalizeSteamMetadata(appId, detailsRaw, browseRaw, tagsRaw),
    sources: {
      appdetails: diagnostic(appdetails, Boolean(detailsFor(detailsRaw, appId))),
      getItems: diagnostic(getItems, Boolean(itemFor(browseRaw, appId))),
      getTagList: diagnostic(getTagList, localizedTags(tagsRaw).size > 0),
    },
  };
}
