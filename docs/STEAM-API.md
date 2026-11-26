# PlaySafe V2 · Steam API investigation

Phase 1 uses the Australian storefront and English (`cc=AU&l=english` for Store routes, `country_code: "AU", language: "english"` in Web API context). Localization endpoints take a language only. No credentials, login cookies, AI services, or database connections are required.

## Endpoint results

Live, unauthenticated GET requests on 25 November 2026 used Node from this workspace after outbound access was approved. All six endpoints returned HTTP 200 and usable JSON. Times below include the response body and JSON parsing, and reflect one short run with small batches. They give an idea of latency from this environment. Long-term reliability, quotas, geographical variability, and contractual support remain unverified. xPaw marks the four Web API methods as undocumented and lists an access key for each. This test established anonymous access for these requests, with no guarantee that Steam will continue to accept them. [xPaw endpoint index](https://steamapi.xpaw.me/) · [Query methods](https://steamapi.xpaw.me/IStoreQueryService) · [Browse methods](https://steamapi.xpaw.me/IStoreBrowseService) · [Tag methods](https://steamapi.xpaw.me/IStoreService)

| Endpoint | Observed time | Payload and limitations |
| --- | --- | --- |
| `api.steampowered.com/IStoreQueryService/SearchSuggestions/v1/` | 270–460 ms, six titles | Returned the expected app ID first for all six. Payload contained ranked IDs and match metadata. Labels require another request. |
| `api.steampowered.com/IStoreBrowseService/GetItems/v1/` | 259 ms, one six-app batch | Returned all six items, 20 weighted tags each, and Store metadata. Request flags control sections. `include_game_rating` yielded no game ratings in this batch. Assets use filename templates and tags contain IDs and weights. |
| `api.steampowered.com/IStoreService/GetTagList/v1/` | 350 ms, one request | Returned 446 localized names and a version hash. Cache it independently. A request with `have_version_hash` can omit results when Steam's list is unchanged, according to xPaw. |
| `api.steampowered.com/IStoreService/GetLocalizedNameForTags/v1/` | 286 ms, two IDs in one request | Returned both requested names, including English and normalized forms. Useful for targeted lookups. Per-app weights come from `GetItems`. |
| `store.steampowered.com/api/appdetails` | 252–443 ms, six IDs queried individually | All succeeded. Provides title, artwork, description, category and genre names, dates and optional ratings and descriptors. Check each app's success envelope. V1 uses a price-focused batch request and individual enrichment. |
| `store.steampowered.com/api/storesearch/` | 228–356 ms, six titles | Returned the expected app ID and title first for all six in one request each. Result type `app` can include DLC. Use this as an autocomplete candidate source and confirm app type in metadata before future report generation. |

## Coverage by game

Both search endpoints returned the expected IDs for all six titles, and `storesearch` also returned their names. For all six apps, `appdetails` returned both image URLs, a short description, genres, categories, and a release date, and `GetItems` returned 20 weighted tags. A returned release date is the Steam listing's date. For example, app ID 730 retains a 2012 date. The canonical Store link is derived from the Steam app ID.

| Game | App ID | Australian fields from Steam | Content descriptor IDs and notes | Examples of listed features |
| --- | --- | --- | --- | --- |
| Wobbly Life | 1211020 | Unknown | Unknown | Online and split-screen co-op, Workshop |
| BeamNG.drive | 284160 | Unknown | Unknown | Multiplayer, shared/split-screen co-op |
| Disney Dreamlight Valley | 1401590 | Unknown | Unknown | Multiplayer, in-app purchases |
| Garry's Mod | 4000 | Unknown | Unknown | Online and LAN PvP/co-op, Workshop |
| Counter-Strike 2 | 730 | Steam-generated `MA15` | `[2, 5]`, notes present | Cross-platform multiplayer, Workshop, in-app purchases |
| Cyberpunk 2077 | 1091500 | `oflc: r18`, Steam-generated `R18` | `[1, 2, 5]`, notes present | Single-player listed |

- **Australian classifications.** `ratings.oflc` can carry a board rating and consumer advice. Cyberpunk 2077's original entry was independently verified against the Australian Classification database, which also contains separate records for other releases. `ratings.steam_australia` is a separate Steam-generated field and is preserved as such. Steam alone cannot establish comprehensive Australian classification coverage. Check the government record for the exact edition before using a classification as authoritative. [Australian Classification original record](https://www.classification.gov.au/titles/cyberpunk-2077)
- **Content descriptors and developer disclosures.** Preserve Steam descriptor IDs and free-text notes as provided. Cyberpunk's `content_descriptors.notes` matched the developer disclosure on the Store page. The other four samples with empty IDs and no text have unknown disclosure coverage. Ratings-board consumer advice stays with its rating; it has different provenance from developer notes. [Cyberpunk Steam disclosure](https://store.steampowered.com/agecheck/app/1091500/Cyberpunk_2077/) · [Valve content survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)
- **Tags and features.** Each weight belongs to the returned Store tag ranking. It is a discovery signal with no established suitability meaning. Categories provide positive evidence for advertised multiplayer modes, in-app purchases and Workshop. Omitted categories cannot establish absence of those capabilities. For example, no Workshop flag does not establish whether a game supports mods through other channels.
- **Release and asset limits.** Localized release strings can include upcoming states. Store image fields are optional. The adapter uses direct `appdetails` artwork URLs and leaves those fields unknown when omitted. GetItems asset paths remain visible in raw diagnostics.

## Development adapter and inspector

Run `npm.cmd run dev -- --hostname 127.0.0.1` on Windows in a clean local environment with production variables absent, then visit `http://127.0.0.1:3000/dev/steam`. Use the search input or the six example buttons. The inspector shows normalized metadata and expandable upstream JSON with availability and timing. `/api/dev/steam?q=wobbly` queries autocomplete, and `/api/dev/steam?appId=1211020` inspects an app directly by ID. Both page and API return 404 outside Next.js development mode.

`lib/steamMetadata.ts` shares Store configuration with V1. It queries `storesearch` for titles and runs `appdetails`, `GetItems`, and `GetTagList` concurrently for inspection. A failed source leaves its fields unknown while successful sources remain visible. An explicit upstream boolean can be preserved. Unlisted purchases, Workshop, multiplayer, descriptors, and ratings stay `null`. `SearchSuggestions` and `GetLocalizedNameForTags` were evaluated as alternatives.

Autocomplete waits 250 ms after input with at least two characters and aborts stale browser requests. Each Steam fetch has a 4.5-second timeout. Successful response shapes use a bounded in-process cache with a 60-second search TTL, 30-minute app TTL and 24-hour tag dictionary TTL. Transport errors and unavailable app payloads are left uncached. Cache timings shown in the UI describe the original upstream fetch. For production-grade autocomplete, use a local index and retain controlled refreshes for Steam data.

Phase 1 verification exercised live search and normalized metadata through the API handler for all six titles. A second inspection verified cache hits. Injected HTTP 503 responses exercised search error reporting and partial metadata, and input checks covered invalid app IDs. A loopback Next.js smoke test checked the rendered inspector and both API paths. The local production build succeeded, and both development URLs returned HTTP 404 under `next start`.

## Reproduce the probes

For the two Store endpoints, issue GET requests for the six titles or IDs in the table with `cc=AU&l=english` plus `term=<title>` or `appids=<id>`. For Web API endpoints use `/v1/?input_json=<URL-encoded JSON>` and these payload shapes.

| Method | JSON payload |
| --- | --- |
| SearchSuggestions | `{"context":{"country_code":"AU","language":"english"},"search_term":"Wobbly Life","max_results":8}` |
| GetItems | `{"ids":[{"appid":1211020}],"context":{"country_code":"AU","language":"english"},"data_request":{"include_assets":true,"include_basic_info":true,"include_tag_count":20,"include_release":true,"include_game_rating":true}}` |
| GetTagList | `{"language":"english"}` |
| GetLocalizedNameForTags | `{"language":"english","tagids":[19,21]}` |

Record HTTP status, body validity, expected app IDs, returned fields and elapsed time. Repeat across multiple runs and environments before relying on any endpoint in production.
