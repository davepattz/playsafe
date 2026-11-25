import { inspectSteamGame, searchSteamGames, steamSearchErrorResponse } from "@/lib/steamMetadata";
import { assessSteamGame } from "@/lib/assessmentEngine";
import { parseSteamAppId } from "@/lib/gameSearch";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });

  const params = new URL(request.url).searchParams;
  const id = params.get("appId");
  const options = { headers: { "Cache-Control": "no-store" } };
  try {
    if (id !== null) {
      const appId = parseSteamAppId(id);
      if (appId === null) {
        return Response.json({ error: "Enter a valid Steam app ID." }, { ...options, status: 400 });
      }
      const inspection = await inspectSteamGame(appId);
      const assessment = assessSteamGame(inspection.metadata, new Date().toISOString());
      return Response.json({ ...inspection, assessment }, options);
    }
    return Response.json({ suggestions: await searchSteamGames(params.get("q") ?? "") }, options);
  } catch (error) {
    return steamSearchErrorResponse(error);
  }
}
