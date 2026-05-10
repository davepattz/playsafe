export interface NewsArticle {
  slug: string;
  disqusIdentifier: string;
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
    slug: "top-10-video-games-for-kids-under-5-on-steam",
    disqusIdentifier: "news-top-10-games-for-kids-under-5",
    title: "Top 10 Video Games for Kids Under 5 on Steam",
    publishedAt: "2026-05-09",
    imageUrl: "/banners/lilgator.png",
    imageAlt: "Lil Gator Game artwork",
    openingSentence:
      "A gentle starter list for younger players, focused on simple controls, friendly themes, and games that are easy for grown-ups to join.",
    sections: [
      {
        body:
          "Choosing games for under-fives is less about chasing a perfect age rating and more about finding experiences that are calm, readable, and easy to stop and start.",
      },
      {
        heading: "1. Wobbly Life",
        body:
          "A bright, silly open-world sandbox with simple activities, playful physics, and lots of gentle exploring.",
      },
      {
        heading: "2. Lil Gator Game",
        body:
          "A warm adventure about exploring, helping friends, and pretending to be a hero without heavy pressure.",
      },
      {
        heading: "3. Bluey: The Videogame",
        body:
          "A familiar, family-focused game built around the world of Bluey, with approachable co-op play.",
      },
      {
        heading: "4. Little Kitty, Big City",
        body:
          "A cheerful exploration game about wandering through a city as a curious cat and discovering small adventures.",
      },
      {
        heading: "5. Portal Knights",
        body:
          "A colorful building and adventure game with simple fantasy exploration and room for grown-ups to help.",
      },
      {
        heading: "6. Ben 10",
        body:
          "A straightforward character adventure based on the Ben 10 universe, with recognizable heroes and action.",
      },
      {
        heading: "7. PowerWash Simulator 2",
        body:
          "A satisfying cleaning game with clear goals, low-pressure play, and plenty of easy-to-understand progress.",
      },
      {
        heading: "8. Sonic Frontiers",
        body:
          "A fast, colorful Sonic adventure with open areas to explore and lots of movement-focused play.",
      },
      {
        heading: "9. NINJA KIDZ: TIME MASTERS",
        body:
          "A kid-facing action game with simple arcade energy and a theme younger players may find exciting.",
      },
      {
        heading: "10. Disneyland Adventures",
        body:
          "A friendly theme park adventure that lets children explore Disney-inspired spaces and activities.",
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
