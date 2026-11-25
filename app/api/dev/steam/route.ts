import { inspectSteamGame, searchSteamGames, SteamRequestError } from "@/lib/steamMetadata";
import { assessSteamGame } from "@/lib/assessmentEngine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });

  const params = new URL(request.url).searchParams;
  const id = params.get("appId");
  const options = { headers: { "Cache-Control": "no-store" } };
  try {
    if (id !== null) {
      if (!/^\d{1,10}$/.test(id) || Number(id) < 1 || Number(id) > 0xffffffff) {
        return Response.json({ error: "Enter a valid Steam app ID." }, { ...options, status: 400 });
      }
      const inspection = await inspectSteamGame(Number(id));
      const assessment = assessSteamGame(inspection.metadata, new Date().toISOString());
      return Response.json({ ...inspection, assessment }, options);
    }
    return Response.json({ suggestions: await searchSteamGames(params.get("q") ?? "") }, options);
  } catch (error) {
    const timeout = error instanceof SteamRequestError && error.reason === "timeout";
    return Response.json({ error: timeout ? "Steam search timed out. Try again." : "Steam search is unavailable. Try again." },
      { ...options, status: timeout ? 504 : 502 });
  }
}
