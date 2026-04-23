// app/api/games/route.ts

import { mapFiltersToTags } from "@/lib/mapFiltersToTags"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const filters = {
    gameTypes: searchParams.getAll("gameTypes"),
    playStyles: searchParams.getAll("playStyles"),
    hidden: searchParams.getAll("hidden"),
  }

  const { includeTags, excludeTags } = mapFiltersToTags(filters)

  const url = `https://store.steampowered.com/search/results/?json=1&tags=${includeTags.join(",")}`

  const res = await fetch(url)
  const data = await res.json()

  // Apply hidden filter
  const filtered = data.results.filter((game: any) => {
    return !excludeTags.some(tag =>
      game.tags?.includes(tag)
    )
  })

  return Response.json(filtered)
}