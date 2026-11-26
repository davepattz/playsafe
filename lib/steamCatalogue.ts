import "server-only";

import { hasEnoughLocalSuggestions, normalizeGameQuery, rankGameTitles, steamArtworkUrl } from "./gameSearch";
import { searchSteamGames, STEAM_CONTEXT } from "./steamMetadata";
import type { SteamSuggestion } from "./steamMetadata";
import { v2Database, v2DatabaseConfigured } from "./v2Database";

type CatalogueRow = { app_id: number; title: string; capsule_image: string | null; release_year: number | null; platforms: string[] | null };
const { country_code: region, language } = STEAM_CONTEXT;
const pending = new Map<string, Promise<SteamSuggestion[]>>();

async function findGames(query: string) {
  if (!v2DatabaseConfigured()) return searchSteamGames(query);
  const matches = await v2Database<CatalogueRow[]>("rpc/v2_find_games", {
    body: { p_query: query, p_region: region, p_language: language },
  }).catch(() => []);
  const local = (Array.isArray(matches) ? matches : []).map((row) => ({
    appId: row.app_id, title: row.title, capsuleImage: steamArtworkUrl(row.capsule_image),
    releaseYear: row.release_year ?? undefined, platforms: row.platforms ?? undefined,
  }));
  if (hasEnoughLocalSuggestions(local)) return rankGameTitles(local, query).slice(0, 8);
  try {
    const localById = new Map(local.map((game) => [game.appId, game]));
    const live = (await searchSteamGames(query)).map((game) => {
      const previous = localById.get(game.appId);
      return {
        ...game,
        capsuleImage: game.capsuleImage ?? previous?.capsuleImage,
        releaseYear: game.releaseYear ?? previous?.releaseYear,
        platforms: game.platforms ?? previous?.platforms,
      };
    });
    if (live.length) {
      await v2Database("v2_game_catalogue?on_conflict=app_id,region,language", {
        prefer: "resolution=merge-duplicates,return=minimal",
        body: live.map((game) => ({
          app_id: game.appId, title: game.title.slice(0, 300), region, language,
          capsule_image: game.capsuleImage ?? null, release_year: game.releaseYear ?? null,
          platforms: game.platforms?.length ? game.platforms : null, source: "steam_store", observed_at: new Date().toISOString(),
        })),
      }).catch(() => undefined);
    }
    const unique = new Map([...local, ...live].map((game) => [game.appId, game]));
    return rankGameTitles([...unique.values()], query).slice(0, 8);
  } catch (error) {
    if (local.length) return local;
    throw error;
  }
}

export function searchGameCatalogue(query: string) {
  const normalized = normalizeGameQuery(query);
  const key = normalized.toLowerCase();
  const active = pending.get(key);
  if (active) return active;
  const result = findGames(normalized).finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}
