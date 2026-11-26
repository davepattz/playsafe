# PlaySafe.games V1 archive

Repository baseline on 25 November 2026 (Brisbane) is `e5a595818e8c291c2565928f0fb077e8456d2a0a` (“updated batman banner”). Local `main` and the cached `origin/main` matched, and the working tree was clean. Local `v1-archive`, `v1.0.0`, and `v2-development` were created from that commit. The Git tag is an archive marker. The application package remains version `0.1.0`.

The remote query could not reach GitHub, so the currently deployed commit and current remote refs remain unverified. Hosting configuration, database settings, and schedules managed outside the repository also remain unverified. A tracked `.DS_Store` is repository housekeeping and belongs outside this archive task.

## Application architecture

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4. `package.json` defines `dev`, `build`, `start`, and `lint`. No test script or deployment workflow is checked in.
- `app/page.tsx` holds browser state for featured sections, query, sort, platforms, and safety filters. `Search`, `Filters`, and `Featured` feed `Results`, which requests the games API, cancels superseded requests, and handles pagination. The front page defaults to the curated popular list.
- `app/layout.tsx` supplies global styling, fonts, metadata, and Google Analytics. `/faq` is informational. `/news` and `/news/[slug]` use checked-in content from `lib/newsArticles.ts`. Individual articles can embed YouTube and Disqus. `/sitemap.xml` comes from `app/sitemap.ts`. Sidebar and banner components link to Steam or affiliate destinations.
- `app/api/games/route.ts` handles discovery, enrichment, filtering, sorting, and caching on the server. `lib/popularGames.ts` contains curated lists. `lib/filterOptions.ts`, `lib/tagMap.ts`, `lib/mapFiltersToTags.ts`, and `lib/badLanguageTerms.ts` define filter inputs and heuristics. Supabase is accessed directly via PostgREST in `lib/steamResultsCache.ts`.

## API and Steam integrations

### `GET /api/games`

This is the sole checked-in application API route.

| Query parameter | Behavior |
| --- | --- |
| `query` | Trimmed title query. A non-empty query uses Steam discovery even when a curated section is selected. |
| `featured` | `popular` (default), `new-releases`, `shared-split-screen-coop`, `education`, `racing`, `lego`, or `all`. The curated lists are popular, co-op, education, racing, and Lego. |
| `gameTypes`, `playStyles`, `hidden`, `platforms` | Repeated or comma-separated values. Platforms accept `windows`, `macos`, and `linux`, defaulting to all. Game types map to Steam tags, play styles to app categories, and hidden content to exclusion tags and selected text or hover checks. |
| `sort`, `page`, `limit` | Defaults are `Newest to oldest`, page 1, and 30 results. The route caps the limit at 30. |
| `timezone` | Country hint. Supported hosting geolocation headers take priority, followed by timezone, then `Accept-Language`, then US. This controls the Steam storefront region. |
| `applyPopularFilters=true`, `refreshCache=true` | The first opts into content filters for curated results. The second skips the result-cache read and may replace that row. The popular-list source can still be read on a refresh. |

Success returns `games`, normalized filters, platforms, sort, featured selection, query, country, mapped tags, page, `hasMore`, and `total` for the collected matches. Each game exposes a Steam app ID, name, image, description, platforms, prices and discount when available, release date, and Steam link. The route sets `x-playsafe-cache` to `hit` or `miss` on success. A top-level failure returns HTTP 500 with an error and empty `games`.

| Steam Store endpoint | V1 usage and reuse |
| --- | --- |
| `/search/results/` | Parses HTML embedded in Steam's JSON for app IDs, titles, platforms, images, prices, and tag IDs. Reuse the discovery and normalization logic for ingestion or a fallback. The HTML parser depends on Steam's markup, and V1 scans a bounded number of result batches. |
| `/api/appdetails` | Batched and single-app requests enrich results with game type, categories, descriptions, artwork, release information, price and platform support. Reuse the adapter as a starting point for gathering evidence by app ID. |
| `/apphoverpublic/{appId}` | Parses displayed tag labels for selected exclusions, including horror and bad language. Treat these tags as supplementary evidence and capture fetch failures explicitly. |

No Steam API key is configured in V1. The V1 response exposes catalogue metadata and filter outcomes. V2 will need to establish classification coverage, provenance and jurisdiction separately.

## Supabase schema and maintenance

This is the schema documented by the repository and the contract used by the application. Verify production DDL, grants, RLS policies, indexes, triggers and extensions separately before using it as a migration baseline.

| Column in default `steam_results_cache` | Repository DDL |
| --- | --- |
| `cache_key` | `text primary key`. The API hashes normalized request and filter inputs, behavior version, and the curated source where relevant. |
| `payload` | `jsonb not null`. Stores API responses or a curated source payload. |
| `expires_at` | `timestamptz not null`. Read-time expiration and cleanup cutoff. |
| `created_at` | `timestamptz not null default now()`. Defined in the README schema and supplied by the database. |

`popular-games:v1` is an optional editorial row in the same table with a far-future expiration. Its `games` array stores `appId`, `name`, `releaseDate`, `priceLabel`, and `platforms`. Valid remote entries take precedence by Steam app ID and local entries supplement them. If there are no valid remote entries, the local list is used.

No scheduled jobs or cron definitions were found in the repository. Expiration is checked on read. After a successful upsert, a request can delete expired rows (2% sampling by default). Certain Steam fetches use one-hour Next.js revalidation, while batch details and retry fetches bypass that cache. V1 has no checked-in ingestion job. Check hosting schedules, Supabase Cron and external workers during the production inventory.

## Environment variables

| Variable | Requirement and defaults |
| --- | --- |
| `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | Optional. The server prefers the first and falls back to the second. |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional. First defined key in this order is used. A service-role key belongs in server-only configuration. Anon or publishable credentials depend on applicable database grants and RLS. |
| `SUPABASE_STEAM_CACHE_TABLE` | Defaults to `steam_results_cache`. |
| `STEAM_RESULTS_CACHE_TTL_SECONDS` | Defaults to `21600` (six hours). |
| `STEAM_RESULTS_CACHE_CLEANUP_SAMPLE_RATE` | Defaults to `0.02`. Use `0` to disable sampled cleanup. Upserts still occur when the cache is configured. |
| `NEXT_PUBLIC_SITE_URL` | Sitemap origin. Defaults to `https://playsafe.games`. |
| `NODE_ENV` | The runtime sets it. Development enables additional cache and curated-source logs. |

The app can run without a Supabase URL or key. Cache operations become no-ops and the app uses Steam and checked-in curated data. The Analytics property and Disqus shortname are hardcoded and need separate configuration or disabling before hosted V2 testing.

## Reusable V2 foundations

- Keep the catalogue and editorial pages available. Reuse the shared header, footer, branding, platform icons, Tailwind layout, typography, and result-card styling. Adapt the search input for keyboard-accessible suggestions and reuse request cancellation from `Results`.
- Use Steam app IDs and normalized title metadata as the basis of a local autocomplete index. Populate it independently of the per-keystroke request path. Enrich selected titles with Steam metadata, tags, feature categories, and available classifications.
- Build deterministic, versioned rules from the existing tag maps, play-style matching, and text heuristics. Record source, region, retrieval time, and the signals that triggered each result. Represent unavailable evidence explicitly, especially missing official ratings or content information. Keep community tags and heuristic signals distinct from official classifications. No AI is required.

## Supabase backup and isolated development plan

1. **Inventory production through existing dashboards.** Record the deployed Git SHA, production branch and domain mapping, production Supabase project reference, variables by name, schema and policies, scheduled jobs, and backup retention or recovery options. Verify the deployed SHA against the archive before publishing the refs.
2. **Capture a production backup before future schema work.** Use the existing dashboard backup or point-in-time recovery where available. If an independent export is needed, use Supabase's supported logical backup procedure with an authorized connection and read-only extraction. Retain schema, role/grant information, and required data in encrypted, access-controlled storage outside Git. Capture the curated source row separately for catalogue recovery. Record the timestamp, scope and checksum, and inventory any Storage objects or secrets separately. [Supabase database backups](https://supabase.com/docs/guides/platform/backups) · [Supabase backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase)
3. **Rehearse recovery in isolation.** Restore to a disposable local instance or separate non-production project with its own credentials. Keep jobs and outbound integrations disabled during recovery. Verify schema, constraints, policies, table counts and the curated entry. Exercise application cache reads, upserts and expiry deletion there, and record the recovery result.
4. **Start V2 locally with Supabase disabled.** Use a fresh environment without any production Supabase URL, keys, database connection strings, or linked CLI state. Check inherited process variables and Next.js environment files before launching. Use fixtures for development, then use local Supabase or a dedicated V2 Supabase project when persistence is needed. Store versioned migrations and synthetic seeds in V2. Run migrations, resets and job tests against the explicitly verified development target. [Supabase local database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
5. **Verify hosting and database separation before publishing branches or enabling previews.** Confirm which refs and tags trigger deployment. Require reviewed production changes on `main` and keep the archive branch read-only by branch protection when published. Use a separate preview project or strictly scoped preview credentials, a separate hostname, and non-production analytics and comment settings. Restrict V2 jobs and credentials to the development database. Add a fail-closed development target check before V2 performs any persistent writes. Verify the preview build and runtime resolve only to the approved development project.

The preparation stage stayed local. Production hosting settings and Supabase were untouched, and no backup or restore was run. The hosted isolation checks are prerequisites to a preview or deployment.
