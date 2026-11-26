import "server-only";
import { querySharedDatabase, sharedDatabaseUrl } from "./v2SharedDatabase";

export function v2DatabaseConfigured() {
  return databaseConfig() !== null;
}

type DatabaseConfig = { mode: "shared"; connection: string } | { mode: "rest"; url: string; key: string };

function databaseConfig(): DatabaseConfig | null {
  const input = process.env.V2_SUPABASE_URL;
  const key = process.env.V2_SUPABASE_SERVICE_ROLE_KEY;
  const allowedOrigin = process.env.V2_SUPABASE_ALLOWED_ORIGIN;
  if (!input || !allowedOrigin) return null;
  try {
    const url = new URL(input);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
        url.origin !== allowedOrigin || url.username || url.password) return null;
    const overlapping = [process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL]
      .some((existing) => existing && new URL(existing).origin === url.origin);
    if (process.env.V2_SUPABASE_MODE === "shared-production") {
      const connection = overlapping && sharedDatabaseUrl(url, process.env);
      return connection ? { mode: "shared", connection } : null;
    }
    return !overlapping && key ? { mode: "rest", url: url.origin, key } : null;
  } catch {
    return null;
  }
}

export function positiveEnv(input: string | undefined, fallback: number, max: number) {
  const value = Number(input);
  return Number.isInteger(value) && value > 0 && value <= max ? value : fallback;
}

export async function v2Database<T>(path: string, options: { body?: unknown; prefer?: string } = {}): Promise<T> {
  const config = databaseConfig();
  if (!config) throw new Error("V2 database is disabled");
  if (config.mode === "shared") return querySharedDatabase(config.connection, path, options.body);
  const headers = { apikey: config.key, "Content-Type": "application/json",
    ...(config.key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${config.key}` }),
    ...(options.prefer ? { Prefer: options.prefer } : {}) };
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method: options.body === undefined ? "GET" : "POST",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(1500),
  });
  if (!response.ok) throw new Error(`V2 database request failed (${response.status})`);
  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}
