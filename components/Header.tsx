export default function Header() {
  return (
    <header className="bg-white h-16 w-full">
      <div className="max-w-[1222px] mx-auto h-full flex items-center justify-between px-4 relative">
        {/* Left nav */}
        <nav className="flex space-x-6">
          <a href="/" className="text-[20px] font-bold text-black">
            Games
          </a>
          <a href="/news" className="text-[20px] font-bold text-black">
            News
          </a>
          <a href="/faq" className="text-[20px] font-bold text-black">
            FAQ
          </a>
        </nav>

        {/* Logo centered, bold Lato */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[20px] font-bold text-black">
          PlaySafe
        </div>

        {/* Right icon */}
        <div className="flex items-center">
          <button className="text-pink-500 text-[20px]">❤️</button>
        </div>
      </div>

      {/* Bottom line under content only */}
      <div className="max-w-[1222px] mx-auto border-b border-black"></div>
    </header>
  )
}