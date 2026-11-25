import { searchSteamGames, steamSearchErrorResponse } from "@/lib/steamMetadata";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return Response.json({ suggestions: await searchSteamGames(query) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return steamSearchErrorResponse(error);
  }
}
