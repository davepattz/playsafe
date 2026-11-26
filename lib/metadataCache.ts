import type { SteamGameMetadata } from "./steamMetadata";

type Coverage = Record<string, true>;
export type MetadataSnapshot = {
  metadata: SteamGameMetadata;
  sources: { appdetails: boolean; getItems: boolean; getTagList: boolean };
  coverage: Coverage;
  retrieved_at: string;
  expires_at: string;
};
type Observation = { metadata: SteamGameMetadata; sources: MetadataSnapshot["sources"]; failed: boolean };
export type MetadataLookup = {
  snapshot: MetadataSnapshot | null;
  diagnostics: {
    cache: "hit" | "stale" | "miss" | "disabled" | "database_error";
    refresh: "not_needed" | "stored" | "live_only" | "incomplete" | "failed" | "unavailable" | "rate_limited" | "deferred";
    ageSeconds: number | null;
  };
};

export function metadataCoverage(metadata: SteamGameMetadata, sources: MetadataSnapshot["sources"]) {
  const coverage: Coverage = {};
  for (const [name, present] of Object.entries(sources)) if (present) coverage[`source:${name}`] = true;
  for (const [name, value] of Object.entries(metadata)) {
    if (value != null && (!Array.isArray(value) || value.length)) coverage[`field:${name}`] = true;
  }
  for (const rating of metadata.classifications ?? []) {
    coverage[`rating:${rating.authority.toLowerCase()}`] = true;
    if (rating.descriptors) coverage[`advice:${rating.authority.toLowerCase()}`] = true;
  }
  const counts = {
    tags: metadata.tags?.length ?? 0,
    namedTags: metadata.tags?.filter(({ name }) => name).length ?? 0,
    weightedTags: metadata.tags?.filter(({ weight }) => weight != null).length ?? 0,
    features: metadata.categories?.length ?? 0,
    descriptors: metadata.contentDescriptors?.ids?.length ?? 0,
  };
  for (const [name, count] of Object.entries(counts)) {
    for (let threshold = 1; threshold <= count; threshold++) coverage[`count:${name}:${threshold}`] = true;
  }
  if (metadata.contentDescriptors?.notes) coverage["descriptors:notes"] = true;
  return coverage;
}

export function createMetadataCache(dependencies: {
  read?: (appId: number) => Promise<MetadataSnapshot | null>;
  save?: (appId: number, snapshot: MetadataSnapshot) => Promise<boolean>;
  load: (appId: number) => Promise<Observation>;
  ttlSeconds: number;
  now?: () => number;
}) {
  const now = dependencies.now ?? Date.now;
  const pending = new Map<number, Promise<MetadataLookup>>();
  const remembered = new Map<number, { snapshot: MetadataSnapshot; checked: number; retryAfter: number }>();
  const remember = (id: number, snapshot: MetadataSnapshot, retryAfter = 0) => {
    remembered.delete(id);
    if (remembered.size >= 256) {
      const oldest = remembered.keys().next().value;
      if (oldest !== undefined) remembered.delete(oldest);
    }
    remembered.set(id, { snapshot, checked: now(), retryAfter });
  };
  const result = (snapshot: MetadataSnapshot | null, cache: MetadataLookup["diagnostics"]["cache"],
    refresh: MetadataLookup["diagnostics"]["refresh"]): MetadataLookup => ({
    snapshot, diagnostics: { cache, refresh,
      ageSeconds: snapshot ? Math.max(0, Math.floor((now() - Date.parse(snapshot.retrieved_at)) / 1000)) : null },
  });

  async function lookup(id: number, allowRefresh: () => Promise<boolean>) {
    const memory = remembered.get(id);
    let snapshot = memory?.snapshot ?? null;
    let cache: MetadataLookup["diagnostics"]["cache"] = dependencies.read ? "miss" : "disabled";
    if (memory && memory.checked + 30_000 > now() && Date.parse(memory.snapshot.expires_at) > now()) {
      return result(memory.snapshot, "hit", "not_needed");
    }
    if (dependencies.read) {
      try {
        const record = await dependencies.read(id);
        if (record && (!snapshot || Date.parse(record.retrieved_at) >= Date.parse(snapshot.retrieved_at))) snapshot = record;
      } catch {
        cache = "database_error";
      }
    }
    if (snapshot && Date.parse(snapshot.expires_at) > now()) {
      remember(id, snapshot);
      return result(snapshot, "hit", "not_needed");
    }
    if (snapshot && memory?.snapshot.retrieved_at === snapshot.retrieved_at && memory.retryAfter > now()) {
      return result(snapshot, "stale", "deferred");
    }
    if (!await allowRefresh()) return result(snapshot, snapshot ? "stale" : cache, "rate_limited");
    const fetchedAt = now();
    const loaded = await dependencies.load(id).catch(() => null);
    const metadata = loaded?.metadata;
    if (loaded?.sources.appdetails && metadata?.appType && metadata.appType !== "game") {
      remembered.delete(id);
      return result(null, cache, "unavailable");
    }
    const verified = metadata?.appType === "game" && Boolean(metadata.title);
    const usable = loaded && verified;
    const coverage = usable ? metadataCoverage(loaded.metadata, loaded.sources) : {};
    const complete = usable && loaded.sources.appdetails && loaded.sources.getItems;
    const downgrade = snapshot && !Object.keys(snapshot.coverage).every((key) => coverage[key]);
    if (snapshot && (!complete || downgrade)) {
      remember(id, snapshot, now() + 60_000);
      return result(snapshot, "stale", usable ? "incomplete" : "failed");
    }
    if (!usable) {
      return result(null, cache, loaded && !loaded.failed ? "unavailable" : "failed");
    }
    const fresh = { metadata: loaded.metadata, sources: loaded.sources, coverage,
      retrieved_at: new Date(fetchedAt).toISOString(),
      expires_at: new Date(fetchedAt + dependencies.ttlSeconds * 1000).toISOString() };
    let refresh: MetadataLookup["diagnostics"]["refresh"] = complete ? "live_only" : "incomplete";
    if (complete && dependencies.save) {
      try {
        if (await dependencies.save(id, fresh)) refresh = "stored";
        else {
          const winner = await dependencies.read?.(id);
          if (winner) {
            const current = Date.parse(winner.expires_at) > now();
            remember(id, winner, current ? 0 : now() + 60_000);
            return result(winner, current ? "hit" : "stale", current ? "not_needed" : "incomplete");
          }
        }
      } catch {
        cache = "database_error";
      }
    }
    if (complete) remember(id, fresh);
    return result(fresh, cache, refresh);
  }

  return function get(appId: number, allowRefresh: () => Promise<boolean> = async () => true) {
    const active = pending.get(appId);
    if (active) return active;
    const task = lookup(appId, allowRefresh).finally(() => pending.delete(appId));
    pending.set(appId, task);
    return task;
  };
}
