# PlaySafe V2 assessment engine

Phase 2 adds a deterministic evidence assessment to the development Steam inspector. It evaluates the Australian English metadata described in [STEAM-API.md](STEAM-API.md). The assessment itself performs no network calls. It uses local rules and templates, with no AI, paid API, or database dependency.

## Architecture

- [steamMetadata.ts](../lib/steamMetadata.ts) supplies normalized metadata from `appdetails`, `GetItems`, and `GetTagList`. Raw payloads remain visible in the inspector.
- [assessmentRules.ts](../lib/assessmentRules.ts) defines the category labels, selected tag and feature IDs, descriptor mapping, disclosure and consumer-advice patterns, recognized board identifiers, and game-specific overrides. Bump the rules version when a change can alter findings or guidance.
- [assessmentEngine.ts](../lib/assessmentEngine.ts) takes normalized metadata, an assessment timestamp, and optional rule configuration. The same inputs produce the same result. It returns twelve category findings, evidence and coverage, classifications, overall guidance, a templated summary, the timestamp, and rules version.
- `GET /api/dev/steam?appId=<id>` adds the assessment to the existing inspection response. Use `/dev/steam` to review category evidence, the assessment JSON, normalized Steam metadata, and upstream payloads. Both routes retain the development-mode guard. Known non-game listings are outside the assessment scope.

## Rules and evidence

On 25 November 2026 the live English tag catalogue had 446 entries and version hash `711684454`. The rules use exact numeric IDs from the catalogue and a small allowlist. Missing localized names do not prevent matching a known ID. App responses currently request up to 20 weighted tags. Weights are displayed for context and have no effect on state or ordering. [Steam tag API reference](https://steamapi.xpaw.me/IStoreService#GetTagList)

| Category | Examples of evidence |
| --- | --- |
| Violence | Violent tag, explicit violence in board advice or a disclosure, with strong or intense violence classed as significant |
| Graphic violence and gore | Gore tag, Steam's combined frequent violence or gore descriptor as a potential concern, or specifically disclosed gore or graphic violence |
| Strong language | Strong or explicit language, offensive or coarse language, profanity or swearing in an explicit source. Mild language and language learning are outside this category. |
| Sexual content and nudity | Nudity or sexual-content tags, Steam descriptor IDs 1, 3 and 4, or explicit content advice. Adult-only or frequent Steam descriptors and explicit wording can be significant. |
| Drugs and alcohol | Substance references in explicit evidence. Graphic or strong drug use can be significant. |
| Horror and frightening content | Exact horror tags, jump scares or frightening scenes in explicit evidence |
| Gambling | Exact Gambling tag or disclosed gambling. Simulated gambling is potential. Explicit real-money gambling can be significant. Card mechanics alone do not trigger this rule. |
| Mature themes | General mature-content descriptor or specific mature themes in advice or disclosures |
| Online interaction | Online Co-op tag, listed online multiplayer features, or explicit interaction or chat advice. Generic multiplayer, local play and LAN alone leave online interaction unknown. |
| User-generated content and modifications | Steam Workshop, explicit user-generated content disclosures, or the Moddable tag |
| In-game purchases | Listed in-app purchases or explicit purchase disclosures. The rules require affirmative evidence for paid random items. |
| Positive gameplay and educational features | Education, Language Learning, Puzzle, Relaxing and Local Co-Op tags, or listed shared/split-screen play. These identify gameplay features and do not verify educational outcomes. |

Findings use four states.

- **Insufficient information** is the default when the available evidence does not establish a finding. A missing tag, empty descriptor list or low classification cannot clear a category.
- **Potential concern** covers community warnings, advertised interaction or purchases, and direct evidence without a strong qualifier. Community tags alone cannot advance to significant.
- **Significant concern** requires explicit stronger evidence matched by a rule or recorded in a sourced override.
- **No concerns identified in available data** is used for an affirmative finding in the positive category or for a narrowly scoped documented review with no conflicting concern. It provides no game-wide clearance.

The strongest supported finding wins. For findings of equal strength, explanations prefer board advice, developer disclosures, documented reviews, Steam descriptor IDs, Steam-generated advice, listed features, and then community tags. Evidence from other sources remains visible. Positive evidence cannot lower a warning. One source can establish a finding without establishing full coverage of the category.

Known board authorities and Steam-generated identifiers (`steam_*`) are reported separately. Unrecognized identifiers remain in `otherRatings` and do not trigger findings. The Australian board fields `oflc` and `acb` are separate from `steam_australia`. Restricted Australian board values change the guidance template and are reproduced from Steam with a prompt to verify the edition. Rating codes alone do not imply specific content. There is no score or inferred age. [Australian Classification consumer advice and impact levels](https://www.classification.gov.au/classification-ratings/how-rating-decided)

## Coverage and limitations

Steam's developer notes and rating advice are processed with bounded phrase matches. The engine skips clauses with clear negation markers and avoids free text from titles, marketing descriptions, and genre labels. Mixed or ambiguous text may go unflagged. Publisher wording, locale, and edition can differ. No matching evidence is a coverage result and does not establish absence.

The numeric descriptor labels come from Valve's published five-category UGC descriptor enum. The live Store samples exposed IDs 1, 2 and 5. IDs 3 and 4 are based on the enum and were exercised with fixtures. Valve documents this enum for UGC, so applying it to Store payloads is an assumption. Unknown IDs are preserved in coverage and do not produce a category finding. The combined violence-or-gore ID cannot distinguish the two. [Valve Steamworks descriptor enum](https://partner.steamgames.com/doc/api/ISteamUGC#EUGCContentDescriptorID)

Coverage includes the number of tags and listed features received, disclosure availability, received descriptor IDs, and the number of categories with insufficient information. Category coverage distinguishes a direct finding, a tag-only finding, and no match. These indicators describe source availability, never completeness. Store data cannot establish current moderation, communications, third-party modifications, purchase mechanics, or Australian classification coverage for every release.

## Manual overrides

An override is keyed by Steam app ID and category. Provide the state, a parent-readable reason, a source name, and a direct source URL. Check the edition and record its scope in the reason or source name. An override adds a documented finding while retaining all source evidence. A category-level clearance cannot suppress an existing concern. The Cyberpunk 2077 override records high-impact themes from the Australian Classification entry for the original edition. [Australian Classification original release record](https://www.classification.gov.au/titles/cyberpunk-2077)

## Verification

Run `npm test` with Node 24 to execute the deterministic unit tests without contacting Steam. The tests cover incomplete data, conflicting signals, weight handling, classification provenance, multiplayer context, explicit content, false positives, sourced overrides, and non-game scope.

Live checks through the development inspector on 25 November 2026 covered the following apps and selected findings. Steam evidence is mutable. Use the app IDs to repeat the checks and compare the underlying evidence.

| Sample | Selected findings |
| --- | --- |
| Wobbly Life (1211020) | Online co-op and Workshop |
| BeamNG.drive (284160) | Local co-op and Moddable tag, with online interaction unknown |
| Disney Dreamlight Valley (1401590) | Listed in-app purchases and PEGI purchase advice |
| Garry's Mod (4000) | Online play and Workshop |
| Counter-Strike 2 (730) | Significant violence, Workshop and purchases; Australian Steam-generated rating kept separate |
| Cyberpunk 2077 (1091500) | Significant graphic violence, strong language and sexual content; Australian board and Steam-generated ratings kept separate |
| Stardew Valley (413150) | Simulated gambling and alcohol advice despite positive gameplay evidence |
| Terraria (105600) | Online play and Workshop |
| Subnautica (264710) | Community horror tags and board advice about online interactivity |
| The Binding of Isaac: Rebirth (250900) | Potential gore and horror from community tags |
| Balatro (2379780) | Potential gambling concern without a significant real-money finding |
| Kerbal Space Program (220200) | Education tag and Workshop |
