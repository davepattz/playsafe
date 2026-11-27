import type { SteamClassification, SteamGameMetadata } from "./steamMetadata";

const authorities = new Map<string, readonly [string, string]>([
  ["acb", ["Australia", "Australian Classification Board"]],
  ["oflc", ["Australia", "Australian Classification Board"]],
  ["dejus", ["Brazil", "DEJUS"]],
  ["cadpa", ["China", "CADPA"]],
  ["pegi", ["Europe", "PEGI"]],
  ["usk", ["Germany", "USK"]],
  ["igrs", ["Indonesia", "IGRS"]],
  ["agcom", ["Italy", "AGCOM"]],
  ["cero", ["Japan", "CERO"]],
  ["nzoflc", ["New Zealand", "Classification Office"]],
  ["esrb", ["North America", "ESRB"]],
  ["crl", ["Russia", "Content Rating Law"]],
  ["gmedia", ["Saudi Arabia", "General Authority of Media Regulation"]],
  ["mda", ["Singapore", "IMDA"]],
  ["fpb", ["South Africa", "Film and Publication Board"]],
  ["kgrb", ["South Korea", "GRAC"]],
  ["csrr", ["Taiwan", "Computer Software Rating Regulation"]],
]);

const generatedRegions = new Map([
  ["steam_australia", "Australia"],
  ["steam_germany", "Germany"],
  ["steam_indonesia", "Indonesia"],
]);

// ClassInd's Portuguese and English practical guides and CERO's bilingual ethics rules.
const translations = new Map<string, ReadonlyMap<string, string>>([
  ["dejus", new Map([
    ["violência", "Violence"],
    ["violência extrema", "Extreme violence"],
    ["linguagem imprópria", "Inappropriate language"],
    ["conteúdo sexual", "Sexual content"],
    ["drogas", "Drugs"],
    ["drogas ilícitas", "Illegal drugs"],
  ])],
  ["cero", new Map([["暴力", "Violence"]])],
]);

type Card = {
  key: string;
  region: string;
  authority: string | null;
  sourceIdentifier: string | null;
  rating: string;
  descriptors: string | null;
  englishDescriptors: string | null;
};

export function reportClassifications(game: SteamGameMetadata, sourcesAvailable: boolean) {
  const entries: (SteamClassification | null)[] = game.reportedClassifications ??
    [...(game.classifications ?? []), game.australianClassification, game.steamAustralianRating];
  const groups = { official: new Map<string, Card>(), generated: new Map<string, Card>(), unverified: new Map<string, Card>() };
  const explicitOrigins = new Map<string, boolean>();
  for (const entry of entries) {
    if (entry && entry.generated !== undefined) {
      explicitOrigins.set(JSON.stringify([entry.authority.trim().toLowerCase(), entry.rating.trim().toLowerCase()]), entry.generated);
    }
  }
  for (const entry of entries) {
    if (!entry?.authority.trim() || !entry.rating.trim()) continue;
    const id = entry.authority.trim().toLowerCase();
    const origin = entry.generated ?? explicitOrigins.get(JSON.stringify([id, entry.rating.trim().toLowerCase()]));
    const known = authorities.get(id);
    const generated = id.startsWith("steam_") || origin === true;
    // Older snapshots discarded the flag. Steam uses DEJUS for both types of rating.
    const group = generated ? groups.generated : known && (id !== "dejus" || origin === false) ? groups.official : groups.unverified;
    const region = generatedRegions.get(id) ?? known?.[0] ?? "Country or region unspecified";
    const authority = generated ? null : known?.[1] ?? "Unverified authority";
    const boardKey = known && !generated ? known[1] : id;
    const key = JSON.stringify([boardKey, entry.rating.trim().toLowerCase()]);
    const previous = group.get(key);
    const descriptors = [...new Set(
      [previous?.descriptors, entry.descriptors].flatMap((text) => text?.split(/\r?\n/).filter((line) => line.trim()) ?? []),
    )].join("\n") || null;
    const dictionary = translations.get(id);
    const translated = descriptors?.split("\n").flatMap((line) => dictionary?.get(line.trim().toLowerCase()) ?? []) ?? [];
    group.set(key, {
      key, region, authority, rating: entry.rating, descriptors, englishDescriptors: translated.join("\n") || null,
      sourceIdentifier: !known && !generatedRegions.has(id) ? entry.authority : null,
    });
  }

  const sort = (cards: Map<string, Card>) => [...cards.values()].sort((a, b) =>
    a.region.localeCompare(b.region, "en") || a.key.localeCompare(b.key, "en"));
  return {
    official: sort(groups.official),
    generated: sort(groups.generated),
    unverified: sort(groups.unverified),
    state: groups.official.size || groups.generated.size || groups.unverified.size
      ? "available" : sourcesAvailable ? "missing" : "temporarily_unavailable",
  } as const;
}
