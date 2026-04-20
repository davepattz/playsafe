"use client";

import { useState } from "react";

const playStyleOptions = [
  "Single-player",
  "Multi-player",
  "PvP",
  "Online PvP",
  "LAN PvP",
  "Shared/Split Screen PvP",
  "Co-op",
  "Online Co-op",
  "LAN Co-op",
  "Shared/Split Screen Co-op",
  "Shared/Split Screen",
  "Cross-Platform Multiplayer",
];

export default function Filters() {
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>([]);
  const [isPlayStyleOpen, setIsPlayStyleOpen] = useState(false);

  const handleSelectPlayStyle = (style: string) => {
    setSelectedPlayStyles((prev) =>
      prev.includes(style) ? prev : [...prev, style]
    );
  };

  const handleRemovePlayStyle = (style: string) => {
    setSelectedPlayStyles((prev) => prev.filter((item) => item !== style));
  };

  return (
    <div className="mt-2 w-full pb-6">
      <div className="max-w-[1222px] mx-auto pb-8">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-12 px-4">

          {/* Filter */}
          <div className="w-full md:w-[280px] flex justify-center items-center gap-2 py-6 cursor-pointer">
            <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
              Filter
            </span>
            <span className="text-black text-[12px] leading-none">▼</span>
          </div>

          {/* Genre */}
          <div className="w-full md:w-[280px] flex justify-center items-center gap-2 py-6 cursor-pointer">
            <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
              Genre
            </span>
            <span className="text-black text-[12px] leading-none">▼</span>
          </div>

          {/* Play Style */}
          <div className="w-full md:w-[280px] flex flex-col items-center gap-2 py-6">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-black text-[30px] font-bold font-['Lato'] leading-none"
              onClick={() => setIsPlayStyleOpen((prev) => !prev)}
            >
              <span>Play Style</span>
              <span className="text-[12px]">▼</span>
            </button>

            {selectedPlayStyles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {selectedPlayStyles.map((style) => (
                  <div
                    key={style}
                    className="flex items-center gap-2 rounded-full border border-black bg-[#d7f379] px-2 py-[5px]"
                  >
                    <span className="text-[14px] font-bold text-black font-['Lato']">
                      {style}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${style}`}
                      className="text-black font-bold"
                      onClick={() => handleRemovePlayStyle(style)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isPlayStyleOpen && (
              <div className="mt-2 w-full rounded border border-black bg-white p-2 shadow-sm">
                <div className="grid gap-2">
                  {playStyleOptions.map((style) => (
                    <button
                      key={style}
                      type="button"
                      className="w-full rounded-sm border border-black bg-[#f7f7f7] px-3 py-2 text-left text-[14px] font-semibold text-black hover:bg-[#d7f379]/80"
                      onClick={() => {
                        handleSelectPlayStyle(style)
                        setIsPlayStyleOpen(false)
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
