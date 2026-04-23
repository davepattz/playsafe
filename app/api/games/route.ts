import { NextResponse } from "next/server";

import { gameTypeOptions, playStyleOptions } from "@/lib/filterOptions";
import { mapFiltersToTags, type FilterGroups } from "@/lib/mapFiltersToTags";

const STEAM_SEARCH_URL = "https://store.steampowered.com/search/results/";
const STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const DEFAULT_LIMIT = 10;
const SEARCH_BATCH_SIZE = 50;
const MAX_BATCHES = 4;
const ALL_PLATFORMS = ["windows", "macos", "linux"] as const;

type PlatformKey = (typeof ALL_PLATFORMS)[number];

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
  capsuleImage: string;
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

function matchesIncludedTags(tagIds: number[], includeTags: number[]) {
  if (includeTags.length === 0) {
    return true;
  }

  return includeTags.every((tagId) => tagIds.includes(tagId));
}

function matchesExcludedTags(tagIds: number[], excludeTags: number[]) {
  return !excludeTags.some((tagId) => tagIds.includes(tagId));
}

function matchesSearchQuery(title: string, searchQuery: string) {
  if (!searchQuery) {
    return true;
  }

  return title.toLowerCase().includes(searchQuery.toLowerCase());
}

function parsePriceValue(price: string) {
  if (price.toLowerCase() === "free") {
    return 0;
  }

  const numericValue = Number.parseFloat(price.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : Number.POSITIVE_INFINITY;
}

function sortGames(games: SteamGame[], selectedSort: string) {
  if (selectedSort === "Price low to high") {
    return [...games].sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
  }

  if (selectedSort === "Price high to low") {
    return [...games].sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price));
  }

  return games;
}

async function fetchSearchBatch(start: number) {
  const params = new URLSearchParams({
    query: "",
    start: String(start),
    count: String(SEARCH_BATCH_SIZE),
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

async function fetchAppDetails(appId: number) {
  const params = new URLSearchParams({
    appids: String(appId),
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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
    const selectedSort = searchParams.get("sort") ?? "Popular new releases";
    const searchQuery = (searchParams.get("query") ?? "").trim();
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      DEFAULT_LIMIT,
    );
    const { includeTags, excludeTags } = mapFiltersToTags(filters);

    const matches: SteamSearchItem[] = [];
    const seenAppIds = new Set<number>();

    for (let batchIndex = 0; batchIndex < MAX_BATCHES && matches.length < limit; batchIndex += 1) {
      const start = batchIndex * SEARCH_BATCH_SIZE;
      const items = await fetchSearchBatch(start);

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

        if (!matchesIncludedTags(item.tagIds, includeTags)) {
          continue;
        }

        if (!matchesExcludedTags(item.tagIds, excludeTags)) {
          continue;
        }

        matches.push(item);

        if (matches.length >= limit) {
          break;
        }
      }
    }

    const detailedGames = await Promise.all(
      matches.slice(0, limit).map(async (match) => {
        const details = await fetchAppDetails(match.appId);

        if (details?.type && details.type !== "game") {
          return null;
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

        const game: SteamGame = {
          id: match.appId,
          name: details?.name ?? match.title,
          capsuleImage: details?.capsule_image ?? match.capsuleImage,
          shortDescription: details?.short_description ?? "",
          platforms: detailPlatforms.length > 0 ? detailPlatforms : match.platforms,
          price: details?.is_free ? "Free" : details?.price_overview?.final_formatted ?? match.price,
          releaseDate: details?.release_date?.date ?? match.releaseDate,
          storeUrl: match.url.split("?")[0] ?? match.url,
        };

        return game;
      }),
    );

    const games = sortGames(
      detailedGames.filter((game): game is SteamGame => game !== null),
      selectedSort,
    );

    return NextResponse.json({
      filters,
      platforms: selectedPlatforms,
      sort: selectedSort,
      query: searchQuery,
      tags: {
        include: includeTags,
        exclude: excludeTags,
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
