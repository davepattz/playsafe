export const GAME_SEARCH_MIN_LENGTH = 2;
export const GAME_SEARCH_MAX_LENGTH = 100;
export const GAME_SEARCH_DEBOUNCE_MS = 250;

export function normalizeGameQuery(query: string) {
  return Array.from(query.replace(/\s+/g, " ").replace(/[\u0000-\u001f\u007f]/g, "").trim().toWellFormed())
    .slice(0, GAME_SEARCH_MAX_LENGTH).join("").trimEnd();
}

export function hasEnoughLocalSuggestions(items: { capsuleImage?: string }[]) {
  return items.length >= 8 && items.every(({ capsuleImage }) => Boolean(capsuleImage));
}

export function steamArtworkUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (url.protocol === "https:" && !url.port && !url.username && !url.password &&
        (host === "steamstatic.com" || host.endsWith(".steamstatic.com") ||
          host === "steamcdn-a.akamaihd.net")) return url.href;
  } catch {
    return undefined;
  }
}

function titleWords(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/\p{M}/gu, "")
    .replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function rankGameTitles<T extends { title: string }>(items: T[], query: string): T[] {
  const normalized = titleWords(query);
  if (!normalized) return items;
  const queryWords = normalized.split(" ");
  return items.map((item) => {
    const title = titleWords(item.title);
    const words = title.split(" ");
    const matching = queryWords.filter((word) => words.some((term) => term.startsWith(word))).length;
    const rank = title === normalized ? 0 : title.startsWith(normalized) ? 1
      : matching === queryWords.length ? 2 : matching ? 3 : 4;
    return { item, rank, matching };
  }).sort((a, b) => a.rank - b.rank || b.matching - a.matching).map(({ item }) => item);
}

export function gameSlug(title: string) {
  return Array.from(titleWords(title).replaceAll(" ", "-")).slice(0, 90).join("").replace(/-$/, "") || "game";
}

export function gameReportPath(appId: number, title: string) {
  return `/games/${appId}/${encodeURIComponent(gameSlug(title))}`;
}

export function parseSteamAppId(value: string) {
  if (!/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 && id <= 0xffffffff ? id : null;
}

export function moveSearchSelection(current: number, length: number, direction: 1 | -1) {
  if (!length) return -1;
  if (current < 0) return direction === 1 ? 0 : length - 1;
  return (current + direction + length) % length;
}
