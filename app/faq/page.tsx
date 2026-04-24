import Footer from "@/components/Footer";
import Header from "@/components/Header";

const faqs = [
  {
    question: "What does PlaySafe.games do?",
    answer:
      "PlaySafe.games helps you search Steam for games that are more suitable for children and families by filtering out tags, themes, and wording you may want to avoid.",
  },
  {
    question: "Are these results officially rated for kids?",
    answer:
      "No. PlaySafe.games is a filtering tool, not an official rating board. It is designed to reduce unwanted content, but parents and carers should still review each game before purchase.",
  },
  {
    question: "Why might some games still slip through?",
    answer:
      "Steam data can be inconsistent between tags, categories, titles, and descriptions. We do extra filtering, but some games may still appear if Steam’s own metadata is incomplete or delayed.",
  },
  {
    question: "How do the Hide filters work?",
    answer:
      "Hide filters remove games that match selected Steam tags or custom backend checks, including certain words found in titles and descriptions.",
  },
  {
    question: "Why are prices different for different users?",
    answer:
      "PlaySafe.games tries to detect the user’s storefront country and asks Steam for local pricing. If no reliable location data is available, it falls back to a default storefront.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="max-w-[1222px] mx-auto px-4 py-12">
        <div className="mx-auto max-w-[860px] text-center">
          <h1 className="font-['Lato'] text-[36px] font-bold text-black leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 font-['Lato'] text-[18px] text-black/75">
            A few quick answers about how PlaySafe.games works and what to expect from the filters.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-[860px] flex-col gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[22px] border-2 border-black bg-white px-6 py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-center gap-4 text-center">
                <span className="font-['Lato'] text-[28px] font-bold text-black leading-tight">
                  {faq.question}
                </span>
                <span className="text-[18px] font-bold text-black transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mx-auto mt-5 max-w-[700px] border-t-2 border-black pt-5 text-center">
                <p className="font-['Lato'] text-[18px] text-black/80 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
