import { once } from "node:events";

const key = process.env.STEAM_CATALOGUE_API_KEY;
if (!key) {
  process.stderr.write("Set STEAM_CATALOGUE_API_KEY for Valve’s official catalogue export.\n");
  process.exit(1);
}

const validAppId = (id) => Number.isInteger(id) && id > 0 && id <= 0xffffffff;
const encodeTitle = (title) => `"${title.trim().slice(0, 300).replaceAll('"', '""')}"`;

async function write(row) {
  if (!process.stdout.write(row + "\n")) await once(process.stdout, "drain");
}

let cursor = 0;
try {
  await write("app_id,title");
  for (;;) {
    const url = new URL("https://partner.steam-api.com/IStoreService/GetAppList/v1/");
    url.searchParams.set("key", key);
    url.searchParams.set("input_json", JSON.stringify({
      include_games: true, include_dlc: false, include_software: false, include_videos: false,
      include_hardware: false, have_description_language: "english", max_results: 10_000, last_appid: cursor,
    }));
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: "error" });
    if (!response.ok) throw new Error(`Steam returned HTTP ${response.status}`);
    const payload = (await response.json()).response;
    if (!Array.isArray(payload?.apps)) throw new Error("Steam returned an unexpected catalogue payload");
    for (const { appid, name } of payload.apps) {
      if (validAppId(appid) && appid > cursor && typeof name === "string" && name.trim()) {
        await write(`${appid},${encodeTitle(name)}`);
      }
    }
    if (!payload.have_more_results) break;
    if (!validAppId(payload.last_appid) || payload.last_appid <= cursor) throw new Error("Steam did not advance the catalogue cursor");
    cursor = payload.last_appid;
  }
} catch (error) {
  const safeMessage = error instanceof Error && error.message.startsWith("Steam ") ? error.message : "Steam catalogue request failed";
  process.stderr.write(`${safeMessage}. Discard the incomplete export.\n`);
  process.exitCode = 1;
}
