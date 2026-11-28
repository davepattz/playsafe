import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-[#eae1f0] bg-[#fcfaff] text-[#514960] [font-family:var(--font-lato),sans-serif]">
      <div className="mx-auto grid min-h-16 w-full max-w-[1222px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-3 py-2 sm:px-8">
        <Link href="/" aria-label="PlaySafe home" className="col-start-2 row-start-1 inline-flex min-h-11 items-center">
          <Image src="/logo.svg" width={174} height={28} alt="" className="h-auto w-28 sm:w-[174px]" />
        </Link>
        <nav aria-label="Main" className="col-span-3 row-start-2 flex items-center justify-center gap-6 text-sm sm:col-span-1 sm:col-start-1 sm:row-start-1 sm:justify-start">
          <Link href="/about" className="inline-flex min-h-11 items-center hover:underline">About</Link>
          <Link href="/news" className="inline-flex min-h-11 items-center hover:underline">Blog</Link>
          <Link href="/faq" className="inline-flex min-h-11 items-center hover:underline">FAQ</Link>
        </nav>
        <a href="https://buymeacoffee.com/playsafegames" target="_blank" rel="noopener noreferrer"
          aria-label="Donate to PlaySafe (opens in a new tab)"
          className="group col-start-3 row-start-1 inline-flex size-11 items-center justify-center justify-self-end">
          <Image src="/heart.svg" width={24} height={24} alt=""
            className="size-6 motion-safe:transition-transform motion-safe:group-hover:scale-125" />
        </a>
      </div>
    </header>
  );
}
