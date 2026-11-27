import Link from "next/link";
import InformationPage from "@/components/InformationPage";

export const metadata = {
  title: "Frequently asked questions | PlaySafe.games",
  description: "Answers about PlaySafe’s Steam game reports, international age classifications, gameplay features, retailer searches and sharing.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  ["What does PlaySafe do?", "PlaySafe helps parents and carers worldwide look up Steam games. Its reports show available age classifications, content concerns, online features, spending considerations and positive gameplay features."],
  ["Is a report an official classification?", "PlaySafe is an independent service. Its reports do not provide official classifications, comprehensive content reviews or guarantees of suitability. Where available, a board rating is attributed to the relevant authority."],
  ["Which age classifications does PlaySafe show?", "Reports show the ratings Steam returns for any country or region. Official classifications and Steam-generated ratings appear separately, in alphabetical order by country or region within each group. Ratings whose origin is unclear are labelled as unverified."],
  ["Why might a game have no age classifications listed?", "Steam coverage can vary by game, edition and region. A missing rating says nothing about suitability. If Steam cannot supply the data at the time of retrieval, the report shows a temporary availability message."],
  ["What do the assessment statuses mean?", "Not mentioned means PlaySafe reviewed relevant Steam data and found no mention of the concern or feature. Information unavailable means relevant Steam data was missing or could not be retrieved. Insufficient information means the evidence was incomplete or unclear. These statuses give no assurance about what the game contains."],
  ["How can I find out what a gameplay feature or online concern means?", "Select a feature chip, such as Sandbox or Split Screen, to open a short explanation. The Potential concern chips in Online safety also open explanations. Evidence and coverage shows the sources behind the assessment."],
  ["How does Where to buy work?", "On supported game reports, Where to buy opens searches at Fanatical, Green Man Gaming and Humble Store. Check each retailer for price, stock, edition, activation platform and regional restrictions. View on Steam opens the game’s Steam page. Steam-confirmed free-to-play games hide the retailer panel."],
  ["How can I share a game report?", "Select Share report to open your device’s sharing options. If those options are unavailable, PlaySafe tries to copy the report link and shows Copied! on the button when it succeeds."],
  ["Is PlaySafe affiliated with Valve or Steam?", "Valve operates Steam. PlaySafe is independently operated and has no affiliation with or endorsement from Valve or Steam."],
  ["How do catalogue filters and prices work?", "The legacy catalogue filters using available Steam tags, listed categories and selected text checks. Prices reflect the requested Steam storefront and may change. Check Steam before purchasing."],
  ["Why might a game be unavailable?", "PlaySafe requests Steam data in English using the Australian storefront context. That listing may omit a title or edition, the App ID may identify an add-on, or Steam may be temporarily unavailable. Search for the base game by title."],
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
