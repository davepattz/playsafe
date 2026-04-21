export default function Results() {
  return (
    <section className="border-2 border-black rounded-[22px] overflow-hidden">
      <div className="flex flex-col">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex border-b-2 border-black last:border-b-0 bg-white min-h-[185px]">
            {/* First Column - Thumbnail */}
            <div className="w-[320px] h-[185px] flex-shrink-0 bg-gray-200">
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                320 × 185
              </div>
            </div>

            {/* Second Column - Info */}
            <div className="flex-grow p-5 flex flex-col justify-start gap-2">
              <h3 className="font-['Lato'] font-bold text-[20px] text-black leading-tight">
                Game Title Placeholder
              </h3>
              <p className="font-['Lato'] font-bold text-[16px] text-black/70 line-clamp-2">
                This is a brief game description that explains the core mechanics and theme of the safety-rated game.
              </p>
              <div className="mt-auto flex gap-4">
                <img src="/win_logo.svg" alt="Windows" className="w-[26px] h-auto" />
                <img src="/apple_logo.svg" alt="macOS" className="w-[26px] h-auto" />
                <img src="/steam_logo.svg" alt="SteamOS/Linux" className="w-[26px] h-auto" />
              </div>
            </div>

            {/* Third Column - Price & Date */}
            <div className="p-5 flex flex-col justify-between items-end min-w-[180px]">
              <div className="font-['Lato'] font-bold text-[30px] text-black">
                £24.99
              </div>
              <div className="font-['Lato'] font-bold text-[14px] text-black uppercase">
                SEP 5, 2025
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}