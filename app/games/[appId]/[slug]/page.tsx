import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AssessmentPanel from "@/components/AssessmentPanel";
import SearchSiteLayout from "@/components/SearchSiteLayout";
import { assessSteamGame } from "@/lib/assessmentEngine";
import { gameReportPath, gameSlug, parseSteamAppId } from "@/lib/gameSearch";
import { inspectSteamGame } from "@/lib/steamMetadata";

type ReportProps = { params: Promise<{ appId: string; slug: string }> };

export const dynamic = "force-dynamic";

export default async function GameReport({ params }: ReportProps) {
  const { appId, slug } = await params;
  const id = parseSteamAppId(appId);
  if (id === null) notFound();
  const { metadata, sources } = await inspectSteamGame(id);
  if (metadata.appType && metadata.appType !== "game") notFound();
  if (metadata.appType !== "game" || !metadata.title) {
    if (!("error" in sources.appdetails) && !("error" in sources.getItems)) notFound();
    return (
      <SearchSiteLayout>
        <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
          <h1 className="text-3xl font-bold">Game information is temporarily unavailable</h1>
          <p className="mt-3">Steam did not provide enough information to load this report. Try again shortly.</p>
          <Link href="/" className="mt-5 inline-block font-bold underline">Back to search</Link>
        </main>
      </SearchSiteLayout>
    );
  }
  if (String(id) !== appId || slug !== gameSlug(metadata.title)) redirect(gameReportPath(id, metadata.title));
  const assessment = assessSteamGame(metadata, new Date().toISOString());
  return (
    <SearchSiteLayout>
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/" className="inline-block font-bold underline">Back to search</Link>
        <h1 className="text-4xl font-bold tracking-tight">{metadata.title}</h1>
        {metadata.shortDescription && <p className="leading-relaxed">{metadata.shortDescription}</p>}
        <a className="inline-block font-bold underline" href={metadata.storeUrl}>View on Steam</a>
        <AssessmentPanel assessment={assessment} />
      </main>
    </SearchSiteLayout>
  );
}
