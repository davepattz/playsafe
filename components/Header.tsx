import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white w-full">
      <div className="max-w-[1222px] mx-auto border-b-2 border-black">
        <div className="flex flex-col md:flex-row md:h-16 items-center md:justify-between px-4 py-4 md:py-0 relative">

          {/* Logo */}
          <div className="order-1 md:order-none md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
            <Link href="/" aria-label="PlaySafe home">
              <Image
                src="/logo.svg" width={174} height={28}
                alt="PlaySafe"
                className="h-[28px] w-auto"
              />
            </Link>
          </div>

          {/* Left nav */}
          <nav className="order-2 md:order-none flex space-x-14 mt-4 md:mt-0">
            <Link
              href="/"
              className="text-[20px] font-bold text-black hover:text-[#b185e8] transition-colors"
            >
              Games
            </Link>
            <Link
              href="/news"
              className="text-[20px] font-bold text-black hover:text-[#b185e8] transition-colors"
            >
              News
            </Link>
            <Link
              href="/faq"
              className="text-[20px] font-bold text-black hover:text-[#b185e8] transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Right heart icon */}
          <div className="order-3 md:order-none mt-4 md:mt-0 flex items-center">
  <a
    href="https://buymeacoffee.com/playsafegames"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Donate to PlaySafe"
  >
    <Image
      src="/heart.svg" width={24} height={24}
      alt="Donate"
      className="h-[24px] w-[24px] hover:scale-130 transition-transform"
    />
  </a>
</div>

        </div>
      </div>
    </header>
  )
}
