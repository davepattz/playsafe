export default function Filters() {
  return (
    <div className="mt-8 w-full pb-6"> {/* Bottom spacing below border */}

      <div className="max-w-[1222px] mx-auto border-b border-black pb-8">
        <div className="flex flex-col md:flex-row px-4">
        
        {/* Age */}
        <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
          <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
            Age
          </span>
          <span className="text-black text-[12px] leading-none">▼</span>
        </div>

        {/* Genre */}
        <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
          <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
            Genre
          </span>
          <span className="text-black text-[12px] leading-none">▼</span>
        </div>

        {/* Play Style */}
        <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
          <span className="text-black text-[30px] font-bold font-['Lato'] leading-none">
            Play Style
          </span>
          <span className="text-black text-[12px] leading-none">▼</span>
        </div>

        </div>
      </div>

    </div>
  )
}