# PlaySafe V2 search interface

The homepage is a search-first interface using the existing PlaySafe logo, Lato and purple palette. It adapts to desktop and mobile, with a compact navigation and footer. The original curated catalogue is available at `/catalogue`, and the Steam inspector remains development-only at `/dev/steam`. Edit `lib/popularSearches.ts` to change the suggestions shown beneath the search field.

## Search

- `components/GameSearch.tsx` implements a combobox with a listbox, a live status announcement, and an active option announced through `aria-activedescendant`. Up and Down cycle through suggestions, Enter opens the active or first result, and Escape closes the list. Results also accept pointer or touch selection.
- A trimmed query needs two characters and waits 250 ms after editing. A newer query aborts the earlier browser fetch and increments its revision, so an outdated response cannot update the list. Loading, empty, error and retry states are available in the dropdown.
- The browser calls `GET /api/search?q=…`. The server uses the [Phase 1 Steam adapter](STEAM-API.md) with the Australian English store context. Store search supplies candidate titles, capsules and platforms. One batched `GetItems` lookup verifies up to 16 candidate IDs and supplies release dates when available. Results require a successful Steam base-game type, excluding DLC, soundtracks, demos, and software. Unverified candidates are omitted. If the batch request fails, the API reports an upstream error. [Steam browse protocol schema](https://github.com/SteamTracking/Protobufs/blob/master/steam/steammessages_storebrowse.steamclient.proto)
- Exact title matches outrank prefix and token matches, with Steam order breaking ties. Up to eight games appear. Listed release years reflect Steam's dates, and unavailable image or platform data uses a visual fallback.
- Search reuses the Steam adapter's bounded in-process cache, per-request timeout and error handling. Store search JSON is cached for 60 seconds and verified candidate batches for five minutes. A timeout maps to HTTP 504 and other upstream failures to HTTP 502. Only Steam capsule images are loaded directly by the browser.

## Temporary reports

Selecting a game opens `/games/<appId>/<readable-title-slug>`. The Steam App ID identifies the game. If a title changes or an old slug is entered, the route redirects to the slug from the current Steam metadata. The page fetches the metadata server-side and renders the existing [Phase 2 assessment](ASSESSMENT-ENGINE.md). It rejects invalid IDs and confirmed non-games with a 404 and displays a temporary-unavailability message when upstream errors prevent identification. The report layout is intentionally temporary for Phase 4.

The new search and report flow has no database dependency. The V1 catalogue retains its separate data path.

## Verification

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` from a local environment with production credentials absent. Unit tests cover query handling, relevance ordering, report URLs and keyboard selection. Live smoke checks verified Steam result metadata, add-on exclusion, report rendering and redirects, and the development inspector. Edge checks covered keyboard selection, touch selection at a 360-pixel viewport, slow and out-of-order responses, the no-results state, and retry after HTTP 502.

### Existing ESLint image warnings

The repository-wide lint run completed with zero errors and 13 existing `@next/next/no-img-element` warnings. The rule flags plain `<img>` elements because they can increase bandwidth and slow the largest contentful paint. The Phase 3 search interface passed targeted lint with zero warnings.

| Component | Warning lines at the Phase 3 commit | Count |
| --- | --- | ---: |
| `components/Header.tsx` | 12, 50 | 2 |
| `components/Results.tsx` | 221, 225, 228, 263 | 4 |
| `components/Search.tsx` | 75, 79, 83 | 3 |
| `components/Sidebar.tsx` | 11, 26, 41 | 3 |
| `components/Title.tsx` | 11 | 1 |

For later review, check the asset source, sizing and loading behaviour before converting these images to `next/image`.
