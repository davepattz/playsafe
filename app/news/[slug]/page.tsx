import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import DisqusComments from "@/components/DisqusComments";
import { isStagingBuild } from "@/lib/staging";
import SearchSiteLayout from "@/components/SearchSiteLayout";
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

function getYouTubeEmbedUrl(youtubeUrl: string) {
  const videoId = new URL(youtubeUrl).searchParams.get("v");

  return videoId ? `https://www.youtube.com/embed/${videoId}` : youtubeUrl;
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
      title: "Blog - PlaySafe.games",
    };
  }

  return {
    title: `${article.title} - PlaySafe.games`,
    description: article.openingSentence,
    alternates: { canonical: `/news/${article.slug}` },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <SearchSiteLayout>
      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-8 sm:px-8 sm:py-10">
        <Link href="/news" className="inline-flex min-h-11 items-center font-bold text-[#563569] underline underline-offset-4">
          &larr; Back to Blog
        </Link>

        <article className="overflow-hidden rounded-3xl border border-[#e8ddee] bg-white">
          <div className="relative aspect-video bg-[#eee4f4]">
            <Image src={article.imageUrl} alt={article.imageAlt} fill preload sizes="(min-width: 896px) 832px, 100vw" className="object-cover" />
          </div>
          <div className="p-5 sm:p-8">
            <time dateTime={article.publishedAt} className="text-sm font-bold text-[#514960]">{formatNewsDate(article.publishedAt)}</time>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-[#514960]">{article.openingSentence}</p>

            <div className="mt-7 space-y-7">
              {article.sections.map((section) => (
                <section key={`${article.slug}-${section.heading ?? section.body.slice(0, 24)}`} className="border-t border-[#eee7f2] pt-6">
                  {section.heading && <h2 className="mb-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{section.heading}</h2>}
                  {section.youtubeUrl && section.heading && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-[#e8ddee] bg-black">
                      <iframe src={getYouTubeEmbedUrl(section.youtubeUrl)} title={`${section.heading} video`}
                        loading="lazy" className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen />
                    </div>
                  )}
                  <p className="leading-relaxed text-[#514960] sm:text-lg">{section.body}</p>
                  {section.playStyles && section.playStyles.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold">Play styles</h3>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {section.playStyles.map((playStyle) => <li key={playStyle} className="rounded-full bg-[#f2e9f8] px-3 py-1 text-sm font-bold text-[#563569]">
                          {playStyle}
                        </li>)}
                      </ul>
                    </div>
                  )}
                  {section.storeUrl && (
                    <a href={section.storeUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#4c2b66] px-4 font-bold text-white hover:bg-[#3a204e]">
                      View on Steam
                    </a>
                  )}
                </section>
              ))}
            </div>
          </div>
        </article>
        {!isStagingBuild() && <DisqusComments identifier={article.disqusIdentifier} title={article.title} />}
      </main>
    </SearchSiteLayout>
  );
}
