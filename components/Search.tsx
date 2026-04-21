"use client";

import { useState } from 'react';

interface SearchProps {
  selectedPlatforms: string[];
  setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
}

export default function Search({
  selectedPlatforms,
  setSelectedPlatforms,
  searchQuery,
  setSearchQuery,
  selectedSort,
  setSelectedSort
}: SearchProps) {
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="mt-4 w-full pb-4">
      <div className="max-w-[1222px] mx-auto px-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative mx-auto w-full max-w-[441px] h-[50px] sm:mx-0 sm:w-[441px]" style={{ width: 441, height: 50 }}>
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-white border-2 border-black rounded-full px-4 pr-12 outline-none placeholder-black"
              style={{ fontFamily: 'Lato, Arial, sans-serif', fontSize: 19, fontWeight: 400 }}
            />
            <button
              type="button"
              aria-label="Search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#d7f379] border-2 border-black rounded-full flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
            <span className="text-[18px] font-normal font-['Lato']">Platform:</span>

            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <button type="button" aria-label="Filter Windows" title="Windows" className="w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer" onClick={() => togglePlatform('windows')}>
                <img src={selectedPlatforms.includes('windows') ? '/win_logo_selected.svg' : '/win_logo.svg'} alt="Windows" className="w-[22px] h-auto" />
              </button>

              <button type="button" aria-label="Filter macOS" title="MacOS" className="w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer" onClick={() => togglePlatform('macos')}>
                <img src={selectedPlatforms.includes('macos') ? '/apple_logo_selected.svg' : '/apple_logo.svg'} alt="macOS" className="w-[22px] h-auto" />
              </button>

              <button type="button" aria-label="Filter Linux" title="SteamOS/Linux" className="w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer" onClick={() => togglePlatform('linux')}>
                <img src={selectedPlatforms.includes('linux') ? '/steam_logo_selected.svg' : '/steam_logo.svg'} alt="Linux" className="w-[22px] h-auto" />
              </button>
            </div>
          </div>


          <div className="w-full sm:w-auto flex items-center h-10 sm:ml-auto justify-center sm:justify-end">
            <span className="text-[18px] font-normal font-['Lato'] mr-2">Sort:</span>
            <div className="relative">
              <select
                aria-label="Sort"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-[18px] font-bold font-['Lato'] text-right outline-none cursor-pointer"
              >
                <option>Popular new releases</option>
                <option>Price low to high</option>
                <option>Price high to low</option>
              </select>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[12px]">▼</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}