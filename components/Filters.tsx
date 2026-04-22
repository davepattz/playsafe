"use client";

export const playStyleOptions = [
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

export const gameTypeOptions = [
  "Action",
  "Casual",
  "Cute",
  "Fighting",
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

export const filterOptions = [
  "Nudity",
  "Mature",
  "Violent",
  "Gore",
  "Difficult",
  "Shooter",
  "Horror",
];

interface FiltersProps {
  selectedPlayStyles: string[];
  setSelectedPlayStyles: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGameTypes: string[];
  setSelectedGameTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFilters: string[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Filters({
  selectedPlayStyles,
  setSelectedPlayStyles,
  selectedGameTypes,
  setSelectedGameTypes,
  selectedFilters,
  setSelectedFilters,
}: FiltersProps) {
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
              Hide
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
              <div key={filter} className="bg-[#b185e8] border border-black p-[5px] px-3 rounded-full flex items-center gap-2">
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
          {selectedFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilters([])}
              className="mt-4 text-black text-[14px] font-bold font-['Lato'] hover:opacity-70"
            >
              Clear
            </button>
          )}
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
          {selectedGameTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedGameTypes([])}
              className="mt-4 text-black text-[14px] font-bold font-['Lato'] hover:opacity-70"
            >
              Clear
            </button>
          )}
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
          {selectedPlayStyles.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedPlayStyles([])}
              className="mt-4 text-black text-[14px] font-bold font-['Lato'] hover:opacity-70"
            >
              Clear
            </button>
          )}
        </div>
        </div>

        {/* Global Clear All */}
        {(selectedFilters.length > 0 || selectedGameTypes.length > 0 || selectedPlayStyles.length > 0) && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedFilters([]);
                setSelectedGameTypes([]);
                setSelectedPlayStyles([]);
              }}
              className="text-black text-[14px] font-bold font-['Lato'] hover:opacity-70"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

    </div>
  )
}