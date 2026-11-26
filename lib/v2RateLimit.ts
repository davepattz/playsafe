import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { positiveEnv, v2Database, v2DatabaseConfigured } from "./v2Database";

type Scope = "search" | "metadata" | "report";
const windows = new Map<string, number>();
let currentMinute = -1;
const limits = {
  search: { global: 240, client: 45 },
  metadata: { global: 120, client: 20 },
  report: { global: 600, client: 60 },
};

export async function allowV2Request(scope: Scope, headers: Pick<Headers, "get">) {
  const minute = Math.floor(Date.now() / 60_000);
  if (currentMinute !== minute) {
    currentMinute = minute;
    windows.clear();
  }
  const trustedHeader = process.env.V2_TRUSTED_CLIENT_IP_HEADER;
  const secret = process.env.V2_RATE_LIMIT_SECRET;
  const address = trustedHeader && secret && secret.length >= 32 ? headers.get(trustedHeader)?.trim() : undefined;
  const client = secret && address && isIP(address)
    ? createHmac("sha256", secret).update(`${minute}:${address}`).digest("hex") : null;
  const prefix = scope.toUpperCase();
  const globalLimit = positiveEnv(process.env[`V2_${prefix}_REQUESTS_PER_MINUTE`], limits[scope].global, 10_000);
  const clientLimit = positiveEnv(process.env[`V2_${prefix}_CLIENT_REQUESTS_PER_MINUTE`], limits[scope].client, globalLimit);
  const globalKey = `${scope}:global`;
  const clientKey = `${scope}:${client}`;
  const total = windows.get(globalKey) ?? 0;
  const clientTotal = windows.get(clientKey) ?? 0;
  if (total >= globalLimit || (client && clientTotal >= clientLimit)) return false;
  windows.set(globalKey, total + 1);
  if (client) windows.set(clientKey, clientTotal + 1);
  if (!v2DatabaseConfigured()) return true;
  try {
    return await v2Database<boolean>("rpc/v2_allow_request", {
      body: { p_scope: scope, p_client: client, p_global_limit: globalLimit, p_client_limit: clientLimit },
    }) === true;
  } catch {
    return true; // The per-process budget still applies during a database outage.
  }
}
