import { NextResponse } from "next/server";

import { gameTypeOptions, playStyleOptions } from "@/lib/filterOptions";
import { mapFiltersToTags, type FilterGroups } from "@/lib/mapFiltersToTags";

const STEAM_SEARCH_URL = "https://store.steampowered.com/search/results/";
const STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const STEAM_APP_HOVER_URL = "https://store.steampowered.com/apphoverpublic";
const STEAM_COUNTRY_CODE = "US";
const DEFAULT_LIMIT = 10;
const SEARCH_BATCH_SIZE = 50;
const MAX_BATCHES = 4;
const ALL_PLATFORMS = ["windows", "macos", "linux"] as const;

type PlatformKey = (typeof ALL_PLATFORMS)[number];

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

  if (selectedSort === "Release date descending" || selectedSort === "New releases") {
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

async function fetchAppDetails(appId: number, countryCode: string) {
  const params = new URLSearchParams({
    appids: String(appId),
    cc: countryCode,
    l: "english",
  });

  const response = await fetch(`${STEAM_APP_DETAILS_URL}?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SteamAppDetailsResponse;
  const details = payload[String(appId)];

  if (!details || !details.success) {
    return null;
  }

  return details.data;
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
    const selectedSort = searchParams.get("sort") ?? "New releases";
    const searchQuery = (searchParams.get("query") ?? "").trim();
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      DEFAULT_LIMIT,
    );
    const { gameTypeTags, hiddenTags } = mapFiltersToTags(filters);

    const matches: SteamSearchItem[] = [];
    const seenAppIds = new Set<number>();

    for (let batchIndex = 0; batchIndex < MAX_BATCHES; batchIndex += 1) {
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

    const acceptedGames: SteamGame[] = [];

    for (const match of matches) {
      if (acceptedGames.length >= limit) {
        break;
      }

        const details = await fetchAppDetails(match.appId, countryCode);
        const hoverTags = await fetchHoverTags(match.appId);

        if (details?.type && details.type !== "game") {
          continue;
        }

        if (matchesHiddenLabels(hoverTags, filters.hidden)) {
          continue;
        }

        if (!matchesPlayStyles(details?.categories, filters.playStyles)) {
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
          storeUrl: match.url.split("?")[0] ?? match.url,
        });
    }

    const games = sortGames(acceptedGames, selectedSort);

    return NextResponse.json({
      filters,
      platforms: selectedPlatforms,
      sort: selectedSort,
      countryCode,
      query: searchQuery,
      tags: {
        gameTypes: gameTypeTags,
        playStyles: filters.playStyles,
        hidden: hiddenTags,
      },
      total: games.length,
      games,
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
