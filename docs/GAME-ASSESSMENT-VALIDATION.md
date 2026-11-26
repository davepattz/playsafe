# Game assessment validation

Run on 26 November 2026 in Brisbane with the Australian English Steam storefront and rules **1.1.0**. The sample spans family games, puzzles, learning-oriented games, simulation, shooters, horror, online multiplayer, adult content and spending mechanics. The 55 requested App IDs produced 54 verified base-game assessments and one regionally unavailable result. All three Steam sources were available for each assessed game. A responding source could still omit ratings, disclosures or features.

The table lists every generated concern and positive finding. Board codes are the official-authority fields **supplied by Steam**, with the authority before the code. Independent board records and publisher disclosures are linked in the comparisons below. A dash means no evidence produced an entry in that column. All unlisted categories stayed insufficient. This is a purposive sample and does not support a population-wide accuracy rate.

**Category key** V = violence, G = graphic violence/gore, L = strong language, S = sexual content/nudity, D = drugs/alcohol, H = horror, W = gambling, M = mature themes, O = online interaction, U = user content/mods, P = purchases. **+** indicates a positive gameplay finding. An asterisk after a category marks it significant.

## Independent comparisons and open accuracy gaps

| Sample | Finding |
| --- | --- |
| Cyberpunk 2077 | Significant violence, gore, language, mature themes and sexual content agree with the developer's disclosure and the original Australian board advice. Steam's separate Steam-generated rating remains distinct. [Australian Classification](https://www.classification.gov.au/titles/cyberpunk-2077) |
| Stardew Valley | The engine identified violence, substances and simulated gambling alongside positive gameplay. The ESRB's mild language and mild blood did not trigger the strong-language or graphic-violence categories. Steam's listed online feature still matters when an older rating record omits interactive elements. [ESRB PC and console release](https://www.esrb.org/ratings/34835/stardew-valley/) |
| Balatro | Potential gambling from a community tag is consistent with gambling themes. The display should explain that the board identifies poker-themed scoring without wagering. The updated PEGI 12 ruling and the ESRB E10+ console record are useful context when Steam lacks those ratings. [PEGI appeal decision](https://pegi.info/et/node/83) · [ESRB console record](https://www.esrb.org/ratings/39921/balatro/) |
| HuniePop | Frequent nudity now independently triggers a significant finding from the developer's note if descriptor IDs disappear. The puzzle signal remains visible, and the sexual-content warning stays significant. [Developer disclosure](https://store.steampowered.com/app/339800?l=english) |
| PUBG: BATTLEGROUNDS | Rules 1.0.0 turned a generic USK rating-band paragraph into game-specific horror and significant violence. Rules 1.1.0 omit that boilerplate and retain ESRB violence and Users Interact. The separate Steam descriptor conflates frequent violence and gore and still warrants a qualified potential finding. [Steam product listing](https://store.steampowered.com/app/578080/) |
| Disney Dreamlight Valley | Steam supported purchases but lacked a usable interactive element. The sourced PC-compatible ESRB entry now supplies online interaction despite the low rating and Relaxing tag. [ESRB](https://www.esrb.org/ratings/38133/disney-dreamlight-valley/) |
| SILENT HILL 2 | Steam's Australian advice misspelled the intensity qualifier. The sourced PC/PS5 board record now supplies the significant horror finding. The underlying edition and release still matter. [Australian Classification](https://www.classification.gov.au/titles/silent-hill-2-0) |
| Rainbow Six Siege | The purchase concern includes PEGI advice identifying random items. This is spending evidence and does not imply real-money gambling. The spending heading remains general, so readers need to open evidence to see the mechanics. [PEGI Rainbow Six records](https://pegi.info/search-pegi?q=rainbow+six) |
| Portal 2 | The ESRB PC record identifies fantasy violence that the sampled Steam metadata did not communicate. Violence remained insufficient in the generated output. Mild language is outside the strong-language category. [ESRB](https://www.esrb.org/ratings/30729/portal-2/) |
| Microsoft Flight Simulator | Steam returned a Psychological Horror community tag alongside a low-rated simulation listing. The engine promoted it to a potential concern but had no supporting direct horror evidence. Treat this as a likely misleading tag. Verify with a reviewed source before adding a title-specific rule. The purchase feature was direct. [Steam product listing](https://store.steampowered.com/app/1250410/) |
| Hotline Miami 2 | Both per-app Steam endpoints returned HTTP 200 without usable regional game data. PlaySafe cannot generate a report. The Australian board's original release has a Refused Classification record. The report's unavailable state indicates a gap in Steam coverage. [Australian Classification](https://www.classification.gov.au/titles/hotline-miami-2-wrong-number) |

Non-English board words, spelling variants, mixed clauses, ambiguous tags, Store edition mismatches and missing interactive elements can cause under-detection. For example, New Super Lucky’s Tale lists Portuguese fantasy-violence advice without a matching English violence signal. Tags can be humorous or disputed and are never independently sufficient for a significant finding. The manual comparison covers the listed cases explicitly. For other rows the comparison is between generated findings and available upstream board advice, listed features, disclosures and tags, with no independent edition-by-edition board lookup.

To repeat the observations with Node 24.21, run **node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/audit-steam-assessments.mjs**. Optional App ID arguments select specific titles. The script reads public Steam services sequentially, stops on HTTP 429, and emits JSON lines containing the timestamp, source availability, board advice, tags and matched evidence.

## Sample results

| Title and Steam listing | Steam-supplied board codes | Developer disclosure | Generated findings |
| --- | --- | --- | --- |
| [Counter-Strike 2 (730)](https://store.steampowered.com/app/730/) | USK 16, DEJUS 18 | Yes | V\*, G, M, O, U, P |
| [Cyberpunk 2077 (1091500)](https://store.steampowered.com/app/1091500/) | ESRB M, PEGI 18, OFLC R18, NZOFLC R18, KGRB 18, DEJUS 18, MDA M18, CSRR R, USK 18, CERO Z, FPB 18 | Yes | V\*, G\*, L\*, S\*, D, M\*, P |
| [Stardew Valley (413150)](https://store.steampowered.com/app/413150/) | ESRB E10, PEGI 12, USK 6, OFLC PG, DEJUS 12 | — | V, D, W, O, + |
| [Balatro (2379780)](https://store.steampowered.com/app/2379780/) | DEJUS L | — | W, + |
| [HuniePop (339800)](https://store.steampowered.com/app/339800/) | DEJUS 18 | Yes | S\*, D, M, + |
| [Wobbly Life (1211020)](https://store.steampowered.com/app/1211020/) | DEJUS 6 | — | O, U, + |
| [BeamNG.drive (284160)](https://store.steampowered.com/app/284160/) | DEJUS L | — | U, + |
| [Disney Dreamlight Valley (1401590)](https://store.steampowered.com/app/1401590/) | ESRB E, PEGI 3, KGRB ALL, DEJUS L, USK 12, CSRR G | — | O, P, + |
| [Garry's Mod (4000)](https://store.steampowered.com/app/4000/) | DEJUS 12 | — | O, U |
| [Terraria (105600)](https://store.steampowered.com/app/105600/) | DEJUS 6 | — | O, U |
| [Subnautica (264710)](https://store.steampowered.com/app/264710/) | ESRB E10, OFLC PG, DEJUS 10, USK 6, CSRR C12 | — | V, H, O |
| [The Binding of Isaac: Rebirth (250900)](https://store.steampowered.com/app/250900/) | DEJUS 14 | — | G, H, M, + |
| [Kerbal Space Program (220200)](https://store.steampowered.com/app/220200/) | ESRB E, OFLC PG, KGRB ALL, DEJUS L | — | U, + |
| [Overcooked! 2 (728880)](https://store.steampowered.com/app/728880/) | DEJUS 6 | — | O, + |
| [Baba Is You (736260)](https://store.steampowered.com/app/736260/) | ESRB E, PEGI 3, USK 0, KGRB ALL, DEJUS L | — | + |
| [A Short Hike (1055540)](https://store.steampowered.com/app/1055540/) | ESRB E, PEGI 3, USK 0, CERO A, DEJUS L | — | + |
| [Red Wings: Aces of the Sky (1140630)](https://store.steampowered.com/app/1140630/) | DEJUS 10 | — | + |
| [PUBG: BATTLEGROUNDS (578080)](https://store.steampowered.com/app/578080/) | KGRB 19, ESRB T, USK 16, PEGI 16, OFLC MA15, NZOFLC MA15, DEJUS 16, CSRR C15 | — | V, G, M, O |
| [Apex Legends™ (1172470)](https://store.steampowered.com/app/1172470/) | ESRB T, PEGI 16, USK 16, OFLC MA15, NZOFLC R13, KGRB 18, DEJUS 18, FPB 16, CSRR C15 | — | V\*, L, D, O, P |
| [Dota 2 (570)](https://store.steampowered.com/app/570/) | KGRB 12, USK 12, DEJUS 18 | Yes | V, S, D, H, M, O, U, P |
| [Team Fortress 2 (440)](https://store.steampowered.com/app/440/) | USK 16, DEJUS 18 | — | V, S, O, U, P |
| [Tom Clancy's Rainbow Six Siege (359550)](https://store.steampowered.com/app/359550/) | PEGI 18, ESRB M, DEJUS 16, USK 16, OFLC MA15, NZOFLC R16, CERO D, CSRR C15, FPB 18 | Yes | V\*, L\*, D, H, M, O, P |
| [Paladins® (444090)](https://store.steampowered.com/app/444090/) | ESRB T, PEGI 12, USK 12, OFLC M, NZOFLC M, DEJUS 12 | — | V, O, P |
| [Rocket League® (252950)](https://store.steampowered.com/app/252950/) | ESRB E, OFLC G, NZOFLC G, PEGI 3, USK 6, DEJUS L, FPB A | — | O, U, + |
| [Brawlhalla (291550)](https://store.steampowered.com/app/291550/) | ESRB E10, PEGI 7, DEJUS 18 | — | V, O, + |
| [Among Us (945360)](https://store.steampowered.com/app/945360/) | DEJUS L | — | O, P |
| [Baldur's Gate 3 (1086940)](https://store.steampowered.com/app/1086940/) | ESRB M, PEGI 18, DEJUS 16, CSRR R, USK 18 | Yes | V\*, G\*, L\*, S\*, H, M, O |
| [Grand Theft Auto V Legacy (271590)](https://store.steampowered.com/app/271590/) | ESRB M, KGRB 18, PEGI 18, USK 18 | — | V\*, G\*, L\*, S\*, D, W, M, O, U |
| [Red Dead Redemption 2 (1174180)](https://store.steampowered.com/app/1174180/) | ESRB M, PEGI 18, USK 18, OFLC MA15, NZOFLC R16, KGRB 18, DEJUS 18, FPB 18, CSRR R | — | V\*, G\*, L\*, S, D, W, M\*, O, P |
| [The Witcher 3: Wild Hunt — Remastered (292030)](https://store.steampowered.com/app/292030/) | ESRB M, PEGI 18, USK 18, OFLC R18, NZOFLC R16, KGRB 18, DEJUS 16, MDA M18, FPB 18, CSRR R | Yes | V\*, G\*, L\*, S\*, D, M, U, P |
| [HELLDIVERS™ 2 (553850)](https://store.steampowered.com/app/553850/) | ESRB M, USK 16, OFLC MA15, NZOFLC R16, CERO Z, FPB 18, CSRR R, MDA M18, DEJUS 18, PEGI 18, KGRB 18 | Yes | V\*, G\*, H, M, O, P |
| [DOOM Eternal (782330)](https://store.steampowered.com/app/782330/) | ESRB M, PEGI 18, USK 18, OFLC R18, NZOFLC R16, DEJUS 18, CSRR R, KGRB 18, FPB 18 | Yes | V\*, G\*, H, M, O |
| [Left 4 Dead 2 (550)](https://store.steampowered.com/app/550/) | OFLC R18, KGRB 18, USK 18, DEJUS 14 | Yes | V\*, G\*, L\*, H, M, O, U, + |
| [Dead by Daylight (381210)](https://store.steampowered.com/app/381210/) | ESRB M, OFLC MA15, NZOFLC R16, PEGI 18, DEJUS 18, USK 18 | — | V\*, G\*, L\*, S, H\*, M, O |
| [Phasmophobia (739630)](https://store.steampowered.com/app/739630/) | DEJUS 12 | — | H, O |
| [Lethal Company (1966720)](https://store.steampowered.com/app/1966720/) | DEJUS 16 | Yes | G\*, D, H, M, O |
| [SILENT HILL 2 (2124490)](https://store.steampowered.com/app/2124490/) | DEJUS 18, ESRB M, PEGI 18, USK 18, OFLC MA15, NZOFLC R16, CERO C, KGRB 19, FPB 18, CSRR C15 | Yes | V, G\*, S\*, H\*, M |
| [Life is Strange - Episode 1 (319630)](https://store.steampowered.com/app/319630/) | ESRB M, PEGI 16, USK 12, OFLC M, NZOFLC M, FPB 18, CSRR R | — | V, L\*, S, D, M |
| [Doki Doki Literature Club Plus! (1388880)](https://store.steampowered.com/app/1388880/) | DEJUS 16 | Yes | V, G, S, H, M |
| [Receiver (234190)](https://store.steampowered.com/app/234190/) | DEJUS 10 | — | H, U |
| [Sid Meier's Civilization® V (8930)](https://store.steampowered.com/app/8930/) | ESRB E10, KGRB 12, PEGI 12, USK 12, OFLC PG, NZOFLC PG | — | V, D, O, U |
| [Cities: Skylines (255710)](https://store.steampowered.com/app/255710/) | ESRB E, PEGI 3, USK 0, DEJUS 14 | — | U |
| [Euro Truck Simulator 2 (227300)](https://store.steampowered.com/app/227300/) | PEGI 3, USK 0, DEJUS L | — | O, U, + |
| [American Truck Simulator (270880)](https://store.steampowered.com/app/270880/) | DEJUS L | — | O, U, + |
| [ELDEN RING (1245620)](https://store.steampowered.com/app/1245620/) | ESRB M, DEJUS 16, PEGI 16, USK 16, NZOFLC R13, FPB 16, CSRR R, CERO D | — | V, G\*, H, M, O, P |
| [Portal 2 (620)](https://store.steampowered.com/app/620/) | USK 12, DEJUS 12 | — | O, U, + |
| [Portal (400)](https://store.steampowered.com/app/400/) | USK 12, DEJUS 10 | — | + |
| [Bloons TD 6 (960090)](https://store.steampowered.com/app/960090/) | DEJUS 18 | — | O, P |
| [Microsoft Flight Simulator (2020) 40th Anniversary Edition (1250410)](https://store.steampowered.com/app/1250410/) | ESRB E, PEGI 3, USK 0, OFLC G, NZOFLC CTC, CERO A, FPB A, DEJUS L, CSRR P6 | — | H, P |
| [LYNE (266010)](https://store.steampowered.com/app/266010/) | DEJUS L | — | + |
| [Hotline Miami 2 (unavailable in sample) (274170)](https://store.steampowered.com/app/274170/) | — | — | — |
| [Beat Saber (620980)](https://store.steampowered.com/app/620980/) | DEJUS 6 | — | O, U |
| [Dead Island: Riptide Definitive Edition (383180)](https://store.steampowered.com/app/383180/) | ESRB M, PEGI 18, OFLC R18, CSRR R, NZOFLC R18, DEJUS 18, USK 18 | Yes | V\*, G\*, L\*, S, D, H, M, O |
| [Pit People® (291860)](https://store.steampowered.com/app/291860/) | ESRB T, DEJUS 6 | — | V, O, + |
| [SpaceChem (92800)](https://store.steampowered.com/app/92800/) | DEJUS 12 | — | + |
