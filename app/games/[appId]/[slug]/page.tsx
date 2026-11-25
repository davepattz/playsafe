import type { Metadata } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import GameReport from "@/components/report/GameReport";
import ReportMessage from "@/components/report/ReportMessage";
import SearchSiteLayout from "@/components/SearchSiteLayout";
import { assessSteamGame } from "@/lib/assessmentEngine";
import { gameReportPath, gameSlug, parseSteamAppId } from "@/lib/gameSearch";
import { getCachedSteamGame, recordReportView } from "@/lib/steamPersistentCache";
import { allowV2Request } from "@/lib/v2RateLimit";

type ReportProps = { params: Promise<{ appId: string; slug: string }> };
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playsafe.games";
const loadReport = cache(async (value: string) => {
  const id = parseSteamAppId(value);
  if (id === null) return { status: "unavailable" } as const;
  const requestHeaders = await headers();
  if (!await allowV2Request("report", requestHeaders)) return { status: "busy" } as const;
  const { snapshot, diagnostics } = await getCachedSteamGame(id, requestHeaders);
  if (!snapshot && diagnostics.refresh === "rate_limited") return { status: "busy" } as const;
  if (!snapshot?.metadata.title) {
    return { status: diagnostics.refresh === "unavailable" ? "unavailable" : "error" } as const;
  }
  return {
    status: "ready", game: { ...snapshot.metadata, title: snapshot.metadata.title },
    incomplete: Object.values(snapshot.sources).some((available) => !available),
    staleRetrievedAt: diagnostics.cache === "stale" ? snapshot.retrieved_at : undefined,
  } as const;
});

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ReportProps): Promise<Metadata> {
  const report = await loadReport((await params).appId);
  if (report.status === "unavailable") notFound();
  if (report.status !== "ready") return { title: "Report unavailable | PlaySafe.games", robots: { index: false } };
  const { game } = report;
  const title = `${game.title} suitability report | PlaySafe.games`;
  const description = `Review available age classifications, content concerns, online features and purchases for ${game.title}.`;
  const url = new URL(gameReportPath(game.appId, game.title), siteUrl).href;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website" } };
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
  if (String(game.appId) !== appId || slug !== gameSlug(game.title)) redirect(gameReportPath(game.appId, game.title));
  after(() => recordReportView(game.appId));
  const assessment = assessSteamGame(game, new Date().toISOString());
  return <SearchSiteLayout><GameReport game={game} assessment={assessment} incomplete={report.incomplete}
    staleRetrievedAt={report.staleRetrievedAt} /></SearchSiteLayout>;
}
