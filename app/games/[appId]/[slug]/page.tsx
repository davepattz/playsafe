import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import GameReport from "@/components/report/GameReport";
import ReportMessage from "@/components/report/ReportMessage";
import SearchSiteLayout from "@/components/SearchSiteLayout";
import { assessSteamGame } from "@/lib/assessmentEngine";
import { gameReportPath, gameSlug, parseSteamAppId, steamArtworkUrl } from "@/lib/gameSearch";
import { getCachedSteamGame, readPublishedReport, recordReportView } from "@/lib/steamPersistentCache";
import { canRefreshReport, isIndexableReport, reportSearchDescription } from "@/lib/reportSeo";
import { SITE_URL } from "@/lib/siteUrl";
import { isStagingBuild } from "@/lib/staging";
import { allowV2Request } from "@/lib/v2RateLimit";

type ReportProps = { params: Promise<{ appId: string; slug: string }> };
const loadReport = cache(async (value: string) => {
  const id = parseSteamAppId(value);
  if (id === null) return { status: "unavailable" } as const;
  const requestHeaders = await headers();
  const interactive = canRefreshReport(requestHeaders);
  if (!await allowV2Request("report", requestHeaders)) return { status: "busy" } as const;
  const lookup = interactive ? await getCachedSteamGame(id, requestHeaders) : null;
  let snapshot = lookup?.snapshot;
  if (!interactive) {
    try {
      snapshot = await readPublishedReport(id);
    } catch {
      return { status: "error" } as const;
    }
  }
  if (!snapshot && lookup?.diagnostics.refresh === "rate_limited") return { status: "busy" } as const;
  if (!snapshot?.metadata.title) {
    return { status: !interactive || lookup?.diagnostics.refresh === "unavailable" ? "unavailable" : "error" } as const;
  }
  const stale = Date.parse(snapshot.expires_at) <= Date.now();
  const assessment = assessSteamGame(snapshot.metadata, new Date().toISOString());
  return {
    status: "ready", game: { ...snapshot.metadata, title: snapshot.metadata.title },
    sources: snapshot.sources,
    incomplete: Object.values(snapshot.sources).some((available) => !available),
    classificationSourcesAvailable: snapshot.sources.appdetails && snapshot.sources.getItems && !stale,
    staleRetrievedAt: stale ? snapshot.retrieved_at : undefined,
    assessment, interactive, indexable: !isStagingBuild() && isIndexableReport(snapshot, assessment),
  } as const;
});

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ReportProps): Promise<Metadata> {
  const { appId, slug } = await params;
  const report = await loadReport(appId);
  if (report.status === "unavailable") notFound();
  if (report.status !== "ready") return { title: "Report unavailable | PlaySafe.games", robots: { index: false } };
  const { game } = report;
  const path = gameReportPath(game.appId, game.title);
  if (String(game.appId) !== appId || slug !== gameSlug(game.title)) permanentRedirect(path);
  const title = `Is ${game.title} safe for kids? | PlaySafe.games`;
  const description = reportSearchDescription(game.title);
  const url = new URL(path, SITE_URL).href;
  const image = steamArtworkUrl(game.headerImage) ?? `${SITE_URL}/social-card.png`;
  return {
    title, description, alternates: { canonical: url },
    robots: { index: report.indexable, follow: true },
    openGraph: { title, description, url, type: "website", siteName: "PlaySafe.games",
      images: [{ url: image, alt: image.endsWith("/social-card.png") ? "PlaySafe.games" : `${game.title} on Steam` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ReportPage({ params }: ReportProps) {
  const { appId, slug } = await params;
  const report = await loadReport(appId);
  if (report.status === "unavailable") notFound();
  if (report.status === "busy") return <ReportMessage title="Too many report requests" retry>
    Try again in a moment.
  </ReportMessage>;
  if (report.status === "error") return <ReportMessage title="Steam data is temporarily unavailable" retry>
    Steam did not return enough information to load this report. Try again in a moment.
  </ReportMessage>;
  if (report.status !== "ready") return null;
  const { game } = report;
  if (String(game.appId) !== appId || slug !== gameSlug(game.title)) permanentRedirect(gameReportPath(game.appId, game.title));
  if (report.interactive) after(() => recordReportView(game.appId));
  const { assessment } = report;
  return <SearchSiteLayout><GameReport game={game} assessment={assessment} incomplete={report.incomplete}
    sources={report.sources}
    classificationSourcesAvailable={report.classificationSourcesAvailable}
    staleRetrievedAt={report.staleRetrievedAt} /></SearchSiteLayout>;
}
