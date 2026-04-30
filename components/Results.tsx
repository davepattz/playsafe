"use client";

import { useEffect, useState } from "react";

import { type FeaturedOption } from "@/components/Featured";

const SEARCH_DEBOUNCE_MS = 400;

type PlatformKey = "windows" | "macos" | "linux";

interface GameResult {
  id: number;
  name: string;
  imageUrl: string;
  shortDescription: string;
  platforms: PlatformKey[];
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  releaseDate: string;
  storeUrl: string;
}

interface GamesResponse {
  games: GameResult[];
  hasMore: boolean;
  error?: string;
}

interface ResultsProps {
  selectedGameTypes: string[];
  selectedPlayStyles: string[];
  selectedFilters: string[];
  selectedPlatforms: string[];
  applyPopularFilters: boolean;
  searchQuery: string;
  selectedSort: string;
  selectedFeatured: FeaturedOption;
}

export default function Results({
  selectedGameTypes,
  selectedPlayStyles,
  selectedFilters,
  selectedPlatforms,
  applyPopularFilters,
  searchQuery,
  selectedSort,
  selectedFeatured,
}: ResultsProps) {
  const [games, setGames] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [queryVersion, setQueryVersion] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    setGames([]);
    setPage(1);
    setHasMore(false);
    setError(null);
    setQueryVersion((value) => value + 1);
  }, [
    debouncedSearchQuery,
    selectedFilters,
    selectedGameTypes,
    selectedPlatforms,
    selectedPlayStyles,
    selectedSort,
    selectedFeatured,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    const isFirstPage = page === 1;

    selectedGameTypes.forEach((gameType) => {
      params.append("gameTypes", gameType);
    });

    selectedPlayStyles.forEach((playStyle) => {
      params.append("playStyles", playStyle);
    });

    selectedFilters.forEach((filter) => {
      params.append("hidden", filter);
    });

    selectedPlatforms.forEach((platform) => {
      params.append("platforms", platform);
    });

    if (applyPopularFilters) {
      params.set("applyPopularFilters", "true");
    }

    if (typeof Intl !== "undefined") {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (timeZone) {
        params.set("timezone", timeZone);
      }
    }

    params.set("query", debouncedSearchQuery);
    params.set("sort", selectedSort);
    params.set("featured", selectedFeatured);
    params.set("limit", "30");
    params.set("page", String(page));

    const fetchGames = async () => {
      if (isFirstPage) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetch(`/api/games?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as GamesResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch games");
        }

        setGames((currentGames) => {
          if (isFirstPage) {
            return data.games;
          }

          const existingIds = new Set(currentGames.map((game) => game.id));
          const nextGames = data.games.filter((game) => !existingIds.has(game.id));

          return [...currentGames, ...nextGames];
        });
        setHasMore(data.hasMore);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to fetch games", error);
        setError("Could not load Steam results right now.");

        if (isFirstPage) {
          setGames([]);
        }

        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) {
          if (isFirstPage) {
            setIsLoading(false);
          } else {
            setIsLoadingMore(false);
          }
        }
      }
    };

    fetchGames();

    return () => {
      controller.abort();
    };
  }, [
    page,
    queryVersion,
    debouncedSearchQuery,
    selectedFilters,
    selectedGameTypes,
    selectedPlatforms,
    selectedPlayStyles,
    applyPopularFilters,
    selectedSort,
    selectedFeatured,
  ]);

  const renderPlatformIcon = (platform: PlatformKey) => {
    if (platform === "windows") {
      return <img src="/win_logo.svg" alt="Windows" className="w-[26px] h-auto" />;
    }

    if (platform === "macos") {
      return <img src="/apple_logo.svg" alt="macOS" className="w-[26px] h-auto" />;
    }

    return <img src="/steam_logo.svg" alt="SteamOS/Linux" className="w-[26px] h-auto" />;
  };

  return (
    <section className="border-2 border-black rounded-[22px] overflow-hidden">
      <div className="flex flex-col bg-white">
        {isLoading && (
          <div className="p-6 font-['Lato'] text-[18px] font-bold text-black">
            Loading Steam results...
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6 font-['Lato'] text-[18px] font-bold text-black">
            {error}
          </div>
        )}

        {!isLoading && !error && games.length === 0 && (
          <div className="p-6 font-['Lato'] text-[18px] font-bold text-black">
            No games matched those filters yet.
          </div>
        )}

        {!isLoading &&
          !error &&
          games.map((game) => (
            <a
              key={game.id}
              href={game.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col md:flex-row border-b-2 border-black last:border-b-0 bg-white hover:bg-[#f8f8f8]"
            >
              <div className="w-full md:w-[320px] md:flex-shrink-0 bg-gray-200 overflow-hidden aspect-[460/215]">
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-grow p-5 flex flex-col justify-start gap-2">
                <h3 className="font-['Lato'] font-bold text-[20px] text-black leading-tight">
                  {game.name}
                </h3>
                <p className="font-['Lato'] font-bold text-[16px] text-black/70 line-clamp-2">
                  {game.shortDescription || "No description available yet."}
                </p>
                <div className="mt-4 md:mt-auto flex gap-4">
                  {game.platforms.map((platform) => (
                    <span key={platform}>{renderPlatformIcon(platform)}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 pt-0 md:pt-5 flex flex-col justify-between items-end md:min-w-[180px]">
                <div className="text-right">
                  <div className="font-['Lato'] font-bold text-[30px] text-black leading-none">
                    {game.price}
                  </div>
                  {game.originalPrice && game.discountPercent ? (
                    <div className="mt-2 font-['Lato'] text-[14px] font-bold leading-none text-black/70">
                      <span className="line-through">{game.originalPrice}</span>
                      <span className="ml-2">-{game.discountPercent}%</span>
                    </div>
                  ) : null}
                </div>
                <div className="font-['Lato'] font-bold text-[14px] text-black uppercase mt-2 md:mt-0 text-right">
                  {game.releaseDate}
                </div>
              </div>
            </a>
          ))}

        {isLoadingMore && (
          <div className="p-6 font-['Lato'] text-[18px] font-bold text-black">
            Loading more games...
          </div>
        )}

        {!isLoading && !error && hasMore && (
          <div className="flex justify-center p-6">
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={isLoadingMore}
              className="font-['Lato'] text-[18px] font-bold text-black hover:opacity-70 disabled:opacity-50"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
