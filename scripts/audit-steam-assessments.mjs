import { registerHooks } from "node:module";
import { setTimeout } from "node:timers/promises";
import { assessSteamGame } from "../lib/assessmentEngine.ts";
import { parseSteamAppId } from "../lib/gameSearch.ts";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return next("data:text/javascript,export%20%7B%7D", context);
    const extensionless = /^\.\/[^.]+$/.test(specifier);
    return next(extensionless ? specifier + ".ts" : specifier, context);
  },
});

const sample = [
  730, 1091500, 413150, 2379780, 339800, 1211020, 284160, 1401590, 4000, 105600,
  264710, 250900, 220200, 728880, 736260, 1055540, 1140630, 578080, 1172470, 570,
  440, 359550, 444090, 252950, 291550, 945360, 1086940, 271590, 1174180, 292030,
  553850, 782330, 550, 381210, 739630, 1966720, 2124490, 319630, 1388880, 234190,
  8930, 255710, 227300, 270880, 1245620, 620, 400, 960090, 1250410, 266010,
  274170, 620980, 383180, 291860, 92800,
];

const ids = process.argv.length > 2 ? process.argv.slice(2).map(parseSteamAppId) : sample;
if (ids.includes(null)) throw new Error("Every argument must be a Steam App ID.");

const { inspectSteamGame } = await import("../lib/steamMetadata.ts");
const collectedAt = new Date().toISOString();
for (const appId of ids) {
  const { metadata, sources } = await inspectSteamGame(appId);
  const assessment = metadata.appType === "game" ? assessSteamGame(metadata, collectedAt) : null;
  const { categories, officialClassifications, steamGeneratedRatings, rulesVersion } = assessment ?? {};
  const sourceStatus = Object.fromEntries(Object.entries(sources).map(([name, source]) => [
    name, { available: source.available, status: source.status, error: source.error,
      elapsedMs: source.elapsedMs, cached: source.cached },
  ]));
  console.log(JSON.stringify({
    collectedAt, rulesVersion, appId, title: metadata.title, sources: sourceStatus, officialClassifications,
    steamGeneratedRatings, disclosure: Boolean(metadata.developerMatureDisclosure),
    tags: metadata.tags, findings: categories?.map(({ category, state, evidence }) => ({ category, state, evidence })),
  }));
  if (Object.values(sourceStatus).some(({ status }) => status === 429)) {
    process.stderr.write("Steam rate limited this run. The output is incomplete.\n");
    process.exitCode = 1;
    break;
  }
  if (ids.length > 1) await setTimeout(450);
}
