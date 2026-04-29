# PlaySafe

PlaySafe is a lightweight web app designed to help parents and families discover
safe, age-appropriate video games.

The project initially supports **Steam** and focuses on:
- Age ratings
- Local multiplayer / split-screen support
- Controller compatibility

Additional game stores may be added in the future.

## 🚧 Project Status
Early development (MVP phase).

## 🎯 Goals
- Make it easy for parents to find family-friendly games
- Provide clear, trustworthy filters
- Avoid unnecessary complexity or accounts

## 🧰 Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Steam Store API

## Supabase Steam Results Cache

The `/api/games` route can optionally cache complete Steam result responses in
Supabase. If the Supabase env vars are not set, the app keeps using Steam
directly.

Create a table for testing:

```sql
create table if not exists steam_results_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

Set these server-side env vars:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STEAM_CACHE_TABLE="steam_results_cache"
STEAM_RESULTS_CACHE_TTL_SECONDS="21600"
STEAM_RESULTS_CACHE_CLEANUP_SAMPLE_RATE="0.02"
```

For quick local testing you can use `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead, but the table needs row-level
security policies that allow the cache reads and writes. A service role key is
simpler for server-only cache access and must never be exposed to the browser.

Add `refreshCache=true` to an `/api/games` request to bypass a cached result and
replace it. Responses include `x-playsafe-cache: hit` or `miss` while testing.
In development, the server also logs `Steam results cache: hit`, `miss`,
`stale`, or `disabled`. After successful cache writes, expired rows are cleaned
up occasionally based on `STEAM_RESULTS_CACHE_CLEANUP_SAMPLE_RATE`.

Popular games can also be driven from the same table. Add or update the row with
`cache_key = 'popular-games:v1'`, a far-future `expires_at`, and this payload
shape:

```json
{
  "games": [
    {
      "appId": 1211020,
      "name": "Wobbly Life",
      "releaseDate": "Sep 18, 2025",
      "priceLabel": "See Steam",
      "platforms": ["windows"]
    }
  ]
}
```

If that row is missing or invalid, the app falls back to `lib/popularGames.ts`.

## ⚠️ Disclaimer
PlaySafe is not affiliated with Valve or Steam.

## 📄 License
TBD
