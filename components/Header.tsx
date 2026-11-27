import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-[#eae1f0] bg-[#fcfaff] text-[#514960] [font-family:var(--font-lato),sans-serif]">
      <div className="mx-auto grid min-h-16 w-full max-w-[1222px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-3 py-2 sm:px-8">
        <nav aria-label="Main" className="flex items-center gap-2 text-sm sm:gap-6">
          <Link href="/news" className="inline-flex min-h-11 items-center hover:underline">News</Link>
          <Link href="/faq" className="inline-flex min-h-11 items-center hover:underline">FAQ</Link>
        </nav>
        <Link href="/" aria-label="PlaySafe home" className="inline-flex min-h-11 items-center">
          <Image src="/logo.svg" width={174} height={28} alt="" className="h-auto w-28 sm:w-[174px]" />
        </Link>
        <a href="https://buymeacoffee.com/playsafegames" target="_blank" rel="noopener noreferrer"
          aria-label="Donate to PlaySafe (opens in a new tab)"
          className="group inline-flex size-11 items-center justify-center justify-self-end">
          <Image src="/heart.svg" width={24} height={24} alt=""
            className="size-6 motion-safe:transition-transform motion-safe:group-hover:scale-125" />
        </a>
      </div>
    </header>
  );
}
