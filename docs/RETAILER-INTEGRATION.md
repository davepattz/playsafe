# Retailer integration

**Where to buy** is a collapsed panel beside **View on Steam**. It uses the report’s Steam title to generate retailer search links. Product availability, editions, activation platform, region and prices must be checked with the retailer. The panel stays hidden when Steam confirms the base game is free. Older cached reports can use Steam’s Free To Play genre when the free-to-play flag is missing. Reports with neither signal show search links until their metadata refreshes normally.

## Search destinations

| Retailer | Status | Search format and verification |
|---|---|---|
| Fanatical | Enabled | `https://www.fanatical.com/en/search?search=<encoded Steam title>`. Encode spaces as `%20`; the plus-encoded Red Dead Redemption 2 query redirected to an unrelated publisher page in browser checks. |
| Green Man Gaming | Enabled | `https://www.greenmangaming.com/search?query=<encoded Steam title>`. The project owner confirmed the Wobbly Life search in their browser. Automated browser checks encountered a CAPTCHA before results were visible. |
| Humble Store | Enabled | `https://www.humblebundle.com/search?query=<encoded Steam title>`. The browser displayed a results heading for Wobbly Life on this route. Some requests returned a temporary search error during verification. |

Maintain the approved HTTPS origins and retailer configuration in `lib/retailers.ts`. Recheck search behavior for punctuation, editions and titles that produce no results before enabling a retailer. Add only authorised retailers. Search links open in a separate tab. Report generation makes no requests to retailers.

## Enabling affiliate links in the future

1. Obtain approval from each retailer’s affiliate programme and verify its documented search and deep-link formats, destinations, disclosure requirements and regional terms.
2. Introduce a separate per-retailer affiliate opt-in. Keep sensitive credentials in server-side environment variables. Validate any approved tracking origin and destination format before emitting a link.
3. Select the first available link in this order: verified affiliate product, verified standard product, supported affiliate search, standard search. Hide the retailer when it has no verified format. Match direct product links to verified Steam App IDs and retailer product identifiers.
4. Add `rel="sponsored noopener noreferrer"` to active affiliate links. When affiliate offers are present, display “PlaySafe may earn a commission from qualifying purchases. This does not influence our safety assessments.” Update About, FAQ, Privacy and Terms for the actual arrangement.
5. Extend the consent-controlled analytics types as needed for `affiliate_link_clicked`, `compare_prices_opened` and `retailer_country_changed`. Outbound clicks measure navigation, and purchase reporting requires a separate verified outcome.

The launch emits only standard retailer search links. Its analytics use the existing opt-in and send a Steam App ID for panel opens, plus retailer name, link type and affiliate status for outbound clicks. `steam_store_clicked` replaces the previous `steam_store_click` event name for reports.

## Price comparison

Use an approved retailer feed or API only once product matching is reliable. Match the exact Steam App ID and verified retailer product ID, edition, activation platform and region before comparing. Treat DLC, soundtracks, bundles, remasters and non-Steam keys as distinct products.

The existing disclosure, action row and panel can support **Compare prices** once comparable offers are available. Support manual country selection, current and original price, currency, discount, activation platform, regional restrictions, verified purchase link and price timestamp. Sort comparable offers by price. Show a lowest-listed price only among offers comparable for the selected country and currency.
