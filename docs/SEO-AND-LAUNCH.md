# PlaySafe V2 SEO and launch

**26 November 2026 · Phase 7B · v2-development**

Phase 7B keeps the PlaySafe name, logo, palette, fonts and existing published paths. It builds on the [Phase 6 audit](PRE-LAUNCH-AUDIT.md), [Phase 7A staging controls](HOSTED-INFRASTRUCTURE.md) and [V1 archive](V1-ARCHIVE.md). Hosted infrastructure, production analytics configuration and launch approval remain pending.

## Reports and discovery

- Report titles use **Is [game title] safe for kids?**. The description identifies the game and describes the available evidence in its parents guide. The report itself presents the evidence and its limitations. Canonical, Open Graph and share URLs use the configured `NEXT_PUBLIC_SITE_URL`, Steam App ID and normalized title slug. A verified old slug redirects permanently with HTTP 308. Social previews use allowlisted Steam header artwork, with the PlaySafe logo card as a fallback. [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- An indexable report needs a fresh, released base-game snapshot with all three Steam sources present, plus at least two non-positive categories with direct concern evidence, or one such category and an official board classification. Community tags alone, blank classifications, positive gameplay signals and the absence of warnings cannot make a report indexable. Missing sources, expired evidence, unavailable reports and low-information reports are excluded. Eligible reports with unknown individual categories still identify those unknowns.
- The XML sitemap preserves public content URLs and includes eligible canonical reports from the most recent **500** fresh, complete AU English persisted snapshots. The query is bounded and coalesced for five minutes per instance. Eligibility and expiry are checked when producing the XML. Stored retrieval time supplies `lastmod`; a database failure leaves the static URLs available. At larger scale, add sitemap shards only after coverage and indexing have been reviewed.
- Known crawlers, link preview clients, browser prefetches and clients without a browser-navigation or same-origin Next.js navigation signal use stored evidence only. They cannot populate or refresh reports and do not increment report popularity. A miss produces a 404. Expired stored reports can be displayed with an outdated notice and noindex. Interactive browser requests retain the existing shared report and metadata budgets. These request signals limit automated creation by ordinary crawlers. They are not authentication and can be imitated by other HTTP clients. Keep the hosted ingress limits and monitor unusual traffic. Browsers that send neither supported signal can only open stored reports.
- Production robots points to the sitemap and discourages API and dev crawling. Known crawler identities receive 403 on search and legacy catalogue APIs. Report pages remain crawlable so search engines can read noindex. Staging uses an empty sitemap, disallow-all robots, a noindex HTTP header and no analytics. Protected Netlify access for all staging URLs remains a hosting requirement. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- The home page declares a simple `WebSite` entity. Reports omit rating, review and product rich results. The available age classifications identify board decisions and do not represent user ratings or PlaySafe reviews. No review counts, star scores, prices or classifications are invented.

## Analytics and personal information

The existing GA4 stream remains configured in the code. The browser loads the tag only after opt-in from **Privacy policy** on a production-mode, non-staging build. This choice is browser-local and reversible. Automatic page view in the code is disabled, as are Google signals and ad personalization signals. The application supplies five explicit events.

| Event | When it fires | Event data |
| --- | --- | --- |
| `game_search` | One current successful autocomplete response, including empty results | Result count |
| `game_select` | Selecting a suggestion to open a report | Steam App ID |
| `report_view` | A rendered game report once per mounted visit | Steam App ID |
| `report_share` | Native share or clipboard copy completes successfully | Steam App ID and method |
| `steam_store_click` | Activating a game Store link on a report or catalogue card | Steam App ID |

Search requests still use the term for matching, including forwarding it to Steam as needed. The analytics payload omits search text, referrer and URL query strings, and it uses a stripped page URL. The app does not send names, contact details, account identifiers or raw IPs in event parameters. Google Analytics and hosting providers have their own request handling and data retention. Legacy video and comment embeds have separate provider policies.

Before enabling the production rollout, the GA owner should confirm Enhanced Measurement is disabled for the stream, including history page views, site search and outbound clicks, and check DebugView for exactly one event per interaction and no search terms. Retention, stream settings and controller/contact details should be reviewed against the privacy notice. Staging does not load the production tag, so use a local blocked transport or a separate approved test stream. [GA4 page views and Enhanced Measurement](https://developers.google.com/analytics/devguides/collection/ga4/views) · [Google tag privacy settings](https://developers.google.com/tag-platform/security/guides/privacy)

## Public pages and V1 migration

The About, FAQ, methodology, Privacy, Terms and Contact pages explain the independent rule-based service and its limits. The shared footer links to these pages. The Contact page links to the public GitHub Issues channel for non-sensitive corrections. Set `NEXT_PUBLIC_CONTACT_EMAIL` to a monitored public mailbox before launch for private feedback and privacy requests. The owner should review the policy and terms against actual hosting, retention, analytics and contact practices before publication.

| V1 URL or feature | Launch treatment |
| --- | --- |
| `/` | Preserve the existing homepage URL with PlaySafe game search and a visible Catalogue link. V1 kept filters in component state, with no checked-in persistent public filter URLs to redirect. |
| `/catalogue` and `/api/games` | Retain the catalogue and its endpoint. The API is excluded from crawler fetching. Keep existing featured and affiliate content pending a separate catalogue decision. |
| `/faq`, `/news`, `/news/top-10-video-games-for-kids-under-5-on-steam` | Preserve public URLs, article content and canonicals. There is no checked-in renamed V1 article that needs a redirect. |
| `/sitemap.xml`, `/favicon.ico` | Preserve existing URLs. The existing favicon is retained and the Apple touch icon is derived from its mark. |
| Old report slugs | Permanently redirect to the verified title slug using the same Steam App ID. Unmatched paths return 404 with a navigation recovery path. |
| Legacy Disqus | Keep existing news comments and identifiers in production. Staging suppresses comment embeds and counters. Inventory comment traffic and moderation ownership before deciding whether to retire Disqus. |
| Background jobs | No Netlify scheduler, Supabase Cron definition or catalogue job is checked in. Legacy sampled expiry cleanup is request-driven and still serves the optional V1 cache. A historical full-metadata crawl or duplicate catalogue importer may be redundant if found. Confirm actual schedules and consumers in the provider dashboards before proposing removal. No jobs were changed. |

Use a Search Console export, access logs and inbound links to identify additional historically indexed URLs before launch. Add permanent redirects only for verified equivalent destinations. Continue to serve the legacy catalogue and preserve the public site's chosen HTTPS origin. [Google canonical migration guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

## Local verification

The production build used a loopback Data API fixture with fresh informative, fresh low-information, incomplete and expired snapshots. The fixture checks covered the canonical and social tags, an HTTP 308 redirect, selective sitemap inclusion, the sitemap query cache, an unavailable link-preview request, indexing directives, public information pages and the development-route 404 guards. Crawler requests did not increment report popularity.

Headless Edge at 1440×900 and 390×844 verified the search-to-report flow, keyboard selection, Escape and Enter, viewport fit, unknown evidence, methodology links and clipboard sharing of the canonical URL. Google network delivery was blocked while the local event queue was checked. Analytics initialized only after opt-in and recorded one event of each expected type per tested visit, with no search text or referrer. Native sharing, real-device accessibility, hosted CDN behaviour and GA4 collection remain pending.

A separate staging-mode production build returned disallow-all robots, an empty XML sitemap and the noindex header. The consent control was unavailable in staging, neither analytics nor legacy comments were present, and the legacy database sentinel received no requests. Production-only development route guards still returned 404. All 41 automated tests passed.

## Production deployment and rollback checklist

- [x] Implement report canonicals, permanent redirects, social cards, evidence-based noindex and a cache-only sitemap.
- [x] Keep staging disallowed and preserve V1 public URLs, branding and priority content.
- [x] Add public information pages, feedback pathway, in-browser analytics opt-in and explicit usage events.
- [ ] Complete [Phase 7A hosted checks](HOSTED-INFRASTRUCTURE.md), including protected primary and immutable staging URLs, database isolation, Steam fallback and hosted function performance.
- [ ] Confirm the private contact mailbox, analytics stream settings and privacy/terms ownership. Run the real-device VoiceOver, TalkBack, zoom, native sharing and interrupted-network checklist.
- [ ] Compare hosted sitemap and representative indexed report metadata, old-slug redirect, unsupported IDs and stale/partial responses. Confirm known crawlers and link previews cause no Steam refreshes. Inspect Search Console coverage after submitting the production sitemap.
- [ ] Confirm origin, HTTPS, Netlify production branch and inherited environment variables. Record previous deploy ID, application revision and database migration state. Obtain release approval and verify the backup and rollback plan.
- [ ] After a later approved deployment, smoke-test home/search, report canonicals, legacy catalogue/news, robots, sitemap and public links. Monitor 404, 429 and 5xx rates, upstream timeout and stale rates, report/API latency and analytics events. Agree on thresholds before launch.
- [ ] If launch thresholds fail, restore the prior application deploy and matching environment configuration. Keep V1 settings/jobs and V2 data intact. Any approved database action follows the separate [migration and rollback runbook](HOSTED-INFRASTRUCTURE.md#production-migration-and-rollback-runbook-for-a-later-approved-release).

No production deployment, migrations, job changes or branch merges were performed.
