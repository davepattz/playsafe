import type { MetadataRoute } from "next";
import { assessSteamGame } from "@/lib/assessmentEngine";
import { gameReportPath } from "@/lib/gameSearch";
import { getAllNewsArticles } from "@/lib/newsArticles";
import { isIndexableReport } from "@/lib/reportSeo";
import { SITE_URL } from "@/lib/siteUrl";
import { isStagingBuild } from "@/lib/staging";
import { listFreshReportSnapshots } from "@/lib/steamPersistentCache";

export const dynamic = "force-dynamic";

let reports: { expires: number; rows: ReturnType<typeof listFreshReportSnapshots> } | undefined;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isStagingBuild()) return [];
  const now = Date.now();
  const date = new Date(now).toISOString();
  if (!reports || reports.expires <= now) {
    reports = { expires: now + 300_000, rows: listFreshReportSnapshots(date).catch(() => {
      if (reports) reports.expires = Date.now() + 30_000;
      return [];
    }) };
  }
  const reportRoutes = (await reports.rows).flatMap((snapshot) => {
    const { metadata, retrieved_at } = snapshot;
    if (!metadata.title || !isIndexableReport(snapshot, assessSteamGame(metadata, date), now)) return [];
    return [{ url: SITE_URL + gameReportPath(metadata.appId, metadata.title), lastModified: retrieved_at }];
  });
  const staticRoutes = ["", "/catalogue", "/methodology", "/news", "/faq", "/about", "/privacy", "/terms", "/contact"]
    .map((path) => ({ url: SITE_URL + path }));
  const articleRoutes = getAllNewsArticles().map((article) => ({
    url: `${SITE_URL}/news/${article.slug}`, lastModified: article.publishedAt,
  }));
  return [...staticRoutes, ...articleRoutes, ...reportRoutes];
}
