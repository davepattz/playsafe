import type { SteamGameMetadata } from "./steamMetadata";

const approvedRetailerOrigins = new Set([
  "https://www.fanatical.com",
  "https://www.greenmangaming.com",
  "https://www.humblebundle.com",
]);

type Retailer = {
  name: string;
  searchPage: string;
  queryParameter: string;
  enabled: boolean;
};

const retailers: readonly Retailer[] = [
  { name: "Fanatical", searchPage: "https://www.fanatical.com/en/search", queryParameter: "search", enabled: true },
  { name: "Green Man Gaming", searchPage: "https://www.greenmangaming.com/search", queryParameter: "query", enabled: true },
  { name: "Humble Store", searchPage: "https://www.humblebundle.com/search", queryParameter: "query", enabled: true },
];

export type RetailerLink = {
  name: string;
  href: string;
  linkType: "retailer_search";
  affiliate: false;
};

export function isApprovedRetailerUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return approvedRetailerOrigins.has(url.origin) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function retailerSearchLinks(game: Pick<SteamGameMetadata, "title" | "isFree" | "genres">): RetailerLink[] {
  // Older snapshots already store Steam's “Free To Play” genre (37).
  const free = game.isFree ?? game.genres?.some(({ id }) => id === 37);
  if (free || !game.title?.trim()) return [];
  const title = game.title;
  return retailers.flatMap(({ name, searchPage, queryParameter, enabled }) => {
    if (!enabled || !isApprovedRetailerUrl(searchPage)) return [];
    const url = new URL(searchPage);
    url.searchParams.set(queryParameter, title);
    // Fanatical can route some plus-encoded searches to an unrelated landing page.
    url.search = url.search.replaceAll("+", "%20");
    return [{ name, href: url.href, linkType: "retailer_search", affiliate: false }];
  });
}
