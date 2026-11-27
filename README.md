# PlaySafe.games

[PlaySafe.games](https://playsafe.games/) helps parents and carers worldwide check what is known about a Steam game before deciding whether it suits their child. PlaySafe is independent of Valve and Steam.

PlaySafe V2 applies versioned rules to available Steam data to highlight content concerns, online interaction, purchases and gameplay features. Reports display the age ratings Steam returns for countries and regions around the world, with official classifications and Steam-generated ratings shown separately. PlaySafe reports do not provide official classifications, comprehensive content reviews or guarantees of suitability.

PlaySafe requests Steam data in English using the Australian storefront context. Steam’s data can vary by game, edition and storefront.

## Local development

Use Node.js 24 and npm. The app uses Next.js App Router, TypeScript and Tailwind CSS.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Local development works with live Steam search and on-demand reports without Supabase or a Steam Web API key. Use `/dev/steam` to inspect Steam evidence in development. The original catalogue is available at `/catalogue`.

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Database and hosting

Production runs on Netlify and uses the existing PlaySafe Supabase project. V2 stores game evidence, catalogue titles, report view counts and rate-limit counters in dedicated tables. The shared-production connection uses a restricted database role with no access to the V1 cache. A separate Supabase project can optionally provide persistence for local development. Keep privileged credentials in server-side environment settings and out of Git.

The legacy `/api/games` endpoint retains its optional `steam_results_cache` adapter. The original table, cache settings and curated popular-games entry are described in the [V1 archive](docs/V1-ARCHIVE.md).

- [Production deployment, shared database settings and rollback](docs/PRODUCTION-DEPLOYMENT.md)
- [Database, caching and search](docs/DATABASE-AND-CACHING.md)
- [Steam catalogue export and import](docs/HOSTED-INFRASTRUCTURE.md#steam-catalogue-import-and-synchronisation)
- [Assessment engine](docs/ASSESSMENT-ENGINE.md) and [game validation results](docs/GAME-ASSESSMENT-VALIDATION.md)
- [SEO, analytics and public information](docs/SEO-AND-LAUNCH.md)
- [Retailer search links and future affiliate integration](docs/RETAILER-INTEGRATION.md)

## License

TBD.
