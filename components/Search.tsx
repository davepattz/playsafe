"use client";

export default function Search() {
  return (
    <div className="mt-4 w-full pb-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        
        <div className="relative w-full max-w-[441px] h-[50px] mx-auto">
          <input
            type="text"
            placeholder="Search games..."
            className="w-full h-full bg-white border-2 border-black rounded-full px-4 pr-12 outline-none placeholder-black text-[19px] font-normal"
            style={{ fontFamily: "Lato, Arial, sans-serif" }}
          />

          <button
            type="button"
            aria-label="Search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#d7f379] border-2 border-black rounded-full flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

        </div>

      </div>
    </div>
  )
}