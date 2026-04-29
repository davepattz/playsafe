"use client";

export type FeaturedOption =
  | "popular"
  | "new-releases"
  | "shared-split-screen-coop"
  | "racing";

interface FeaturedProps {
  selectedFeatured: FeaturedOption;
  setSelectedFeatured: (featured: FeaturedOption) => void;
}

const featuredOptions: Array<{
  label: string;
  value: FeaturedOption;
}> = [
  { label: "Popular", value: "popular" },
  { label: "New releases", value: "new-releases" },
  { label: "Split screen", value: "shared-split-screen-coop" },
  { label: "Racing", value: "racing" },
];

export default function Featured({
  selectedFeatured,
  setSelectedFeatured,
}: FeaturedProps) {
  return (
    <div className="mt-1 w-full pb-2">
      <div className="max-w-[1222px] mx-auto px-0">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
          <span className="font-['Lato'] text-[18px] font-normal text-black">
            Featured:
          </span>

          <div className="flex flex-wrap items-center gap-4">
            {featuredOptions.map((option) => {
              const isSelected = selectedFeatured === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFeatured(option.value)}
                  className={`font-['Lato'] text-[18px] font-bold underline-offset-4 ${
                    isSelected
                      ? "text-black underline decoration-2"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
