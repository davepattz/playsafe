"use client";

import { useEffect, useState } from "react";
import type { SteamGameMetadata, SteamSuggestion } from "@/lib/steamMetadata";

const examples: SteamSuggestion[] = [
  { appId: 1211020, title: "Wobbly Life" },
  { appId: 284160, title: "BeamNG.drive" },
  { appId: 1401590, title: "Disney Dreamlight Valley" },
  { appId: 4000, title: "Garry's Mod" },
  { appId: 730, title: "Counter-Strike 2" },
  { appId: 1091500, title: "Cyberpunk 2077" },
];

type Inspection = {
  metadata: SteamGameMetadata;
  sources: Record<string, { available: boolean; error?: string; data?: unknown; elapsedMs?: number; cached?: boolean }>;
};

async function getJson<T>(params: Record<string, string>, signal: AbortSignal): Promise<T> {
  const response = await fetch("/api/dev/steam?" + new URLSearchParams(params), { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Request failed.");
  return body;
}

export default function SteamInspector() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SteamSuggestion[]>([]);
  const [selected, setSelected] = useState<SteamSuggestion | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [detailStatus, setDetailStatus] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchStatus("Searching Steam…");
      try {
        const data = await getJson<{ suggestions: SteamSuggestion[] }>({ q: query }, controller.signal);
        if (controller.signal.aborted) return;
        setSuggestions(data.suggestions);
        setSearchStatus(data.suggestions.length ? `${data.suggestions.length} suggestions` : "No suggestions found.");
      } catch (error) {
        if (!controller.signal.aborted) setSearchStatus(error instanceof Error ? error.message : "Search failed.");
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    getJson<Inspection>({ appId: String(selected.appId) }, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setInspection(data);
      setDetailStatus(Object.values(data.sources).some((source) => source.available)
        ? "" : "Steam returned no usable metadata for this app.");
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setDetailStatus(error instanceof Error ? error.message : "Inspection failed.");
    });
    return () => controller.abort();
  }, [selected]);

  function select(game: SteamSuggestion) {
    setInspection(null);
    setDetailStatus("Loading metadata…");
    setSelected({ ...game });
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 bg-white px-6 py-10 text-black">
      <h1 className="text-3xl font-bold">Steam metadata inspector</h1>
      <div>
        <label className="block font-semibold" htmlFor="steam-query">Search Steam (Australia, English)</label>
        <input id="steam-query" className="mt-2 w-full rounded border p-2" autoComplete="off" maxLength={100}
          value={query} onChange={(event) => { setQuery(event.target.value); setSuggestions([]); setSearchStatus(""); }} />
        <p role="status" className="mt-2 text-sm">{searchStatus}</p>
        {suggestions.length > 0 && (
          <ul aria-label="Steam suggestions" className="mt-2 divide-y rounded border">
            {suggestions.map((game) => <li key={game.appId}>
              <button className="w-full px-3 py-2 text-left hover:bg-violet-50 focus-visible:bg-violet-50"
                onClick={() => select(game)}>{game.title} <span className="text-sm text-gray-600">({game.appId})</span></button>
            </li>)}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Sample games">
        {examples.map((game) => <button key={game.appId} className="rounded border px-3 py-1 hover:bg-violet-50"
          onClick={() => select(game)}>{game.title}</button>)}
      </div>
      {selected && <section className="space-y-3">
        <h2 className="text-xl font-bold">{selected.title} ({selected.appId})</h2>
        <p role="status">{detailStatus}</p>
        {inspection && <>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">{JSON.stringify(inspection.metadata, null, 2)}</pre>
          {Object.entries(inspection.sources).map(([name, source]) => <details key={name} className="rounded border p-3">
            <summary className="cursor-pointer">{name} raw JSON · {source.available ? "available" : "unavailable"}
              {source.elapsedMs !== undefined && ` · ${source.elapsedMs} ms${source.cached ? " (cached response)" : ""}`}</summary>
            <pre className="mt-2 max-h-96 overflow-auto bg-gray-100 p-3 text-sm">{JSON.stringify(source.data ?? { error: source.error }, null, 2)}</pre>
          </details>)}
        </>}
      </section>}
    </main>
  );
}
