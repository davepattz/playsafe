export default function Title() {
  return (
    <div className="mt-12 mb-10 px-4">
      <a
        href="https://store.steampowered.com/app/2215200/LEGO_Batman_Legacy_of_the_Dark_Knight/"
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label="View LEGO Batman: Legacy of the Dark Knight on Steam"
        className="mx-auto mb-8 block w-full max-w-[1020px]"
      >
        <img
          src="/banners/lego_batman_legacy_dark_knight.png"
          alt="LEGO Batman: Legacy of the Dark Knight"
          width={1020}
          height={190}
          className="h-auto w-full"
        />
      </a>

      <h1 className="text-[32px] font-bold font-['Lato'] text-black text-center">
        Search for safe, child friendly video games on Steam.
      </h1>
    </div>
  );
}
