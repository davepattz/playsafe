# PlaySafe V2 Phase 6 pre-launch audit

**26 November 2026 · v2-development · Launch sign-off pending**

Phase 6 reviewed the Phase 1–5 development notes, V1 archive, public routes, Steam adapters, assessment rules, report and catalogue UI, cache layers, PostgreSQL migration and existing tests. The audit used public Steam data, local production-mode instances and isolated test data. Production database access, production jobs, deployment and branch merges were outside the work.

## Assessment accuracy

The [game validation report](GAME-ASSESSMENT-VALIDATION.md) records 55 live Steam checks and 54 generated assessments. It documents board and developer comparisons, incomplete evidence, significant findings alongside positive tags, a misleading community tag, and a regional metadata gap. Rules **1.1.0** omit the observed generic rating-band boilerplate, recognise frequent nudity and explicit online play, and add two sourced findings for Disney Dreamlight Valley and Silent Hill 2. Positive evidence continues to have no effect on concern severity. The tests exercise that invariant with mixed concern and positive signals.

A low rating or an empty source yields no clearance. Unknowns are identified per category and in the summary. Availability of the Steam endpoints is separate from completeness of the content evidence. Reports show a partial-source notice for missing endpoints and a separate stale notice with the evidence retrieval date when an expired snapshot is served.

## Security review

| Surface | Result |
| --- | --- |
| Public autocomplete | Query normalization trims, collapses whitespace, excludes controls and preserves Unicode at the 100-character limit. Steam URLs encode the term and use fixed hosts with redirects rejected. Search results verify app type and uint32 App IDs. Local queries use typed RPC arguments and SQL literal matching for wildcard characters. Errors and throttling return non-cacheable responses. |
| Public legacy catalogue | Request size, query, known filter values, page and result count are bounded. The route shares the search request budget. Cache bypass is gated behind development mode. Steam requests now have a timeout and reject redirects. Store links use the Steam origin and numeric App ID, including links rendered from older cached results. |
| Reports and inspector | Reports and development inspector validate IDs as positive uint32 integers. Both inspector URLs returned 404 under `next start`. The report returned 404 for an out-of-range ID and redirected an old title slug to its canonical location. |
| Untrusted text and URLs | Report evidence and legacy Steam text render as React text. No raw HTML insertion was found in the public routes. Steam artwork uses a credential-free HTTPS allowlist for the Store CDN, with direct browser loading and server image optimization disabled. The report's canonical link is based on the validated App ID and configured public origin. |
| Credentials and SSRF | Both database adapters are server-only. The V2 adapter requires the V2 URL, an exact separate origin and the V2 secret, refuses the configured V1 origin and disables redirects. Public site URL and historical V1 public URL/key fallbacks are client-safe configuration only. The catalogue key is used by the local opt-in script. Verify deployed environment scope and proxy header trust independently. |
| RLS and permissions | All four V2 tables enable RLS with no anonymous policies. Table and execution grants are revoked for public, anon and authenticated roles. Server calls use fixed paths, invoker functions and explicit grants to the service role. V1 hosted policies and grants are outside the checked-in migration. |
| Headers and CSP | Production responses included `nosniff`, frame denial, a referrer policy and CSP restricting object sources, base URLs, ancestors and form targets. The policy preserves Next inline bootstrapping plus the existing Analytics, Disqus and YouTube integrations. Script and frame source restrictions still require a hosted compatibility pass. HSTS depends on the HTTPS ingress. |
| Dependencies | Initial npm audit found 16 affected package entries, including a critical Next.js entry. Updated Next and its ESLint preset from 16.1.6 to 16.4.6 and applied compatible lockfile updates. The follow-up audit reported zero advisories at audit time. [Next.js advisories](https://github.com/vercel/next.js/security/advisories) |

The legacy results cache is optional. Existing V1 production settings, if reused for the V2 catalogue deployment, permit that catalogue to write and perform its normal sampled expiry cleanup. For isolation, configure an independently approved development cache or leave that adapter unconfigured during preview. The separate V2 adapter has no V1 fallback.

## Performance, reliability and experience

Local production HTTP timings include transfer of the full response body. Live Steam was reachable for this run. The samples use the in-process caches with Supabase unconfigured, and are descriptive timings for one machine.

| Request | Cold | Warm repeat |
| --- | ---: | ---: |
| Stardew Valley report | 705 ms | 24–29 ms |
| Portal 2 report | 364 ms | 17–25 ms |
| Cyberpunk 2077 report | 326 ms | 19–35 ms |
| Stardew Valley autocomplete | 1,064 ms | 5–6 ms |
| Portal autocomplete | 619 ms | 5 ms |
| Cyberpunk autocomplete | 789 ms | 4 ms |

All 12 parallel first requests for the Kerbal Space Program report returned 200 in 373–375 ms. The cache regression tests directly assert one load for concurrent same-ID calls in a process. Independent processes can still refresh the same title on a miss. The conditional PostgreSQL upsert protects stored coverage and retrieval ordering even with simultaneous refreshes. It does not prevent all duplicate upstream work.

Fixtures exercised Steam HTTP 429, HTTP 503 and timeouts plus unavailable metadata endpoints. The search endpoint reports upstream throttling with HTTP 503 and a retry hint, gateway failure with 502 and timeout with 504. Cache fixtures exercised stale responses, refresh deferral, database outage, incomplete first reads, simultaneous refreshes and a competing database writer. During a database outage, stale fallback requires a local remembered snapshot. An expired snapshot remains eligible for fallback while freshness and coverage are disclosed. No sustained Steam load or deliberate upstream quota exhaustion was performed.

Headless Edge exercised the homepage-to-report flow at **1440×900** and **390×844**. Arrow Down set the active descendant, Escape closed suggestions, Enter opened the intended game, and the clipboard received the canonical link. Both layouts fit their viewport and the report exposed its unknown status and methodology link. The final pass recorded home DOMContentLoaded at 77 ms on the desktop navigation and 32 ms on the subsequent mobile-size navigation with browser caches retained. These are local browser timings. Mobile-device Core Web Vitals, screen-reader behaviour and native share sheets are still open. All 13 existing image lint warnings were addressed using dimensioned `next/image` instances. Store artwork loads directly from Steam.

## Database and catalogue verification

The [Phase 5 SQL verification](../supabase/tests/v2_steam_cache.sql) passed on isolated in-memory PostgreSQL using PGlite. Migration, test fixture rollback, the down transaction below and reapplication all passed. Two independent production-mode Next.js processes shared a loopback Data API fixture backed by that SQL. With a global limit of two, requests split between instances returned 200, 200 and 429. After stopping the fixture API, a process with local budget reached Steam and a process at its local limit returned 429. This verifies application behaviour against the migrated SQL with a fixture transport. Hosted PostgREST, Supabase role behaviour and deployment ingress remain to be verified. Fixed-minute windows can allow bursts across boundaries. Client-level enforcement depends on a trusted ingress header and a server-side secret.

Autocomplete now supplements fewer than eight local results and title-only imports with Steam. It merges and ranks by title, deduplicates App IDs, and retains valid local artwork when the live row omits artwork. A populated regional local set can still satisfy the request. The SQL query uses exact, prefix and substring ranking with region preference and a 30-day observation window. The local catalogue's real title coverage, row size and query plan require a populated separate project.

Valve documents the authenticated `IStoreService/GetAppList` endpoint, game filters, `last_appid` pagination and incremental changes. The checked-in exporter can produce a CSV for a separate development import. The key was absent, so authenticated response shape, page counts and catalogue completeness remain unverified. Run a full export before enabling local coverage and repeat the full snapshot comfortably within 30 days, or use an incremental import with a verified watermark and periodic full reconciliation for unchanged titles and removals. Catalogue title rows seeded globally require regional verification when opened. [Valve IStoreService](https://partner.steamgames.com/doc/webapi/IStoreService#GetAppList)

The Phase 5 planning range of 4–15 KB per normalized metadata row suggests 40–150 MB raw for 10,000 snapshots, with compression, indexes and table overhead changing on-disk usage. A 100,000-title catalogue is provisionally tens of MB. Each successful cold report with persistence can generate up to five Data API operations, including the limiter calls and popularity increment. Hosted sizing should record `pg_total_relation_size` per table, catalogue cardinality, buffer use and query timing, cache hit and stale ratios, RPC volume, egress and retention. Hosted plan headroom remains unmeasured.

### Isolated migration and rollback

Use a database whose identity has been confirmed as development. Take a snapshot of any existing V2 data. Apply `supabase/migrations/20261125000100_v2_steam_cache.sql` with errors treated as fatal, then run `supabase/tests/v2_steam_cache.sql` using an administrative connection. The migration is transactional. The verification SQL rolls its own fixtures back. Verify roles through the hosted Data API separately before enabling the environment. A code rollback can disable the V2 adapter via its environment configuration and keep the tables for a later retry.

If removing the migration from a disposable development database, export any V2 data that needs keeping and disconnect V2 writers first. Run the following down transaction. It leaves the shared extension and schema in place because other objects can depend on them. Reconcile the development migration history with the deployment tool before reapplying.

```sql
begin;
drop function if exists public.v2_allow_request(text,text,integer,integer);
drop function if exists public.v2_increment_popularity(bigint,text);
drop function if exists public.v2_find_games(text,text,text);
drop function if exists public.v2_save_metadata(bigint,text,text,jsonb,jsonb,jsonb,timestamptz,timestamptz);
drop table if exists public.v2_request_windows, public.v2_game_popularity,
  public.v2_game_catalogue, public.v2_game_metadata;
commit;
```

## Outstanding issues

| Priority | Issue and release evidence needed |
| --- | --- |
| Critical | No open critical dependency advisory in the final npm audit. The branch's initial Next.js critical finding was addressed and requires the patched lockfile in the release build. |
| High | No isolated hosted Supabase credentials were available. Verify migration compatibility, Data API health and RLS, multi-instance quotas, stale behaviour and trusted client-IP ingress before launch. |
| High | Coverage gaps remain for regionally unavailable listings and incomplete adult-content evidence. Validate priority releases against the exact board edition and agreed scope, with Portal 2 and the adult sample as known test cases. |
| Medium | The authenticated Valve export and actual index completeness are unverified. Measure top results, age of observations, fallout from omissions and resource usage on a development import. |
| Medium | Same-title refresh coalescing is per process and local fallback quotas scale with instance count during database failures. Observe concurrent refresh load and validate the distributed budget in preview. |
| Medium | Legacy catalogue requests can still fan out to many Steam calls, and its heuristic filters depend on upstream HTML and incomplete data. Measure uncached mixed traffic and error behaviour in preview. |
| Medium | CSP has no script source policy. Test analytics, video and comments under a report-only policy before enforcing a stricter one. Complete mobile device, native sharing, screen-reader and network-throttled performance checks. |
| Low | Review misleading community-only tags and untranslated or qualified advice. Make paid randomness easier to identify where an official source explicitly discloses it. |

## Production readiness checklist

- [x] Run the sample, document gaps and record rule provenance and version.
- [x] Review public API inputs, server-side keys, output handling and route guards.
- [x] Resolve the flagged dependency versions and run the vulnerability scan again.
- [x] Check production-mode HTTP responses, navigation, canonical report sharing and the methodology link locally.
- [x] Pass all 38 Node tests, ESLint with zero warnings, TypeScript and the production build.
- [x] Verify local migration, rollback, reapplication and shared rate limits across two app processes.
- [ ] Verify hosted development Data API, permissions, migration and rollback with the isolated environment owner.
- [ ] Exercise production-equivalent multi-instance request budgets, stale-cache rates, legacy fan-out and application/Steam failures.
- [ ] Verify authenticated catalogue export, staged import, storage measurements and refresh ownership.
- [ ] Complete real-device accessibility, load and native-share checks and agree on a CSP rollout.
- [ ] Resolve or formally accept the accuracy gaps, set availability and latency thresholds, and agree on rollback criteria before launch approval.
