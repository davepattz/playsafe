import type { SteamAssessment } from "./assessmentEngine";
import type { SteamGameMetadata } from "./steamMetadata";

export function reportOverview(categories: SteamAssessment["categories"]) {
  const significant = categories.filter(({ state }) => state === "significant_concern");
  const potential = categories.filter(({ state }) => state === "potential_concern");
  return {
    status: significant.length ? "significant_concern" : potential.length ? "potential_concern" : "insufficient_information",
    concerns: [...significant, ...potential].slice(0, 4),
  } as const;
}

export function positiveSteamTags(tags: SteamGameMetadata["tags"]) {
  const supported = new Set(["Sandbox", "Building", "Crafting", "Education", "Language Learning", "Exploration", "Puzzle", "Local Co-Op", "Local Multiplayer", "Split Screen", "Relaxing"]);
  return [...new Set(tags?.flatMap(({ name }) => name && supported.has(name) ? [name] : []))];
}

export function australianRatingLabel(value: string) {
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code === "MA15") return "MA 15+";
  if (code === "R18") return "R 18+";
  return value.toUpperCase();
}
