export default function Filters() {
  return (
    <div className="mt-8 w-full flex flex-col md:flex-row">
      
      {/* Age */}
      <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
        <span className="text-black text-[30px] font-bold font-['Lato']">
          Age
        </span>
        <span className="text-black text-[12px]">▼</span>
      </div>

      {/* Genre */}
      <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
        <span className="text-black text-[30px] font-bold font-['Lato']">
          Genre
        </span>
        <span className="text-black text-[12px]">▼</span>
      </div>

      {/* Play Style */}
      <div className="w-full md:w-1/3 flex justify-center items-center gap-2 py-6 cursor-pointer">
        <span className="text-black text-[30px] font-bold font-['Lato']">
          Play Style
        </span>
        <span className="text-black text-[12px]">▼</span>
      </div>

    </div>
  )
}