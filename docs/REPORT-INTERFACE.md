# PlaySafe V2 report interface

The report at `/games/<appId>/<title-slug>` uses the Steam App ID as its identity and redirects stale title slugs to the current title. Page metadata includes a title, description, canonical URL and Open Graph metadata. Set `NEXT_PUBLIC_SITE_URL` to the canonical site origin when running a separate hosted environment.

## Report structure

- [GameReport](../components/report/GameReport.tsx) lays out the Steam header, description, genres, platforms and release date, then puts the engine's overall guidance and summary before detailed findings.
- [ReportSections](../components/report/ReportSections.tsx) presents the twelve existing assessment categories in content, online safety, spending and positive gameplay groups. Each status pairs a text label with an icon and colour. Expandable evidence shows coverage, source, label, and the reason and reference for game-specific manual reviews.
- Australian official classifications and Steam-generated Australian ratings have separate cards. Other official authorities, other Steam-generated ratings and unrecognised authorities stay in separate expandable groups. Unavailable ratings remain explicitly unavailable.
- Steam platform flags, multiplayer modes, Workshop availability and listed downloadable add-ons provide context. An add-on listing does not establish its price or type of monetisation. Positive community tags are shown as descriptive gameplay signals, separate from the rules engine findings.
- [ReportActions](../components/report/ReportActions.tsx) uses native sharing where available and clipboard copy as a fallback. If clipboard access fails, the address becomes selectable. Both actions use the canonical report path on the current origin. Steam and another-game search are direct links.
- The report displays the assessment date and rules version and links to the public `/methodology` page. The [assessment engine](ASSESSMENT-ENGINE.md) still determines all findings. Highlighting significant concerns first is a presentation choice. A report with no flagged concern still shows insufficient information overall.

## Data and route states

Server-side rendering and page metadata share one inspection per request. The [Steam service](STEAM-API.md) retains its existing timeout and cache. Search displays a loading notice while the report navigation is pending. The report waits to verify the game before sending the page so unavailable listings and stale slugs can return the appropriate HTTP status. A verified base game can still render with incomplete Steam sources, with a partial-data notice and inline placeholders. Invalid IDs, non-games and listings Steam cannot identify resolve to the unavailable-game screen. When upstream requests fail and no usable base-game record remains, the report offers retry and search. The route also has an error boundary for unexpected failures.

No report operation writes to a database. The development inspector and original catalogue are still available at their earlier routes.

## Verification

Run `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` with production credentials absent. Report tests cover concern ordering, insufficient evidence, positive tag presentation and rating display.

Live Steam checks covered Wobbly Life, BeamNG.drive, Disney Dreamlight Valley, Garry's Mod, Counter-Strike 2, Cyberpunk 2077, Stardew Valley, Terraria, Subnautica, The Binding of Isaac: Rebirth, Balatro and Kerbal Space Program. The comparison included absent Australian classifications, significant findings, and the sourced Cyberpunk 2077 manual review.

Edge checks exercised desktop and 360-pixel touch layouts, expandable evidence, native share and clipboard integration with test doubles, a denied clipboard fallback, navigation to methodology, and a delayed report load. Synthetic Steam responses exercised the partial-data and upstream-error paths.
