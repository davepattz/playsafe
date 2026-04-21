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

const gameTypeOptions = [
  "Action",
  "Casual",
  "Cute",
  "Funny",
  "Open World",
  "Party",
  "Physics",
  "Platformer",
  "Puzzle",
  "Racing",
  "Sandbox",
  "Sports"
];

const filterOptions = [
  "🚫 Nudity",
  "🚫 Mature",
  "🚫 Violent",
  "🚫 Gore",
  "🚫 Difficult",
  "🚫 Shooter",
  "🚫 Horror",
];

export default function Filters() {
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>([]);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const value = e.target.value;
    if (value && !current.includes(value)) {
      setter(prev => [...prev, value]);
    }
    e.target.value = "";
  };

  const removeTag = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => prev.filter(v => v !== value));
  };

  return (
    <div className="mt-8 w-full pb-6"> {/* Bottom spacing below border */}

      <div className="max-w-[1222px] mx-auto border-b-2 border-black pb-8">
        <div className="flex flex-col md:flex-row px-4">
        
        {/* Filters */}
        <div className="w-full md:w-1/3 flex flex-col items-center py-6">
          <div className="relative flex justify-center items-center gap-2 cursor-pointer">
            <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
              Filters
            </span>
            <span className="text-black text-[12px] leading-none">▼</span>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={(e) => handleSelect(e, selectedFilters, setSelectedFilters)}
              defaultValue=""
              aria-label="Select Filter"
            >
              <option value="" disabled hidden></option>
              {filterOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {selectedFilters.map(filter => (
              <div key={filter} className="bg-[#d7f379] border border-black p-[5px] px-3 rounded-full flex items-center gap-2">
                <span className="text-black text-[14px] font-bold font-['Lato']">{filter}</span>
                <button 
                  type="button" 
                  onClick={() => removeTag(filter, setSelectedFilters)} 
                  className="text-black font-bold hover:opacity-70 leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Game type */}
        <div className="w-full md:w-1/3 flex flex-col items-center py-6">
          <div className="relative flex justify-center items-center gap-2 cursor-pointer">
            <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
              Game type
            </span>
            <span className="text-black text-[12px] leading-none">▼</span>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={(e) => handleSelect(e, selectedGameTypes, setSelectedGameTypes)}
              defaultValue=""
              aria-label="Select Game Type"
            >
              <option value="" disabled hidden></option>
              {gameTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {selectedGameTypes.map(type => (
              <div key={type} className="bg-[#d7f379] border border-black p-[5px] px-3 rounded-full flex items-center gap-2">
                <span className="text-black text-[14px] font-bold font-['Lato']">{type}</span>
                <button 
                  type="button" 
                  onClick={() => removeTag(type, setSelectedGameTypes)} 
                  className="text-black font-bold hover:opacity-70 leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
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
              onChange={(e) => handleSelect(e, selectedPlayStyles, setSelectedPlayStyles)}
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
                <button 
                  type="button" 
                  onClick={() => removeTag(style, setSelectedPlayStyles)} 
                  className="text-black font-bold hover:opacity-70 leading-none"
                >
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