import { steamSearchErrorResponse } from "@/lib/steamMetadata";
import { GAME_SEARCH_MIN_LENGTH, normalizeGameQuery } from "@/lib/gameSearch";
import { searchGameCatalogue } from "@/lib/steamCatalogue";
import { allowV2Request } from "@/lib/v2RateLimit";
import { isCrawler } from "@/lib/reportSeo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (isCrawler(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 403 });
  const query = normalizeGameQuery(new URL(request.url).searchParams.get("q") ?? "");
  const headers = { "Cache-Control": "no-store" };
  if (query.length < GAME_SEARCH_MIN_LENGTH) return Response.json({ suggestions: [] }, { headers });
  if (!await allowV2Request("search", request.headers)) {
    return Response.json({ error: "Too many searches. Try again in a moment." }, {
      status: 429, headers: { ...headers, "Retry-After": "60" },
    });
  }
  try {
    return Response.json({ suggestions: await searchGameCatalogue(query) }, { headers });
  } catch (error) {
    return steamSearchErrorResponse(error);
  }
}
