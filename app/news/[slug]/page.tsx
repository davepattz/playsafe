import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  formatNewsDate,
  getAllNewsArticles,
  getNewsArticle,
} from "@/lib/newsArticles";

interface NewsArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return getAllNewsArticles().map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticle(slug);

  if (!article) {
    return {
      title: "News - PlaySafe.games",
    };
  }

  return {
    title: `${article.title} - PlaySafe.games`,
    description: article.openingSentence,
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="max-w-[1222px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <article className="lg:col-span-3">
            <Link
              href="/news"
              className="font-['Lato'] text-[16px] font-bold text-black hover:text-[#b185e8]"
            >
              Back to News
            </Link>

            <div className="mt-6 overflow-hidden rounded-[22px] border-2 border-black bg-white">
              <div className="relative aspect-[16/9] w-full bg-gray-200">
                <Image
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 890px, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8">
                <time className="font-['Lato'] text-[14px] font-bold uppercase text-black/60">
                  {formatNewsDate(article.publishedAt)}
                </time>
                <h1 className="mt-3 font-['Lato'] text-[36px] font-bold leading-tight text-black md:text-[44px]">
                  {article.title}
                </h1>
                <p className="mt-5 font-['Lato'] text-[20px] font-bold leading-relaxed text-black/80">
                  {article.openingSentence}
                </p>

                <div className="mt-8 flex flex-col gap-7 border-t-2 border-black pt-8">
                  {article.sections.map((section) => (
                    <section key={`${article.slug}-${section.heading ?? section.body.slice(0, 24)}`}>
                      {section.heading && (
                        <h2 className="font-['Lato'] text-[26px] font-bold leading-tight text-black">
                          {section.heading}
                        </h2>
                      )}
                      <p className="mt-3 font-['Lato'] text-[18px] leading-relaxed text-black/75">
                        {section.body}
                      </p>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <Sidebar />
        </div>
      </section>

      <Footer />
    </main>
  );
}
