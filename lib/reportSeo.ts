import type { SteamAssessment } from "./assessmentEngine";
import type { MetadataSnapshot } from "./metadataCache";
import { gameReportPath, parseSteamAppId, steamArtworkUrl } from "./gameSearch.ts";

export function isCrawler(agent: string) {
  return /bot\b|crawler|spider|slurp|google-inspectiontool|facebookexternalhit|facebookcatalog|whatsapp|discord|slack|linkedin|pinterest|embedly|skypeuripreview/i.test(agent);
}

export function canRefreshReport(headers: Pick<Headers, "get">) {
  if (isCrawler(headers.get("user-agent") ?? "") || headers.get("next-router-prefetch") !== null ||
      /prefetch/i.test(headers.get("sec-purpose") ?? "")) return false;
  const mode = headers.get("sec-fetch-mode");
  return mode === "navigate" ||
    (headers.get("rsc") === "1" && headers.get("sec-fetch-site") === "same-origin");
}

export function isIndexableReport(snapshot: MetadataSnapshot, assessment: SteamAssessment, now = Date.now()) {
  const { metadata, sources, expires_at } = snapshot;
  if (metadata.appType !== "game" || !metadata.title?.trim() || metadata.comingSoon ||
      !sources.appdetails || !sources.getItems || !sources.getTagList ||
      !(Date.parse(expires_at) > now)) return false;
  const direct = assessment.categories.filter(({ category, state, dataCoverage }) =>
    category !== "positive" && dataCoverage === "direct_evidence" &&
    (state === "significant_concern" || state === "potential_concern"));
  return direct.length >= 2 || (direct.length === 1 && assessment.officialClassifications.length > 0);
}

export function reportSearchDescription(title: string) {
  return `Considering ${title} for your child? This parents guide covers available age classifications, content concerns, online play and spending on Steam.`;
}

export function recentReportCards(snapshots: MetadataSnapshot[], now: number) {
  const cards = [];
  for (const { metadata, sources, expires_at } of snapshots) {
    const { appId, appType, title, capsuleImage } = metadata;
    const expiresAt = Date.parse(expires_at);
    const artwork = steamArtworkUrl(capsuleImage);
    if (appType !== "game" || typeof title !== "string" || !title.trim() ||
        typeof appId !== "number" || !parseSteamAppId(String(appId)) ||
        !artwork || !(expiresAt > now) || !sources.appdetails || !sources.getItems) continue;
    cards.push({ appId, title, artwork, href: gameReportPath(appId, title), expiresAt });
    if (cards.length === 6) break;
  }
  return cards;
}
