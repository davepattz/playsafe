"use client";

import { useEffect, useState } from "react";

type PlatformKey = "windows" | "macos" | "linux";

interface GameResult {
  id: number;
  name: string;
  imageUrl: string;
  shortDescription: string;
  platforms: PlatformKey[];
  price: string;
  releaseDate: string;
  storeUrl: string;
}

interface GamesResponse {
  games: GameResult[];
  error?: string;
}

interface ResultsProps {
  selectedGameTypes: string[];
  selectedPlayStyles: string[];
  selectedFilters: string[];
  selectedPlatforms: string[];
  searchQuery: string;
  selectedSort: string;
}

export default function Results({
  selectedGameTypes,
  selectedPlayStyles,
  selectedFilters,
  selectedPlatforms,
  searchQuery,
  selectedSort,
}: ResultsProps) {
  const [games, setGames] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

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

    params.set("query", searchQuery);
    params.set("sort", selectedSort);
    params.set("limit", "10");

    const fetchGames = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/games?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as GamesResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch games");
        }

        setGames(data.games);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to fetch games", error);
        setError("Could not load Steam results right now.");
        setGames([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchGames();

    return () => {
      controller.abort();
    };
  }, [
    searchQuery,
    selectedFilters,
    selectedGameTypes,
    selectedPlatforms,
    selectedPlayStyles,
    selectedSort,
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
                <div className="font-['Lato'] font-bold text-[30px] text-black leading-none text-right">
                  {game.price}
                </div>
                <div className="font-['Lato'] font-bold text-[14px] text-black uppercase mt-2 md:mt-0 text-right">
                  {game.releaseDate}
                </div>
              </div>
            </a>
          ))}
      </div>
    </section>
  );
}
