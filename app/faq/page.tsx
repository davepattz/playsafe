import Link from "next/link";
import InformationPage from "@/components/InformationPage";

export const metadata = {
  title: "Frequently asked questions | PlaySafe.games",
  description: "Answers about PlaySafe assessments, Steam data, catalogue filters and missing game information.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  ["What does PlaySafe do?", "PlaySafe applies automated, versioned rules to Australian English Steam metadata. Its game reports show available classifications, content concerns, online features and purchases."],
  ["Is a report an official classification?", "PlaySafe is an independent service. Its reports do not provide official classifications, comprehensive content reviews or guarantees of suitability. Where available, a board rating is attributed to the relevant authority."],
  ["Which age classifications does PlaySafe show?", "Reports show the ratings Steam returns for any country or region. Official classifications and Steam-generated ratings appear separately, in alphabetical order by country or region within each group. Ratings whose origin is unclear are labelled as unverified."],
  ["Why might a game have no age classifications listed?", "Steam coverage can vary by game, edition and region. A missing rating says nothing about suitability. If Steam cannot supply the data at the time of retrieval, the report shows a temporary availability message."],
  ["What does insufficient information mean?", "The available evidence could not establish a finding. Missing tags, ratings or disclosures give no assurance about a game’s content."],
  ["Is PlaySafe affiliated with Valve or Steam?", "Valve operates Steam. PlaySafe is independently operated and has no affiliation with or endorsement from Valve or Steam."],
  ["How do catalogue filters and prices work?", "The legacy catalogue filters using available Steam tags, listed categories and selected text checks. Prices reflect the requested Steam storefront and may change. Check Steam before purchasing."],
  ["Why might a game be unavailable?", "The Australian storefront may not list that title or edition, the App ID may identify an add-on, or Steam may be temporarily unavailable. Search for the base game by title."],
];

export default function FAQPage() {
  return <InformationPage title="Frequently asked questions">
    {faqs.map(([question, answer]) => <details key={question} className="rounded-2xl border border-[#e8ddee] bg-white px-5 py-3">
      <summary className="min-h-11 cursor-pointer py-2 font-bold">{question}</summary>
      <p className="pb-2">{answer}</p>
    </details>)}
    <p>See the <Link className="underline" href="/methodology">assessment methodology</Link> or <Link className="underline" href="/contact">send feedback</Link>.</p>
  </InformationPage>;
}
