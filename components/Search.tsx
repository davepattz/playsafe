export default function Search() {
  return (
    <div className="mt-4 w-full">
      <div className="max-w-[1222px] mx-auto px-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative mx-auto w-full max-w-[441px] h-[50px] md:mx-0 md:w-[441px]" style={{ width: 441, height: 50 }}>
            <input
              type="text"
              placeholder="Search games..."
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

          <div className="flex items-center gap-3">
            <span className="text-[18px] font-normal font-['Lato']">Platform:</span>

            <div className="flex items-center gap-2">
              <button type="button" aria-label="Filter Windows" className="w-8 h-8 flex items-center justify-center rounded-sm">
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" y="0.5" width="6" height="4" stroke="black" />
                  <rect x="7.5" y="0.5" width="6" height="4" stroke="black" />
                  <rect x="0.5" y="5.5" width="6" height="4" stroke="black" />
                  <rect x="7.5" y="5.5" width="6" height="4" stroke="black" />
                </svg>
              </button>

              <button type="button" aria-label="Filter macOS" className="w-8 h-8 flex items-center justify-center rounded-sm">
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 1.5C7 1.5 8 2 8.5 2.5C9 3 9.5 3.8 9.5 5C9.5 6.2 8.5 7.4 7.5 7.4C6.5 7.4 6 6.8 4.5 6.8C3 6.8 2 7.6 1.5 8.2C1 8.8 0.5 9.8 0.5 11C0.5 12.2 1.5 13 2.5 13C3.5 13 4 12.4 5 12.4C6 12.4 6.5 13 8 13C9.5 13 10.5 12.4 11 11.8C11 11 11.5 10.2 11.5 9C11.5 7.8 11 6.8 10.5 6.2C10 5.6 8.5 5 7.5 4.5C6.5 4 5 3.5 4 2.5C3 1.5 3.5 1 4.5 1C5.5 1 6 1 6 1.5Z" stroke="black" />
                </svg>
              </button>

              <button type="button" aria-label="Filter Linux" className="w-8 h-8 flex items-center justify-center rounded-sm">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 1C7.5 1 9 2 9.5 3.5C10 5 9 6.5 7.5 7C6 7.5 5 7 3.5 7C2 7 1 7.5 1 8C1 9 3 10 6 10C9 10 11 9 11 7.5C11 6 9.5 5 8 4.5C6.5 4 6 3 6 1Z" stroke="black" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center h-10 md:ml-auto">
            <span className="text-[18px] font-normal font-['Lato'] mr-2">Sort:</span>
            <div className="relative">
              <select
                aria-label="Sort"
                defaultValue="Popular new releases"
                className="appearance-none bg-transparent pr-6 text-[18px] font-bold font-['Lato'] text-right"
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