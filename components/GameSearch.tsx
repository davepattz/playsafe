"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import {
  GAME_SEARCH_DEBOUNCE_MS, GAME_SEARCH_MAX_LENGTH, GAME_SEARCH_MIN_LENGTH,
  gameReportPath, moveSearchSelection, normalizeGameQuery,
} from "@/lib/gameSearch";
import type { SteamSuggestion } from "@/lib/steamMetadata";
import { track } from "@/lib/analytics";

type Result = { revision: number; suggestions: SteamSuggestion[]; error?: string };

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className="size-5 shrink-0"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
  );
}

export default function GameSearch({ popularSearches }: { popularSearches: string[] }) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const [search, setSearch] = useState({ value: "", revision: 0 });
  const [result, setResult] = useState<Result>();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [reportPending, startReportNavigation] = useTransition();
  const query = normalizeGameQuery(search.value);
  const valid = query.length >= GAME_SEARCH_MIN_LENGTH;
  const current = result?.revision === search.revision ? result : undefined;
  const suggestions = current?.suggestions ?? [];
  const popup = open && valid;
  const listbox = `${id}-results`;

  useEffect(() => {
    if (!valid) return;
    const requestRevision = search.revision;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/search?" + new URLSearchParams({ q: query }), { signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data?.suggestions)) {
          throw new Error(typeof data?.error === "string" ? data.error : "Search is unavailable. Try again.");
        }
        if (revision.current === requestRevision && !controller.signal.aborted) {
          track("game_search", { result_count: data.suggestions.length });
          setResult({ revision: requestRevision, suggestions: data.suggestions });
        }
      } catch (error) {
        if (revision.current === requestRevision && !controller.signal.aborted) {
          setResult({
            revision: requestRevision, suggestions: [],
            error: error instanceof Error && error.name !== "TypeError" ? error.message : "Search is unavailable. Try again.",
          });
        }
      }
    }, GAME_SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, search.revision, valid]);

  useEffect(() => {
    if (popup && active >= 0) document.getElementById(`${listbox}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listbox, popup]);

  function change(value: string) {
    revision.current += 1;
    setSearch({ value, revision: revision.current });
    setActive(-1);
    setOpen(true);
  }

  function choose(game: SteamSuggestion) {
    if (reportPending) return;
    track("game_select", { steam_app_id: game.appId });
    setOpen(false);
    setActive(-1);
    startReportNavigation(() => router.push(gameReportPath(game.appId, game.title)));
  }

  function submitSearch() {
    const game = popup && suggestions[Math.max(active, 0)];
    if (game) choose(game);
    else setOpen(true);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && valid) {
      event.preventDefault();
      submitSearch();
    } else if (event.key === "Escape" && popup) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && valid) {
      event.preventDefault();
      setOpen(true);
      setActive(moveSearchSelection(open ? active : -1, suggestions.length, event.key === "ArrowDown" ? 1 : -1));
    }
  }

  const status = !popup ? "" : !current ? "Searching Steam…" : current.error
    ?? (suggestions.length ? `${suggestions.length} game suggestions available.` : "No games found. Try a different title.");

  return (
    <div>
      <form role="search" className="relative"
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); } }}
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}>
        <label htmlFor={id} className="sr-only">Search for a Steam game</label>
        <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#cdb9e0] bg-white px-4 text-[#644281] shadow-[0_8px_30px_#39224912] focus-within:ring-2 focus-within:ring-[#755093] sm:gap-4 sm:px-5">
          <SearchIcon />
          <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={popup}
            aria-controls={popup ? listbox : undefined}
            aria-activedescendant={popup && active >= 0 ? `${listbox}-${active}` : undefined}
            autoComplete="off" enterKeyHint="search" maxLength={GAME_SEARCH_MAX_LENGTH} placeholder="Search for a game"
            className="min-w-0 flex-1 py-4 text-lg text-[#241631] outline-none placeholder:text-[#6a5e75] sm:text-xl"
            value={search.value} onFocus={() => setOpen(true)} onChange={(event) => change(event.target.value)}
            onKeyDown={handleKey} />
          {search.value && <button type="button" aria-label="Clear search"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-xl hover:bg-[#f3eaf9]"
            onClick={() => { change(""); input.current?.focus(); }}>×</button>}
        </div>
        <p role="status" className="sr-only">{status}</p>
        {popup && (
          <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-[45vh] overflow-y-auto rounded-2xl border border-[#e0d3e9] bg-white shadow-[0_12px_32px_#39224922]">
            <ul id={listbox} role="listbox" aria-label="Steam games" aria-busy={!current}>
              {suggestions.map((game, index) => (
                <li key={game.appId} role="none" className="border-b border-[#f0e9f4] last:border-0">
                  <button type="button" role="option" tabIndex={-1} id={`${listbox}-${index}`}
                    aria-selected={active === index} onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(game)}
                    className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#f7effc] aria-selected:bg-[#eee0f7] sm:px-4">
                    {game.capsuleImage
                      ? <Image src={game.capsuleImage} alt="" width={116} height={44} unoptimized
                        referrerPolicy="no-referrer" className="aspect-[116/44] w-20 shrink-0 rounded bg-[#efe4f6] object-cover sm:w-28" />
                      : <span aria-hidden="true" className="aspect-[116/44] w-20 shrink-0 rounded bg-[#efe4f6] sm:w-28" />}
                    <span className="min-w-0">
                      <span className="block font-bold leading-tight">{game.title}</span>
                      <span className="mt-1 block text-xs text-[#514960]">
                        {[game.releaseYear, ...(game.platforms ?? [])].filter(Boolean).join(" · ") || "Steam"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!suggestions.length && <div className="px-4 py-4 text-sm text-[#514960]">
              <p aria-hidden="true">{status}</p>
              {current?.error && <button type="button" className="mt-2 min-h-11 font-bold underline"
                onClick={() => { change(search.value); input.current?.focus(); }}>Try again</button>}
            </div>}
          </div>
        )}
      </form>
      {reportPending && <p role="status" className="mt-3 rounded-xl border border-[#e0d3e9] bg-white px-4 py-3 text-sm font-bold text-[#563569]">
        Loading game report…
      </p>}
      {popularSearches.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          <p className="mx-1 font-bold text-[#514960]">Popular searches</p>
          {popularSearches.map((title) => (
            <button key={title} type="button" onClick={() => { change(title); input.current?.focus(); }}
              className="min-h-11 rounded-full border border-[#e1d3eb] bg-white px-3 font-bold text-[#563569] hover:bg-[#f2e5fa]">
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
