import type { MetadataRoute } from "next";

import { getAllNewsArticles } from "@/lib/newsArticles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playsafe.games";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const articleRoutes: MetadataRoute.Sitemap = getAllNewsArticles().map((article) => ({
    url: `${SITE_URL}/news/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
