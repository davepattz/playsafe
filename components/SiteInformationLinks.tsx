import Link from "next/link";

const links = [
  ["/about", "About"],
  ["/methodology", "Methodology"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/contact", "Contact"],
];

export default function SiteInformationLinks() {
  return <nav aria-label="Site information" className="mb-2 flex flex-wrap justify-center gap-x-4">
    {links.map(([path, label]) => <Link className="inline-flex min-h-11 items-center underline underline-offset-4"
      key={path} href={path}>{label}</Link>)}
  </nav>;
}
