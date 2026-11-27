import Image from "next/image";
import Link from "next/link";

import DisqusCommentCounts from "@/components/DisqusCommentCounts";
import SearchSiteLayout from "@/components/SearchSiteLayout";
import { formatNewsDate, getAllNewsArticles } from "@/lib/newsArticles";
import { isStagingBuild } from "@/lib/staging";

export const metadata = {
  title: "News - PlaySafe.games",
  description: "Family-friendly gaming guides, news, and recommendations from PlaySafe.games.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  const articles = getAllNewsArticles();
  const showComments = !isStagingBuild();

  return (
    <SearchSiteLayout>
      {showComments && <DisqusCommentCounts />}
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">News</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-[#514960] sm:text-lg">
            Guides and notes for finding safer, more family-friendly games.
          </p>
        </div>
        <div className="grid gap-4">
          {articles.map((article) => {
            const articlePath = `/news/${article.slug}`;
            return <article key={article.slug} className="overflow-hidden rounded-3xl border border-[#e8ddee] bg-white">
              <Link href={articlePath} className="group grid md:grid-cols-[1fr_1.15fr]">
                <div className="relative aspect-video w-full bg-[#eee4f4] md:aspect-auto md:min-h-56">
                  <Image src={article.imageUrl} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                </div>
                <div className="min-w-0 p-5 sm:p-7">
                  <time dateTime={article.publishedAt} className="text-sm font-bold text-[#514960]">{formatNewsDate(article.publishedAt)}</time>
                  <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[#4c2b66] group-hover:underline sm:text-3xl">{article.title}</h2>
                  <p className="mt-3 leading-relaxed text-[#514960]">{article.openingSentence}</p>
                </div>
              </Link>
              {showComments && <div className="border-t border-[#eee7f2] px-5 sm:px-7">
                <Link href={`${articlePath}#disqus_thread`} data-disqus-identifier={article.disqusIdentifier}
                  className="inline-flex min-h-11 items-center text-sm font-bold text-[#563569] underline underline-offset-4">
                  Comments
                </Link>
              </div>}
            </article>;
          })}
        </div>
      </main>
    </SearchSiteLayout>
  );
}
