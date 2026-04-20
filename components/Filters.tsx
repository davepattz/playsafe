"use client";

import { useState } from 'react';

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
  "Cross-Platform Multiplayer"
];

export default function Filters() {
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>([]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedPlayStyles.includes(value)) {
      setSelectedPlayStyles(prev => [...prev, value]);
    }
    // Reset selection to allow re-selecting if removed
    e.target.value = "";
  };

  const removeStyle = (style: string) => {
    setSelectedPlayStyles(prev => prev.filter(s => s !== style));
  };

  return (
    <div className="mt-8 w-full pb-6"> {/* Bottom spacing below border */}

      <div className="max-w-[1222px] mx-auto border-b-2 border-black pb-8">
        <div className="flex flex-col md:flex-row px-4">
        
        {/* Filters */}
        <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
          <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
            Filters
          </span>
          <span className="text-black text-[12px] leading-none">▼</span>
        </div>

        {/* Game type */}
        <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
          <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
            Game type
          </span>
          <span className="text-black text-[12px] leading-none">▼</span>
        </div>

        {/* Play Style */}
        <div className="w-full md:w-1/3 flex flex-col items-center py-6">
          <div className="relative flex justify-center items-center gap-2 cursor-pointer">
            <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
              Play Style
            </span>
            <span className="text-black text-[12px] leading-none">▼</span>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={handleSelect}
              defaultValue=""
              aria-label="Select Play Style"
            >
              <option value="" disabled hidden></option>
              {playStyleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          {/* Selected items tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {selectedPlayStyles.map(style => (
              <div key={style} className="bg-[#d7f379] border border-black p-[5px] px-3 rounded-full flex items-center gap-2">
                <span className="text-black text-[14px] font-bold font-['Lato']">{style}</span>
                <button type="button" onClick={() => removeStyle(style)} className="text-black font-bold hover:opacity-70 leading-none">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

    </div>
  )
}