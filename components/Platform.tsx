"use client";

export default function Platform() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-auto sm:flex-row sm:items-center mx-auto py-8">
      <span className="text-[18px] font-normal font-['Lato']">Platforms:</span>

      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        <button type="button" aria-label="Filter Windows" className="w-8 h-8 flex items-center justify-center rounded-sm" onClick={() => {}}>
          <img src="/win_logo.svg" alt="Windows" className="w-[22px] h-auto" />
        </button>

        <button type="button" aria-label="Filter macOS" className="w-8 h-8 flex items-center justify-center rounded-sm" onClick={() => {}}>
          <img src="/apple_logo.svg" alt="macOS" className="w-[22px] h-auto" />
        </button>

        <button type="button" aria-label="Filter Steam" className="w-8 h-8 flex items-center justify-center rounded-sm" onClick={() => {}}>
          <img src="/steam_logo.svg" alt="Steam" className="w-[22px] h-auto" />
        </button>
      </div>
    </div>
  );
}