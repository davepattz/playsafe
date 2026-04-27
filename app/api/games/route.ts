import { NextResponse } from "next/server";

import { BAD_LANGUAGE_FILTER, badLanguageTerms } from "@/lib/badLanguageTerms";
import { gameTypeOptions, playStyleOptions } from "@/lib/filterOptions";
import { mapFiltersToTags, type FilterGroups } from "@/lib/mapFiltersToTags";
import { popularGames } from "@/lib/popularGames";
import {
  createSteamResultsCacheKey,
  readSteamResultsCache,
  type SteamResultsCacheStatus,
  writeSteamResultsCache,
} from "@/lib/steamResultsCache";

const STEAM_SEARCH_URL = "https://store.steampowered.com/search/results/";
const STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const STEAM_APP_HOVER_URL = "https://store.steampowered.com/apphoverpublic";
const STEAM_COUNTRY_CODE = "US";
const DEFAULT_LIMIT = 30;
const SEARCH_BATCH_SIZE = 50;
const DEFAULT_MAX_BATCHES = 4;
const FILTERED_MAX_BATCHES = 12;
const SEARCH_QUERY_MAX_BATCHES = 6;
const ALL_PLATFORMS = ["windows", "macos", "linux"] as const;
const POPULAR_GAMES_SOURCE_CACHE_KEY = "popular-games:v1";

type PlatformKey = (typeof ALL_PLATFORMS)[number];
type FeaturedKey = "popular" | "new-releases" | "all";
type PopularGameSource = (typeof popularGames)[number];

const SUPPORTED_STEAM_COUNTRIES = new Set([
  "AR", "AU", "AT", "BE", "BR", "BG", "CA", "CL", "CN", "CO", "CR", "HR",
  "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HK", "HU", "IS", "IN",
  "ID", "IE", "IL", "IT", "JP", "KZ", "KR", "KW", "LV", "LT", "LU", "MY",
  "MT", "MX", "ME", "NL", "NZ", "NO", "PE", "PH", "PL", "PT", "QA", "RO",
  "SA", "RS", "SG", "SK", "SI", "ZA", "ES", "SE", "CH", "TW", "TH", "TR",
  "UA", "AE", "GB", "US", "UY", "VN",
]);

interface SteamSearchItem {
  appId: number;
  title: string;
  capsuleImage: string;
  releaseDate: string;
  price: string;
  platforms: PlatformKey[];
  tagIds: number[];
  url: string;
}

interface SteamGame {
  id: number;
  name: string;
  imageUrl: string;
  shortDescription: string;
  platforms: PlatformKey[];
  price: string;
  releaseDate: string;
  storeUrl: string;
}

interface GamesResponse {
  filters: FilterGroups;
  page: number;
  hasMore: boolean;
  platforms: PlatformKey[];
  sort: string;
  featured: FeaturedKey;
  countryCode: string;
  query: string;
  tags: {
    gameTypes: number[];
    playStyles: string[];
    hidden: number[];
  };
  total: number;
  games: SteamGame[];
}

interface PopularGamesSourcePayload {
  games?: PopularGameSource[];
}

interface SteamAppDetailsSuccess {
  success: true;
  data: {
    type?: string;
    short_description?: string;
    categories?: Array<{
      id: number;
      description: string;
    }>;
    platforms?: {
      windows?: boolean;
      mac?: boolean;
      linux?: boolean;
    };
    release_date?: {
      date?: string;
    };
    price_overview?: {
      final_formatted?: string;
    };
    is_free?: boolean;
    header_image?: string;
    capsule_image?: string;
    name?: string;
  };
}

interface SteamAppDetailsFailure {
  success: false;
}

type SteamAppDetailsResponse = Record<string, SteamAppDetailsSuccess | SteamAppDetailsFailure>;

function logSteamResultsCacheStatus(status: SteamResultsCacheStatus) {
  if (process.env.NODE_ENV === "development") {
    console.info(`Steam results cache: ${status}`);
  }
}

function getMultiValue(searchParams: URLSearchParams, key: string) {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function getSelectedPlatforms(searchParams: URLSearchParams): PlatformKey[] {
  const selected = getMultiValue(searchParams, "platforms").filter(
    (value): value is PlatformKey =>
      ALL_PLATFORMS.includes(value as PlatformKey),
  );

  if (selected.length === 0) {
    return [...ALL_PLATFORMS];
  }

  return selected;
}

function getSelectedFeatured(searchParams: URLSearchParams): FeaturedKey {
  const featured = searchParams.get("featured");

  if (featured === "all" || featured === "new-releases") {
    return featured;
  }

  return "popular";
}

function getPopularFallbackPlatforms(platforms: string[]) {
  const fallbackPlatforms = platforms.filter((platform): platform is PlatformKey =>
    ALL_PLATFORMS.includes(platform as PlatformKey),
  );

  return fallbackPlatforms.length > 0 ? fallbackPlatforms : [...ALL_PLATFORMS];
}

function getCountryFromAcceptLanguage(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return null;
  }

  for (const locale of acceptLanguage.split(",")) {
    const regionMatch = locale.trim().match(/-(\w{2})\b/);

    if (!regionMatch) {
      continue;
    }

    const countryCode = regionMatch[1].toUpperCase();

    if (SUPPORTED_STEAM_COUNTRIES.has(countryCode)) {
      return countryCode;
    }
  }

  return null;
}

function getCountryFromTimeZone(timeZone: string | null) {
  if (!timeZone) {
    return null;
  }

  const normalizedTimeZone = timeZone.trim();

  if (normalizedTimeZone.startsWith("Australia/")) {
    return "AU";
  }

  if (normalizedTimeZone.startsWith("America/")) {
    return "US";
  }

  if (normalizedTimeZone === "Pacific/Auckland") {
    return "NZ";
  }

  if (normalizedTimeZone.startsWith("Europe/London")) {
    return "GB";
  }

  return null;
}

function getSteamCountryCode(request: Request, searchParams: URLSearchParams) {
  const headerCandidates = [
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
    request.headers.get("x-country-code"),
    request.headers.get("cloudfront-viewer-country"),
  ];

  for (const headerValue of headerCandidates) {
    const countryCode = headerValue?.toUpperCase();

    if (countryCode && SUPPORTED_STEAM_COUNTRIES.has(countryCode)) {
      return countryCode;
    }
  }

  const timeZoneCountry = getCountryFromTimeZone(searchParams.get("timezone"));

  if (timeZoneCountry) {
    return timeZoneCountry;
  }

  return getCountryFromAcceptLanguage(request.headers.get("accept-language")) ?? STEAM_COUNTRY_CODE;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTagLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeStoreUrl(url: string, appId: number) {
  try {
    const parsedUrl = new URL(url);

    parsedUrl.protocol = "https:";
    parsedUrl.hostname = "store.steampowered.com";
    parsedUrl.search = "";
    parsedUrl.hash = "";

    return parsedUrl.toString();
  } catch {
    return `https://store.steampowered.com/app/${appId}/`;
  }
}

function decodeSteamText(value: string) {
  return stripHtml(value.replace(/\\\//g, "/").replace(/\\"/g, '"'));
}

function parseTagIds(rawTagIds: string | undefined) {
  if (!rawTagIds) {
    return [];
  }

  return rawTagIds
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

function parsePlatforms(rawRow: string): PlatformKey[] {
  const platforms: PlatformKey[] = [];

  if (rawRow.includes("platform_img win")) {
    platforms.push("windows");
  }

  if (rawRow.includes("platform_img mac")) {
    platforms.push("macos");
  }

  if (rawRow.includes("platform_img linux")) {
    platforms.push("linux");
  }

  return platforms;
}

function parseSearchResults(resultsHtml: string): SteamSearchItem[] {
  const items: SteamSearchItem[] = [];
  const rowPattern = /<a href="([^"]+)"[\s\S]*?data-ds-appid="(\d+)"([\s\S]*?)<\/a>/g;

  for (const match of resultsHtml.matchAll(rowPattern)) {
    const [, url, appIdRaw, rowBody] = match;
    const titleMatch = rowBody.match(/<span class="title">([\s\S]*?)<\/span>/);
    const imageMatch = rowBody.match(/<img src="([^"]+)"/);
    const releaseMatch = rowBody.match(/<div class="search_released responsive_secondrow">\s*([\s\S]*?)\s*<\/div>/);
    const priceMatch = rowBody.match(/<div class="discount_final_price[^"]*">([\s\S]*?)<\/div>/);
    const tagIdsMatch = rowBody.match(/data-ds-tagids="\[([^\]]*)\]"/);

    if (!titleMatch || !imageMatch || !releaseMatch) {
      continue;
    }

    items.push({
      appId: Number.parseInt(appIdRaw, 10),
      title: decodeSteamText(titleMatch[1]),
      capsuleImage: decodeSteamText(imageMatch[1]),
      releaseDate: stripHtml(releaseMatch[1]),
      price: priceMatch ? stripHtml(priceMatch[1]) : "Unavailable",
      platforms: parsePlatforms(rowBody),
      tagIds: parseTagIds(tagIdsMatch?.[1]),
      url: decodeSteamText(url),
    });
  }

  return items;
}

function matchesPlatforms(gamePlatforms: PlatformKey[], selectedPlatforms: PlatformKey[]) {
  if (selectedPlatforms.length === ALL_PLATFORMS.length) {
    return true;
  }

  if (gamePlatforms.length === 0) {
    return false;
  }

  return selectedPlatforms.some((platform) => gamePlatforms.includes(platform));
}

function matchesAnySelectedTag(tagIds: number[], selectedTags: number[]) {
  if (selectedTags.length === 0) {
    return true;
  }

  return selectedTags.some((tagId) => tagIds.includes(tagId));
}

function matchesExcludedTags(tagIds: number[], excludedTags: number[]) {
  return !excludedTags.some((tagId) => tagIds.includes(tagId));
}

function matchesPlayStyles(
  categories: Array<{ id: number; description: string }> | undefined,
  selectedPlayStyles: string[],
) {
  if (selectedPlayStyles.length === 0) {
    return true;
  }

  if (!categories || categories.length === 0) {
    return false;
  }

  const normalizedCategories = new Set(
    categories.map((category) => normalizeTagLabel(category.description)),
  );

  return selectedPlayStyles.some((playStyle) =>
    normalizedCategories.has(normalizeTagLabel(playStyle)),
  );
}

function matchesSearchQuery(title: string, searchQuery: string) {
  if (!searchQuery) {
    return true;
  }

  const normalizedTitle = normalizeSearchText(title);
  const queryTerms = normalizeSearchText(searchQuery)
    .split(" ")
    .filter(Boolean);

  if (queryTerms.length === 0) {
    return true;
  }

  return queryTerms.every((term) => normalizedTitle.includes(term));
}

function parsePriceValue(price: string) {
  if (price.toLowerCase() === "free") {
    return 0;
  }

  const numericValue = Number.parseFloat(price.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : Number.POSITIVE_INFINITY;
}

function parseReleaseDateValue(releaseDate: string) {
  const parsedValue = Date.parse(releaseDate);

  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function sortGames(games: SteamGame[], selectedSort: string) {
  if (selectedSort === "Title A-Z") {
    return [...games].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (selectedSort === "Title Z-A") {
    return [...games].sort((a, b) => b.name.localeCompare(a.name));
  }

  if (selectedSort === "Price low to high") {
    return [...games].sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
  }

  if (selectedSort === "Price high to low") {
    return [...games].sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
  }

  if (selectedSort === "Release date ascending") {
    return [...games].sort((a, b) => parseReleaseDateValue(a.releaseDate) - parseReleaseDateValue(b.releaseDate));
  }

  if (selectedSort === "Release date descending" || selectedSort === "Newest releases") {
    return [...games].sort((a, b) => parseReleaseDateValue(b.releaseDate) - parseReleaseDateValue(a.releaseDate));
  }

  return games;
}

async function fetchSearchBatch(start: number, searchQuery: string, countryCode: string) {
  const params = new URLSearchParams({
    term: searchQuery,
    start: String(start),
    count: String(SEARCH_BATCH_SIZE),
    cc: countryCode,
    dynamic_data: "",
    sort_by: "Released_DESC",
    supportedlang: "english",
    infinite: "1",
    ignore_preferences: "1",
    ndl: "1",
  });

  const response = await fetch(`${STEAM_SEARCH_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Steam search failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    results_html?: string;
  };

  return parseSearchResults(payload.results_html ?? "");
}

async function fetchAppDetails(appId: number, countryCode: string, bypassCache = false) {
  const params = new URLSearchParams({
    appids: String(appId),
    cc: countryCode,
    l: "english",
  });

  const response = await fetch(`${STEAM_APP_DETAILS_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    ...(bypassCache ? { cache: "no-store" as const } : { next: { revalidate: 3600 } }),
  });

  if (!response.ok) {
    return null;
  }

  let payload: SteamAppDetailsResponse;

  try {
    payload = (await response.json()) as SteamAppDetailsResponse;
  } catch {
    return null;
  }

  const details = payload[String(appId)];

  if (!details || !details.success) {
    return null;
  }

  return details.data;
}

async function fetchAppDetailsBatch(appIds: number[], countryCode: string) {
  const params = new URLSearchParams({
    appids: appIds.join(","),
    cc: countryCode,
    l: "english",
  });

  const response = await fetch(`${STEAM_APP_DETAILS_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return new Map<number, SteamAppDetailsSuccess["data"]>();
  }

  let payload: SteamAppDetailsResponse;

  try {
    payload = (await response.json()) as SteamAppDetailsResponse;
  } catch {
    return new Map<number, SteamAppDetailsSuccess["data"]>();
  }

  const detailsByAppId = new Map<number, SteamAppDetailsSuccess["data"]>();

  appIds.forEach((appId) => {
    const details = payload[String(appId)];

    if (details?.success) {
      detailsByAppId.set(appId, details.data);
    }
  });

  return detailsByAppId;
}

async function fetchHoverTags(appId: number) {
  const params = new URLSearchParams({
    l: "english",
  });

  const response = await fetch(`${STEAM_APP_HOVER_URL}/${appId}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const tagPattern = /<div class="app_tag">([\s\S]*?)<\/div>/g;

  return Array.from(html.matchAll(tagPattern), (match) => stripHtml(match[1]));
}

function matchesHiddenLabels(hoverTags: string[], hiddenLabels: string[]) {
  if (hiddenLabels.length === 0) {
    return false;
  }

  const normalizedHoverTags = new Set(hoverTags.map(normalizeTagLabel));

  return hiddenLabels.some((label) =>
    normalizedHoverTags.has(normalizeTagLabel(label)),
  );
}

function matchesSelectedLabels(hoverTags: string[], selectedLabels: string[]) {
  if (selectedLabels.length === 0) {
    return true;
  }

  const normalizedHoverTags = new Set(hoverTags.map(normalizeTagLabel));

  return selectedLabels.some((label) => {
    const normalizedLabel = normalizeTagLabel(label);

    return Array.from(normalizedHoverTags).some(
      (hoverTag) =>
        hoverTag === normalizedLabel ||
        hoverTag.includes(normalizedLabel) ||
        normalizedLabel.includes(hoverTag),
    );
  });
}

function containsBadLanguage(value: string) {
  if (!value) {
    return false;
  }

  return badLanguageTerms.some((term) => {
    const normalizedTerm = normalizeTagLabel(term);

    if (!normalizedTerm) {
      return false;
    }

    const dottedLetterPattern = term.includes(".")
      ? new RegExp(
          `(?:^|[^a-z0-9])${normalizedTerm
            .split("")
            .map((character) => `${escapeRegExp(character)}[^a-z0-9]*`)
            .join("")}(?:$|[^a-z0-9])`,
          "i",
        )
      : null;
    const pattern = new RegExp(`\\b${escapeRegExp(normalizedTerm)}(?:s|ed|ing)?\\b`, "i");

    return pattern.test(value) || Boolean(dottedLetterPattern?.test(value));
  });
}

function needsHoverTagCheck(hiddenLabels: string[]) {
  return hiddenLabels.some((label) => label === BAD_LANGUAGE_FILTER || label === "Horror");
}

function hasPriceAndReleaseDate(details: SteamAppDetailsSuccess["data"] | undefined) {
  return Boolean(
    details &&
      (details.is_free || details.price_overview?.final_formatted) &&
      details.release_date?.date,
  );
}

function isPopularGameSource(value: unknown): value is PopularGameSource {
  if (!value || typeof value !== "object") {
    return false;
  }

  const game = value as Partial<PopularGameSource>;

  return (
    typeof game.appId === "number" &&
    typeof game.name === "string" &&
    typeof game.releaseDate === "string" &&
    typeof game.priceLabel === "string" &&
    Array.isArray(game.platforms) &&
    game.platforms.every((platform) => typeof platform === "string")
  );
}

async function getPopularGamesSource() {
  const cachedSource = await readSteamResultsCache<PopularGamesSourcePayload>(
    POPULAR_GAMES_SOURCE_CACHE_KEY,
  );
  const sourceGames = cachedSource.payload?.games?.filter(isPopularGameSource) ?? [];

  if (sourceGames.length > 0) {
    if (process.env.NODE_ENV === "development") {
      console.info(`Popular games source: supabase (${sourceGames.length})`);
    }

    return sourceGames;
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`Popular games source: local fallback (${popularGames.length})`);
  }

  return popularGames;
}

async function fetchPopularGames(
  countryCode: string,
  selectedPlatforms: PlatformKey[],
  filters: FilterGroups,
  applyFilters: boolean,
  popularGamesSource: PopularGameSource[],
) {
  const acceptedGames: SteamGame[] = [];
  const hideBadLanguage = applyFilters && filters.hidden.includes(BAD_LANGUAGE_FILTER);
  const shouldFetchHoverTags =
    applyFilters && (filters.gameTypes.length > 0 || filters.hidden.length > 0);
  const detailsByAppId = await fetchAppDetailsBatch(
    popularGamesSource.map((game) => game.appId),
    countryCode,
  );

  for (const popularGame of popularGamesSource) {
    const appId = popularGame.appId;
    let details = detailsByAppId.get(appId);

    if (!hasPriceAndReleaseDate(details)) {
      details = (await fetchAppDetails(appId, countryCode, true)) ?? details;
    }

    if (details?.type && details.type !== "game") {
      continue;
    }

    const detailPlatforms: PlatformKey[] = [];

    if (details?.platforms?.windows) {
      detailPlatforms.push("windows");
    }

    if (details?.platforms?.mac) {
      detailPlatforms.push("macos");
    }

    if (details?.platforms?.linux) {
      detailPlatforms.push("linux");
    }

    const platforms =
      detailPlatforms.length > 0
        ? detailPlatforms
        : getPopularFallbackPlatforms(popularGame.platforms);

    if (!matchesPlatforms(platforms, selectedPlatforms)) {
      continue;
    }

    const hoverTags = shouldFetchHoverTags ? await fetchHoverTags(appId) : [];

    if (applyFilters && !matchesSelectedLabels(hoverTags, filters.gameTypes)) {
      continue;
    }

    if (applyFilters && matchesHiddenLabels(hoverTags, filters.hidden)) {
      continue;
    }

    if (applyFilters && details && !matchesPlayStyles(details.categories, filters.playStyles)) {
      continue;
    }

    if (
      hideBadLanguage &&
      (containsBadLanguage(details?.name ?? popularGame.name) ||
        containsBadLanguage(details?.short_description ?? ""))
    ) {
      continue;
    }

    acceptedGames.push({
      id: appId,
      name: details?.name ?? popularGame.name,
      imageUrl:
        details?.header_image ??
        details?.capsule_image ??
        `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
      shortDescription: details?.short_description ?? "",
      platforms,
      price:
        details?.is_free
          ? "Free"
          : details?.price_overview?.final_formatted ?? popularGame.priceLabel,
      releaseDate: details?.release_date?.date ?? popularGame.releaseDate,
      storeUrl: `https://store.steampowered.com/app/${appId}/`,
    });
  }

  return acceptedGames;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = getSteamCountryCode(request, searchParams);
    const rawFilters: FilterGroups = {
      gameTypes: getMultiValue(searchParams, "gameTypes"),
      playStyles: getMultiValue(searchParams, "playStyles"),
      hidden: getMultiValue(searchParams, "hidden"),
    };
    const filters: FilterGroups = {
      gameTypes:
        rawFilters.gameTypes.length >= gameTypeOptions.length ? [] : rawFilters.gameTypes,
      playStyles:
        rawFilters.playStyles.length >= playStyleOptions.length ? [] : rawFilters.playStyles,
      hidden: rawFilters.hidden,
    };
    const selectedPlatforms = getSelectedPlatforms(searchParams);
    const selectedSort = searchParams.get("sort") ?? "Release date descending";
    const selectedFeatured = getSelectedFeatured(searchParams);
    const searchQuery = (searchParams.get("query") ?? "").trim();
    const applyPopularFilters = searchParams.get("applyPopularFilters") === "true";
    const refreshCache = searchParams.get("refreshCache") === "true";
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      DEFAULT_LIMIT,
    );
    const page = Math.max(
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
      1,
    );
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const targetAcceptedCount = endIndex + limit;
    const { gameTypeTags, hiddenTags } = mapFiltersToTags(filters);
    const isPopularRequest = selectedFeatured === "popular" && searchQuery.length === 0;
    const hasActiveFilters =
      filters.gameTypes.length > 0 ||
      filters.playStyles.length > 0 ||
      filters.hidden.length > 0 ||
      selectedPlatforms.length > 0 ||
      searchQuery.length > 0;
    const maxBatches = searchQuery.length > 0
      ? SEARCH_QUERY_MAX_BATCHES
      : hasActiveFilters
        ? FILTERED_MAX_BATCHES
        : DEFAULT_MAX_BATCHES;
    const popularGamesSource = isPopularRequest ? await getPopularGamesSource() : [];
    const cacheKey = createSteamResultsCacheKey({
      applyPopularFilters,
      countryCode,
      filters,
      limit,
      page,
      featured: selectedFeatured,
      platforms: selectedPlatforms,
      popularGamesSource: isPopularRequest ? popularGamesSource : undefined,
      query: searchQuery,
      sort: selectedSort,
    });

    if (!refreshCache) {
      const cachedResult = await readSteamResultsCache<GamesResponse>(cacheKey);

      logSteamResultsCacheStatus(cachedResult.status);

      if (cachedResult.payload) {
        return NextResponse.json(cachedResult.payload, {
          headers: {
            "x-playsafe-cache": "hit",
          },
        });
      }
    } else {
      logSteamResultsCacheStatus("miss");
    }

    const acceptedGames: SteamGame[] = isPopularRequest
      ? await fetchPopularGames(
          countryCode,
          selectedPlatforms,
          filters,
          applyPopularFilters,
          popularGamesSource,
        )
      : [];

    if (!isPopularRequest) {
      const matches: SteamSearchItem[] = [];
      const seenAppIds = new Set<number>();

      for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
        const start = batchIndex * SEARCH_BATCH_SIZE;
        const items = await fetchSearchBatch(start, searchQuery, countryCode);

        if (items.length === 0) {
          break;
        }

        for (const item of items) {
          if (seenAppIds.has(item.appId)) {
            continue;
          }

          seenAppIds.add(item.appId);

          if (!matchesSearchQuery(item.title, searchQuery)) {
            continue;
          }

          if (!matchesPlatforms(item.platforms, selectedPlatforms)) {
            continue;
          }

          if (!matchesAnySelectedTag(item.tagIds, gameTypeTags)) {
            continue;
          }

          if (!matchesExcludedTags(item.tagIds, hiddenTags)) {
            continue;
          }

          matches.push(item);
        }
      }

      const hideBadLanguage = filters.hidden.includes(BAD_LANGUAGE_FILTER);
      const shouldFetchHoverTags = needsHoverTagCheck(filters.hidden);

      for (const match of matches) {
        if (acceptedGames.length >= targetAcceptedCount) {
          break;
        }

        const details = await fetchAppDetails(match.appId, countryCode);
        const hoverTags = shouldFetchHoverTags ? await fetchHoverTags(match.appId) : [];

        if (details?.type && details.type !== "game") {
          continue;
        }

        if (shouldFetchHoverTags && matchesHiddenLabels(hoverTags, filters.hidden)) {
          continue;
        }

        if (!matchesPlayStyles(details?.categories, filters.playStyles)) {
          continue;
        }

        if (
          hideBadLanguage &&
          (containsBadLanguage(details?.name ?? match.title) ||
            containsBadLanguage(details?.short_description ?? ""))
        ) {
          continue;
        }

        const detailPlatforms: PlatformKey[] = [];

        if (details?.platforms?.windows) {
          detailPlatforms.push("windows");
        }

        if (details?.platforms?.mac) {
          detailPlatforms.push("macos");
        }

        if (details?.platforms?.linux) {
          detailPlatforms.push("linux");
        }

        acceptedGames.push({
          id: match.appId,
          name: details?.name ?? match.title,
          imageUrl: details?.header_image ?? details?.capsule_image ?? match.capsuleImage,
          shortDescription: details?.short_description ?? "",
          platforms: detailPlatforms.length > 0 ? detailPlatforms : match.platforms,
          price: details?.is_free ? "Free" : details?.price_overview?.final_formatted ?? match.price,
          releaseDate: details?.release_date?.date ?? match.releaseDate,
          storeUrl: normalizeStoreUrl(match.url, match.appId),
        });
      }
    }

    const sortedGames = sortGames(acceptedGames, selectedSort);
    const games = sortedGames.slice(startIndex, endIndex);
    const hasMore = sortedGames.length > endIndex;
    const payload: GamesResponse = {
      filters,
      page,
      hasMore,
      platforms: selectedPlatforms,
      sort: selectedSort,
      featured: selectedFeatured,
      countryCode,
      query: searchQuery,
      tags: {
        gameTypes: gameTypeTags,
        playStyles: filters.playStyles,
        hidden: hiddenTags,
      },
      total: sortedGames.length,
      games,
    };

    await writeSteamResultsCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: {
        "x-playsafe-cache": "miss",
      },
    });
  } catch (error) {
    console.error("Failed to fetch Steam games", error);

    return NextResponse.json(
      {
        error: "Failed to fetch games from Steam.",
        games: [],
      },
      { status: 500 },
    );
  }
}
