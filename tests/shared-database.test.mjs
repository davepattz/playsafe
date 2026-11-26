import assert from "node:assert/strict";
import test from "node:test";
import { sharedDatabaseUrl, sharedStatement } from "../lib/v2SharedDatabase.ts";

const project = "abcdefghijklmnopqrst";
const origin = new URL(`https://${project}.supabase.co`);
const production = {
  NODE_ENV: "production", V2_SUPABASE_MODE: "shared-production",
  V2_SHARED_DATABASE_CA: Buffer.from("-----BEGIN CERTIFICATE-----\nfixture").toString("base64"),
  V2_SHARED_DATABASE_URL: `postgresql://playsafe_v2_app.${project}:fixture@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
};

test("shared production requires the dedicated role and matching project without a service key", () => {
  assert.equal(sharedDatabaseUrl(origin, production), production.V2_SHARED_DATABASE_URL);
  for (const denied of [
    { NODE_ENV: "development" }, { PLAYSAFE_STAGING: "1" }, { CONTEXT: "branch-deploy" },
    { CONTEXT: "deploy-preview" }, { V2_SUPABASE_MODE: "" }, { V2_SUPABASE_SERVICE_ROLE_KEY: "fixture" },
    { V2_SHARED_DATABASE_CA: "" },
    ...["postgres", "other_app"].map((role) => ({
      V2_SHARED_DATABASE_URL: production.V2_SHARED_DATABASE_URL.replace("playsafe_v2_app", role),
    })),
    { V2_SHARED_DATABASE_URL: production.V2_SHARED_DATABASE_URL.replace(project, "zyxwvutsrqponmlkjihg") },
  ]) assert.equal(sharedDatabaseUrl(origin, { ...production, ...denied }), null);
});

test("shared queries only dispatch V2 operations and bind caller values", () => {
  assert.throws(() => sharedStatement("steam_results_cache", []), /Unsupported shared/);
  assert.throws(() => sharedStatement("rpc/steam_results_cache", {}), /Unsupported shared/);
  assert.throws(() => sharedStatement("rpc/toString", {}), /Unsupported shared/);
  const query = "100% 'Games'";
  const statement = sharedStatement("rpc/v2_find_games", { p_query: query, p_region: "AU", p_language: "english" });
  assert.deepEqual(statement.values, [query, "AU", "english"]);
  assert.equal(statement.text.includes(query), false);
});
