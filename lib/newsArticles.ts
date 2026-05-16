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
    youtubeUrl?: string;
    playStyles?: string[];
    storeUrl?: string;
  }>;
}

export const newsArticles: NewsArticle[] = [
  {
    slug: "top-10-video-games-for-kids-under-5-on-steam",
    disqusIdentifier: "news-top-10-games-for-kids-under-5",
    title: "Top 10 Video Games for Kids Under 5 on Steam",
    publishedAt: "2026-05-09",
    imageUrl: "/news/top-10-video-games-for-kids-under-5-on-steam.jpg",
    imageAlt: "Top 10 Video Games for Kids Under 5 on Steam",
    openingSentence:
      "A great starter list for younger players, focused on simple controls, friendly themes and easy to pick up and play.",
    sections: [
      {
        body:
          "Choosing games for under-fives is less about chasing a perfect age rating and more about finding experiences that are calm, readable, and easy to stop and start.",
      },
      {
        heading: "1. Wobbly Life",
        body:
          "A bright, silly open-world sandbox with simple activities, playful physics, and lots of gentle exploring.",
        youtubeUrl: "https://www.youtube.com/watch?v=2invlS5ks04",
        playStyles: [
          "Single-player",
          "Online Co-op",
          "Shared/Split Screen Co-op",
          "Shared/Split Screen",
        ],
        storeUrl: "https://store.steampowered.com/app/1211020/Wobbly_Life/",
      },
      {
        heading: "2. Lil Gator Game",
        body:
          "A warm adventure about exploring, helping friends, and pretending to be a hero without heavy pressure.",
        youtubeUrl: "https://www.youtube.com/watch?v=WB02q9IJCi4",
        playStyles: ["Single-player"],
        storeUrl: "https://store.steampowered.com/app/1586800/Lil_Gator_Game/",
      },
      {
        heading: "3. Bluey: The Videogame",
        body:
          "A familiar, family-focused game built around the world of Bluey, with approachable co-op play.",
        youtubeUrl: "https://www.youtube.com/watch?v=nC7dKKQ7ZqQ",
        playStyles: [
          "Single-player",
          "Shared/Split Screen Co-op",
          "Shared/Split Screen",
        ],
        storeUrl: "https://store.steampowered.com/app/2078350/Bluey_The_Videogame/",
      },
      {
        heading: "4. Little Kitty, Big City",
        body:
          "A cheerful exploration game about wandering through a city as a curious cat and discovering small adventures.",
        youtubeUrl: "https://www.youtube.com/watch?v=gQMQxAS7a0E",
        playStyles: ["Single-player"],
        storeUrl: "https://store.steampowered.com/app/1177980/Little_Kitty_Big_City/",
      },
      {
        heading: "5. Portal Knights",
        body:
          "A colorful building and adventure game with simple fantasy exploration and room for grown-ups to help.",
        youtubeUrl: "https://www.youtube.com/watch?v=kiyceY4UIVw",
        playStyles: ["Single-player", "Shared/Split Screen Co-op"],
        storeUrl: "https://store.steampowered.com/app/374040/Portal_Knights/",
      },
      {
        heading: "6. Ben 10: Power Trip",
        body:
          "A straightforward character adventure based on the Ben 10 universe, with recognizable heroes and action.",
        youtubeUrl: "https://www.youtube.com/watch?v=XhnOTF3xAp8",
        playStyles: [
          "Single-player",
          "Shared/Split Screen Co-op",
          "Shared/Split Screen",
        ],
        storeUrl: "https://store.steampowered.com/app/1063040/Ben_10_Power_Trip/",
      },
      {
        heading: "7. PowerWash Simulator 2",
        body:
          "A satisfying cleaning game with clear goals, low-pressure play, and plenty of easy-to-understand progress.",
        youtubeUrl: "https://www.youtube.com/watch?v=xt6Lkfk_Sg8",
        playStyles: [
          "Single-player",
          "Online Co-op",
          "Shared/Split Screen Co-op",
          "Shared/Split Screen",
          "Cross-Platform Multiplayer",
        ],
        storeUrl: "https://store.steampowered.com/app/2968420/PowerWash_Simulator_2/",
      },
      {
        heading: "8. Sonic Frontiers",
        body:
          "A fast, colorful Sonic adventure with open areas to explore and lots of movement-focused play.",
        youtubeUrl: "https://www.youtube.com/watch?v=hv_zibBXjlg",
        playStyles: ["Single-player"],
        storeUrl: "https://store.steampowered.com/app/1237320/Sonic_Frontiers/",
      },
      {
        heading: "9. Ninja Kidz: Time Masters",
        body:
          "A kid-facing action game with simple arcade energy and a theme younger players may find exciting.",
        youtubeUrl: "https://www.youtube.com/watch?v=oZXjr1__e2A",
        storeUrl: "https://store.steampowered.com/app/2287000/NINJA_KIDZ_TIME_MASTERS/",
      },
      {
        heading: "10. Disney Dreamlight Valley",
        body:
          "A friendly theme park adventure that lets children explore Disney-inspired spaces and activities.",
        youtubeUrl: "https://www.youtube.com/watch?v=KUl5sWbOinY",
        playStyles: ["Single-player", "Multi-player"],
        storeUrl: "https://store.steampowered.com/app/1401590/Disney_Dreamlight_Valley/",
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
