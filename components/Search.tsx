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
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          <select className="border rounded p-2 h-10">
            <option>Platform</option>
          </select>
          <select className="border rounded p-2 h-10">
            <option>Sort</option>
          </select>
        </div>
      </div>
    </div>
  )
}