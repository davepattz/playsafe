export default function Sidebar() {
  return (
    <div className="flex flex-col items-center gap-6">
      <a
        href="https://www.instant-gaming.com/en/14787-buy-lil-gator-game-pc-game-steam/?igr=gamer-c3010e4"
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label="Buy Lil Gator Game on Instant Gaming"
        className="block w-full max-w-[300px]"
      >
        <img
          src="/banners/lilgator.png"
          alt="Lil Gator Game"
          className="h-auto w-full"
          width={600}
          height={900}
        />
      </a>
      <a
        href="https://www.instant-gaming.com/en/1799-buy-lego-city-undercover-pc-game-steam/?igr=gamer-c3010e4"
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label="Buy LEGO City Undercover on Instant Gaming"
        className="block w-full max-w-[300px]"
      >
        <img
          src="/banners/legocity.png"
          alt="LEGO City Undercover"
          className="h-auto w-full"
          width={600}
          height={900}
        />
      </a>
      <a
        href="https://www.instant-gaming.com/en/2705-buy-overcooked-2-pc-mac-game-steam/?igr=gamer-c3010e4"
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label="Buy Overcooked 2 on Instant Gaming"
        className="block w-full max-w-[300px]"
      >
        <img
          src="/banners/overcooked2.png"
          alt="Overcooked 2"
          className="h-auto w-full"
          width={600}
          height={900}
        />
      </a>
    </div>
  )
}
