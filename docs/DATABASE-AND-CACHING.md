# V2 database and Steam caching

## Isolation and the V1 inventory

The repository documents V1's optional `steam_results_cache` table and PostgREST adapter. Its primary key is a request hash. Rows contain the full results response, timestamps, and a special `popular-games:v1` editorial row. V1 uses a six-hour TTL and deletes expired rows on a sampled successful write. Its Next.js fetch revalidation still serves V1. No deployment scheduler, Supabase Cron migration, or Steam ingestion job is checked in. Hosted database objects, indexes, grants and schedules were outside this phase's access and remain unverified. The V2 migration leaves V1's table and runtime path intact. See [V1 archive](V1-ARCHIVE.md).

## Model

| Table | Purpose and access path |
| --- | --- |
| `v2_game_metadata` | One normalized evidence snapshot per Steam App ID, region and language. The composite key serves exact lookups. An expiry index supports maintenance. |
| `v2_game_catalogue` | Recently observed base-game titles and optional capsule, year and platforms. Composite identity provides locale deduplication. B-tree prefix and trigram GIN indexes support prefix and substring matches. |
| `v2_game_popularity` | Daily UTC report-view count by game and region. The primary key supports an atomic increment and day-range rollups. Counts include repeated visits and do not measure unique readers. |
| `v2_request_windows` | Short-lived fixed-minute counters. The key supports atomic per-bucket rate checks, and a minute index supports expiry cleanup. |

The metadata JSON includes normalized Steam tags, weights, features, official and Steam-generated ratings, descriptors and existing evidence fields. Each snapshot also records retrieval start, expiry, availability of the three upstream sources, and a coverage manifest. The manifest records available fields, classification authorities with advice, and minimum observed counts for tags, categories and descriptor IDs.

## Read-through cache and assessment generation

Reports read a fresh snapshot without Steam requests. On a miss or expiry the server fetches new app details and browse data, using the existing cached tag dictionary. Detailed metadata expires in seven days by default. An atomic Postgres conditional upsert accepts a newer snapshot only when its coverage includes the previous snapshot's coverage. A first lookup with usable but partial data can render without writing. Fewer tags or descriptors and missing classification advice can represent an incomplete upstream response, so this conservative rule keeps the older evidence even if Steam intentionally removed information. Investigate persistent coverage reductions before intentionally clearing affected cache entries in the development database.

Expired data remains usable when a refresh fails, has lower coverage or is throttled. The report prominently shows the date of the stale snapshot and keeps the current assessment date separate. A failed refresh waits 60 seconds before retrying in the same process. A bounded 256-record memory layer short-circuits fresh reads for 30 seconds and can serve remembered evidence during a database outage. If no snapshot is available, the app can still call Steam within a local request budget. Concurrent identical lookups share one promise per process. Multiple processes can still refresh simultaneously; the atomic write protects the stored result.

Report assessments are **regenerated**, using the cached metadata and current deterministic engine on every request. The assessment is a small synchronous pass over at most 20 Store tags plus the supplied evidence, so persistent assessment rows would duplicate data and introduce invalidation work for rules changes and manual overrides. Unit tests confirm that the same cached metadata yields a new result immediately under changed rules. No report result is stored.

## Search and catalogue ingestion

Autocomplete first queries the local title index. It prefers regional matches, ranks exact and prefix matches first, and deduplicates by App ID. Two-character searches use prefix matching. Longer searches can use indexed substring matching. Local search uses observations from the previous 30 days. A well-populated local result or a regional exact match with a capsule avoids Steam. Sparse results fall back to live Steam search and populate the local index with verified base games. If live Steam fails, available local matches remain usable. The current storefront is AU and the language is English.

Valve documents `IStoreService/GetAppList` as the official games catalogue endpoint. It takes a Web API key, supports game-only filtering, and paginates by `last_appid` with optional incremental refresh through `if_modified_since`. The opt-in export script uses the documented endpoint and produces a CSV without connecting to a database. Its official authenticated endpoint has not been exercised with a real key in this phase. Live index warming works without one. [Valve catalogue API](https://partner.steamgames.com/doc/webapi/IStoreService#GetAppList)

For a separately approved development import, export to a temporary CSV using `node scripts/export-steam-catalogue.mjs` with `STEAM_CATALOGUE_API_KEY` in the shell. Check that it exited successfully. Load the CSV with `psql` and `\copy` into a temporary table with `app_id bigint` and `title text`. Insert into `v2_game_catalogue` with region and language `'*'`, source `steam_app_list` and current `observed_at`; on conflict update the title and observation time. The global index contains no regional availability proof or artwork. When a parent opens a report, Steam still verifies the game in the configured storefront. No periodic import or cleanup job is created by the migration.

## Configuration and security

| Variable | Requirement |
| --- | --- |
| `V2_SUPABASE_URL` | Optional standalone development project origin or a local Supabase origin. When absent, the application uses Steam and bounded in-process caching. |
| `V2_SUPABASE_ALLOWED_ORIGIN` | Exact separately verified V2 origin. The adapter disables storage if the origins differ or the target matches a configured V1 Supabase origin. |
| `V2_SUPABASE_SERVICE_ROLE_KEY` | Server-only key for that isolated project. Supports the service-role JWT or a Supabase secret key. Never use a public environment variable for it. |
| `V2_METADATA_TTL_SECONDS` | Defaults to `604800`. Applies to newly retrieved snapshots. |
| `V2_SEARCH_REQUESTS_PER_MINUTE`, `V2_METADATA_REQUESTS_PER_MINUTE`, `V2_REPORT_REQUESTS_PER_MINUTE` | Global defaults are 240 searches, 120 metadata refreshes and 600 report loads per fixed minute. |
| `V2_SEARCH_CLIENT_REQUESTS_PER_MINUTE`, `V2_METADATA_CLIENT_REQUESTS_PER_MINUTE`, `V2_REPORT_CLIENT_REQUESTS_PER_MINUTE` | Optional per-client defaults are 45, 20 and 60 per minute. |
| `V2_TRUSTED_CLIENT_IP_HEADER`, `V2_RATE_LIMIT_SECRET` | Enable client quotas only when the ingress overwrites this header with a trusted single IP and blocks client-supplied values. The secret must be at least 32 characters. Without both settings the global limits still apply. |

The database adapter is server-only, refuses redirects, and never uses the V1 credentials or URL as fallback. The allowlisted origin is a guard against misconfiguration and must be verified separately from production. The migration enables RLS, revokes access from public, anonymous and authenticated roles, and grants only required table operations and function execution to the Supabase service role. Functions use invoker security and a fixed search path. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

The database enforces shared quotas atomically. A bounded-in-time, per-process quota remains active when the database is unavailable. Public autocomplete returns HTTP 429 with a retry hint when over budget. Reports show a busy message when an uncached request cannot be served. Neither popularity nor retrieval records store IPs, queries, user agents, or account identifiers. When configured, the limiter uses a keyed minute-specific digest of the trusted IP, never the raw address. Old buckets are cleaned opportunistically; dormant installations can clear expired buckets during maintenance.

## Migration, capacity, and verification

- Apply [the migration](../supabase/migrations/20261125000100_v2_steam_cache.sql) only to the local or separately confirmed development database. It adds four V2 tables and the `pg_trgm` search extension. Run [the rollback-only SQL verification](../supabase/tests/v2_steam_cache.sql) with `psql -v ON_ERROR_STOP=1` on that database using an administrative test connection. Use the app's separate V2 origin and credentials to verify the Data API before a hosted preview. No hosted migration, job change, or deployment was made.
- A planning estimate of 4–15 KB per normalized evidence snapshot plus coverage would put 10,000 cached titles around 40–150 MB before TOAST compression and indexes. A 100,000-title catalogue with names and indexes is likely on the order of tens of MB; measure title length and GIN storage on the real development dataset. At 1,000 distinct report titles per day, popularity accrues at most 30,000 rows per month before aggregation or retention. These are sizing examples, not measured production usage.
- A cold verified report uses roughly one quota call, one lookup, one refresh quota call, one possible write, and one asynchronous popularity increment. A warm report performs no Steam calls. A local autocomplete query uses a quota call and one index lookup; sparse queries can add Steam lookup and an index write. Measure hit rate, database latency and stale percentages before tuning budgets or provisioning bulk refreshes.
- The V1 expiry cleanup is still required while the catalogue uses the legacy table. V2 metadata expiry is checked on read. No scheduled job is required initially. A future development-only retention job can prune expired limiter buckets and old catalogue observations or roll up popularity data. Avoid deleting metadata solely for passing its fresh TTL because that would remove the outage fallback.
- In development, select a title in `/dev/steam` and choose **Check metadata cache**. The guarded endpoint shows hit, miss or stale status, retrieval and expiry, age, source availability, coverage and refresh outcome. The original upstream inspector remains available.

The migration and rollback-only SQL tests ran on an isolated PostgreSQL engine using PGlite. A loopback Data API fixture backed by that database verified persisted hits across an app restart, concurrent requests, stale notices, retry deferral, database outage fallback, popularity, catalogue warming, quotas and the production-mode diagnostics guard. The official CSV exporter was exercised with synthetic pagination. Hosted Supabase and the authenticated Valve export still require verification with their respective development credentials.
