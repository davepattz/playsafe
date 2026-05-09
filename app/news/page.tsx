import Image from "next/image";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { formatNewsDate, getAllNewsArticles } from "@/lib/newsArticles";

export const metadata = {
  title: "News - PlaySafe.games",
  description: "Family-friendly gaming guides, news, and recommendations from PlaySafe.games.",
};

export default function NewsPage() {
  const articles = getAllNewsArticles();

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="max-w-[1222px] mx-auto px-4 py-12">
        <div className="mx-auto max-w-[860px] text-center">
          <h1 className="font-['Lato'] text-[36px] font-bold leading-tight text-black">
            News
          </h1>
          <p className="mt-4 font-['Lato'] text-[18px] leading-relaxed text-black/75">
            Guides and notes for finding safer, more family-friendly games.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-[22px] border-2 border-black bg-white">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/news/${article.slug}`}
                  className="group block border-b-2 border-black last:border-b-0 hover:bg-[#f8f8f8]"
                >
                  <article className="flex flex-col md:flex-row">
                    <div className="relative aspect-[16/9] w-full bg-gray-200 md:w-[320px] md:flex-shrink-0">
                      <Image
                        src={article.imageUrl}
                        alt={article.imageAlt}
                        fill
                        sizes="(min-width: 768px) 320px, 100vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-5">
                      <time className="font-['Lato'] text-[14px] font-bold uppercase text-black/60">
                        {formatNewsDate(article.publishedAt)}
                      </time>
                      <h2 className="font-['Lato'] text-[28px] font-bold leading-tight text-black group-hover:text-[#b185e8]">
                        {article.title}
                      </h2>
                      <p className="font-['Lato'] text-[18px] leading-relaxed text-black/75">
                        {article.openingSentence}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>

          <Sidebar />
        </div>
      </section>

      <Footer />
    </main>
  );
}
