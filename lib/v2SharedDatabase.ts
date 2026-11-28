import { Pool } from "pg";

export function sharedDatabaseCa(env: NodeJS.ProcessEnv) {
  const encoded = env.V2_SHARED_DATABASE_CA;
  const pem = encoded ? Buffer.from(encoded, "base64").toString("utf8") : "";
  return pem.startsWith("-----BEGIN CERTIFICATE-----") ? pem : null;
}

export function sharedDatabaseUrl(origin: URL, env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== "production" || (env.CONTEXT && env.CONTEXT !== "production") ||
      env.PLAYSAFE_STAGING === "1" || env.V2_SUPABASE_MODE !== "shared-production" ||
      env.V2_SUPABASE_SERVICE_ROLE_KEY || !sharedDatabaseCa(env)) return null;
  const project = /^([a-z0-9]{20})\.supabase\.co$/.exec(origin.hostname)?.[1];
  if (origin.protocol !== "https:" || origin.port || !project) return null;
  const input = env.V2_SHARED_DATABASE_URL ?? "";
  if (!URL.canParse(input)) return null;
  const connection = new URL(input);
  if (connection.protocol !== "postgresql:" || connection.port !== "6543" ||
      !/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(connection.hostname) ||
      connection.username !== `playsafe_v2_app.${project}` || !connection.password ||
      connection.pathname !== "/postgres" || connection.search || connection.hash) return null;
  return connection.href;
}

const functions = {
  "rpc/v2_allow_request": ["v2_allow_request", "p_scope", "p_client", "p_global_limit", "p_client_limit"],
  "rpc/v2_save_metadata": ["v2_save_metadata", "p_app_id", "p_region", "p_language", "p_metadata", "p_sources",
    "p_coverage", "p_retrieved_at", "p_expires_at"],
  "rpc/v2_increment_popularity": ["v2_increment_popularity", "p_app_id", "p_region"],
} as const;

export function sharedStatement(path: string, body?: unknown) {
  const [endpoint, query] = path.split("?", 2);
  const params = new URLSearchParams(query);
  const args = body as Record<string, unknown> | undefined;
  if (endpoint === "v2_game_metadata" && !args) {
    const locale = [params.get("region")?.slice(3), params.get("language")?.slice(3)];
    const appId = params.get("app_id");
    const fields = `metadata, sources, coverage,
      to_char(retrieved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as retrieved_at,
      to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at`;
    if (appId) return { text: `select ${fields} from public.v2_game_metadata where region=$1 and language=$2 and app_id=$3 limit 1`,
      values: [...locale, appId.slice(3)] };
    const limit = Number(params.get("limit") ?? 500);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error("Invalid V2 report list limit");
    const sources = params.get("sources")?.slice(3) ?? '{"appdetails":true,"getItems":true,"getTagList":true}';
    return { text: `select ${fields} from public.v2_game_metadata where region=$1 and language=$2 and expires_at>$3
        and sources @> $4::jsonb
        order by v2_game_metadata.retrieved_at desc, app_id asc limit $5`,
      values: [...locale, params.get("expires_at")?.slice(3), sources, limit] };
  }
  if (endpoint === "v2_game_catalogue" && Array.isArray(body)) {
    return {
      text: `insert into public.v2_game_catalogue (app_id,region,language,title,capsule_image,release_year,platforms,source,observed_at)
        select app_id,region,language,title,capsule_image,release_year,platforms,source,observed_at
        from jsonb_to_recordset($1::jsonb) as game(app_id bigint,region text,language text,title text,
          capsule_image text,release_year integer,platforms text[],source text,observed_at timestamptz)
        on conflict (app_id,region,language) do update set title=excluded.title, capsule_image=excluded.capsule_image,
          release_year=excluded.release_year, platforms=excluded.platforms, source=excluded.source, observed_at=excluded.observed_at`,
      values: [JSON.stringify(body)],
    };
  }
  if (endpoint === "rpc/v2_find_games" && args) {
    return { text: `select app_id::double precision as app_id,title,capsule_image,release_year,platforms
      from public.v2_find_games($1,$2,$3)`, values: [args.p_query, args.p_region, args.p_language] };
  }
  if (args && Object.hasOwn(functions, endpoint)) {
    const [name, ...keys] = functions[endpoint as keyof typeof functions];
    return { text: `select public.${name}(${keys.map((_, index) => "$" + (index + 1)).join(",")}) as result`,
      values: keys.map((key) => args[key]), scalar: true };
  }
  throw new Error("Unsupported shared V2 database operation");
}

let pool: Pool | undefined;

export async function querySharedDatabase<T>(connectionString: string, ca: string, path: string, body?: unknown): Promise<T> {
  const { text, values, scalar } = sharedStatement(path, body);
  if (!pool) {
    pool = new Pool({ connectionString, ssl: { ca, rejectUnauthorized: true }, max: 2, allowExitOnIdle: true,
      connectionTimeoutMillis: 2500, query_timeout: 2500 });
    // Idle socket failures are handled by the pool and have no active query to reject.
    pool.on("error", () => {});
  }
  const { rows } = await pool.query(text, values);
  return (scalar ? rows[0]?.result : rows) as T;
}
