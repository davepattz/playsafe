export default function Header() {
  return (
    <header className="bg-white w-full">
      <div className="max-w-[1222px] mx-auto border-b border-black">
        <div className="flex flex-col md:flex-row md:h-16 items-center md:justify-between px-4 py-4 md:py-0 relative">

          {/* Logo */}
          <div className="order-1 md:order-none md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
            <img
              src="/logo.svg"
              alt="PlaySafe"
              className="h-[28px] w-auto"
            />
          </div>

          {/* Left nav */}
          <nav className="order-2 md:order-none flex space-x-14 mt-4 md:mt-0">
            <a
              href="/"
              className="text-[20px] font-bold text-black hover:text-[#b185e8] transition-colors"
            >
              Games
            </a>
            <a
              href="/news"
              className="text-[20px] font-bold text-black hover:text-[#b185e8] transition-colors"
            >
              News
            </a>
            <a
              href="/faq"
              className="text-[20px] font-bold text-black hover:text-[#b185e8] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right heart icon */}
          <div className="order-3 md:order-none mt-4 md:mt-0 flex items-center">
            <button aria-label="Donate to PlaySafe">
              <img
                src="/heart.svg"
                alt=""
                className="h-[24px] w-[24px]"
              />
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}