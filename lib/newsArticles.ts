export interface NewsArticle {
  slug: string;
  title: string;
  publishedAt: string;
  imageUrl: string;
  imageAlt: string;
  openingSentence: string;
  sections: Array<{
    heading?: string;
    body: string;
  }>;
}

export const newsArticles: NewsArticle[] = [
  {
    slug: "top-10-games-for-kids-under-5",
    title: "Top 10 Games for Kids Under 5",
    publishedAt: "2026-05-09",
    imageUrl: "/banners/lilgator.png",
    imageAlt: "Lil Gator Game artwork",
    openingSentence:
      "A gentle starter list for younger players, focused on simple controls, friendly themes, and games that are easy for grown-ups to join.",
    sections: [
      {
        body:
          "Choosing games for under-fives is less about chasing a perfect age rating and more about finding experiences that are calm, readable, and easy to stop and start. This placeholder article gives the news section a real shape while the final recommendations are being written.",
      },
      {
        heading: "What Makes a Good First Game",
        body:
          "Look for simple inputs, low pressure, short play sessions, clear visual feedback, and little or no reading requirement. Games that let an adult guide the session, share a controller, or sit nearby and narrate what is happening tend to work best.",
      },
      {
        heading: "Draft Picks to Review",
        body:
          "Lil Gator Game, LEGO games, simple co-op cooking games, cozy exploration games, and creative sandbox titles are useful starting points. Before recommending anything, each game should be checked for text complexity, failure states, adverts, online features, and any themes that might surprise parents.",
      },
      {
        heading: "Parent Check",
        body:
          "Even a child-friendly game can vary by platform, mode, or online setting. The safest approach is to play the first session together, keep purchases and chat locked down, and use PlaySafe filters as a starting point rather than the only review step.",
      },
    ],
  },
];

export function getAllNewsArticles() {
  return [...newsArticles].sort(
    (firstArticle, secondArticle) =>
      new Date(secondArticle.publishedAt).getTime() -
      new Date(firstArticle.publishedAt).getTime(),
  );
}

export function getNewsArticle(slug: string) {
  return newsArticles.find((article) => article.slug === slug);
}

export function formatNewsDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
