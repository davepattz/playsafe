"use client";

import { useState } from "react";

export default function Platform() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-auto sm:flex-row sm:items-center mx-auto py-8">
      <span className="text-[18px] font-normal font-['Lato']">Platforms:</span>

      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        <button type="button" aria-label="Filter Windows" className="w-8 h-8 flex items-center justify-center rounded-sm hover:cursor-pointer transition-colors" onClick={() => togglePlatform('windows')}>
          <img src={selectedPlatforms.includes('windows') ? "/win_logo_selected.svg" : "/win_logo.svg"} alt="Windows" className="w-[22px] h-auto" />
        </button>

        <button type="button" aria-label="Filter macOS" className="w-8 h-8 flex items-center justify-center rounded-sm hover:cursor-pointer transition-colors" onClick={() => togglePlatform('macos')}>
          <img src={selectedPlatforms.includes('macos') ? "/apple_logo_selected.svg" : "/apple_logo.svg"} alt="macOS" className="w-[22px] h-auto" />
        </button>

        <button type="button" aria-label="Filter Steam" className="w-8 h-8 flex items-center justify-center rounded-sm hover:cursor-pointer transition-colors" onClick={() => togglePlatform('steam')}>
          <img src={selectedPlatforms.includes('steam') ? "/steam_logo_selected.svg" : "/steam_logo.svg"} alt="Steam" className="w-[22px] h-auto" />
        </button>
      </div>
    </div>
  );
}