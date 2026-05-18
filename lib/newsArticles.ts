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
        heading: "1. Wobbly Life",
        body:
          "Wobbly Life is a bright and playful open-world sandbox that feels perfectly designed for young kids and families. With silly physics, gentle exploring, simple activities, and hundreds of fun interactions across its surprisingly massive world, children can play completely at their own pace without pressure or difficulty spikes. Most objectives are easy to understand with picture-based guidance and very little reading required, making it especially accessible for younger players. Local split-screen co-op is a huge highlight, creating hilarious moments for parents, siblings, and friends, while regular updates continue to add even more charm, activities, vehicles, and places to discover together.",
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
          "Lil Gator Game is a charming and relaxing open-world adventure that's a wonderful pick for younger kids who simply want to explore, play, and discover at their own pace. With no health bars, fail states, or stressful combat, children can freely climb, swim, glide, and slide across a colourful island filled with friendly characters, simple quests, and imaginative playground-style fun. The gentle gameplay encourages curiosity and creativity, while the cardboard baddies and arts-and-crafts crafting system keep everything lighthearted and playful. Its cheerful world, easygoing design, and focus on friendship and exploration make it feel like stepping into a child's imagination brought to life.",
        youtubeUrl: "https://www.youtube.com/watch?v=WB02q9IJCi4",
        playStyles: ["Single-player"],
        storeUrl: "https://store.steampowered.com/app/1586800/Lil_Gator_Game/",
      },
      {
        heading: "3. Bluey: The Videogame",
        body:
          "Perfect for preschoolers and young families, Bluey: The Videogame captures the warmth, humour, and imagination of the beloved TV show in a gentle and easy-to-play adventure. Kids can explore familiar locations like the Heeler House, playgrounds, and the creek while playing favourite games from the series such as Keepy Uppy and Chattermax Chase. Designed to be fun rather than challenging, the game encourages creativity, exploration, and family play with local multiplayer that lets parents and kids enjoy the adventure together. With colourful visuals, simple gameplay, and plenty of charming references to the show, it feels like stepping directly into an interactive episode of Bluey.",
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
          "Little Kitty, Big City is a delightful open-world adventure that's perfect for younger kids who love animals, exploration, and silly playful moments. Players take control of a curious cat exploring a bright and peaceful city at their own pace, meeting friendly animal characters, completing simple quests, collecting adorable hats, and causing harmless chaos along the way. The relaxed gameplay has no pressure or difficulty spikes, making it ideal for children who simply want to wander, experiment, and discover new surprises. Its charming humour, gentle tone, and creative cat customisation options make it feel like an interactive cartoon full of personality and imagination.",
        youtubeUrl: "https://www.youtube.com/watch?v=gQMQxAS7a0E",
        playStyles: ["Single-player"],
        storeUrl: "https://store.steampowered.com/app/1177980/Little_Kitty_Big_City/",
      },
      {
        heading: "5. Portal Knights",
        body:
          "Portal Knights is a fantastic family-friendly alternative to Minecraft, blending colourful sandbox building with a lighter and more guided RPG adventure that can feel easier for younger players to understand. Kids can explore smaller bite-sized worlds, gather resources, build creative homes and castles, level up their character, and battle cartoon-style enemies without the harsher survival pressure found in some sandbox games. Its structured progression helps children feel consistently rewarded and rarely overwhelmed, while split-screen and online co-op make it a great game for parents, siblings, and friends to play together. With simple crafting, playful exploration, and a more directed adventure style, Portal Knights offers a gentler and more approachable take on the block-building genre.",
        youtubeUrl: "https://www.youtube.com/watch?v=kiyceY4UIVw",
        playStyles: ["Single-player", "Shared/Split Screen Co-op"],
        storeUrl: "https://store.steampowered.com/app/374040/Portal_Knights/",
      },
      {
        heading: "6. Ben 10: Power Trip",
        body:
          "Ben 10: Power Trip is a fun and approachable action adventure that's great for younger kids who enjoy superheroes, exploration, and simple combat. Missions are generally forgiving and not overly challenging, making it easy for children to enjoy the adventure while transforming into a wide variety of powerful aliens like Heatblast, Four Arms, and Diamondhead. The colourful open environments, light puzzles, and cartoon-style action capture the feel of the TV show while keeping the gameplay accessible for families. Local split-screen co-op is also included, although it unlocks shortly after the opening tutorial, allowing parents, siblings, or friends to jump in together for an enjoyable shared adventure.",
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
          "PowerWash Simulator 2 is a wonderfully relaxing and family-friendly game that turns cleaning into a surprisingly satisfying and rewarding activity for kids and parents alike. Players use power washers to spray away dirt, mud, and grime across colourful locations, creating a calm and enjoyable gameplay loop that can even help younger children understand the value of chores and tidying up. There's no pressure, time limits, or intense action, just the simple joy of transforming messy environments into sparkling clean spaces. With bright visuals, fun tools, split-screen co-op, adorable cats at your home base, and easy pick-up-and-play mechanics, it's an excellent game for winding down together while still feeling productive and engaging.",
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
          "Sonic Frontiers is a fantastic open-world adventure for kids who love speed, exploration, and freedom to play their own way. The game's massive islands are packed with colourful environments, simple puzzles, platforming challenges, and rewarding collectibles that encourage curiosity and experimentation. While easy enough for younger players to jump in and enjoy, the fast movement and platforming mechanics become incredibly satisfying to master over time, giving the game strong long-term appeal. Its open-zone design lets players freely explore at Sonic's pace, making it feel less restrictive than traditional platformers, while the bright visuals, familiar characters, and exciting sense of momentum create a fun and accessible single-player adventure for families and younger gamers.",
        youtubeUrl: "https://www.youtube.com/watch?v=hv_zibBXjlg",
        playStyles: ["Single-player"],
        storeUrl: "https://store.steampowered.com/app/1237320/Sonic_Frontiers/",
      },
      {
        heading: "9. Ninja Kidz: Time Masters",
        body:
          "Perfect for younger kids and families, NINJA KIDZ: TIME MASTERS combines colourful cartoon visuals, simple side-scrolling beat 'em up gameplay, and familiar characters from the hugely popular Ninja Kidz YouTube channel. Kids can choose their favourite Ninja Kid and enjoy forgiving combat that isn't too difficult, making it approachable for children under 5 when playing together with a parent or older sibling. With local co-op for up to four players and lighthearted action, it's an easy pick for families looking for a fun and accessible first action game.",
        youtubeUrl: "https://www.youtube.com/watch?v=oZXjr1__e2A",
        storeUrl: "https://store.steampowered.com/app/2287000/NINJA_KIDZ_TIME_MASTERS/",
      },
      {
        heading: "10. Disney Dreamlight Valley",
        body:
          "Disney Dreamlight Valley is a relaxing and magical life-sim adventure that's perfect for Disney-loving families and younger players who enjoy creativity, exploration, and gentle gameplay. Players can build their own dream neighbourhood alongside beloved Disney and Pixar characters, decorate homes, garden, fish, cook, complete simple quests, and slowly restore the Valley at their own pace. The game offers hundreds of hours of calm and rewarding content with no real pressure, making it an easy world to simply unwind in and explore however you like. Regular updates continue adding new characters and activities, while the sandbox-style freedom makes it especially appealing for creative kids. There are optional microtransactions and premium cosmetics, but the game remains highly enjoyable without spending extra money, especially for players happy to simply explore and enjoy the Disney atmosphere.",
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
