// Update this list weekly with the Steam app IDs you want to feature first.
// These local fallbacks keep Popular useful if Steam pauses API access.
// Use priceLabel for a stable fallback such as "See Steam", "Free", or "$19.95".
// Platforms can be "windows", "macos", and/or "linux".
export const popularGames = [
  {
    appId: 1211020,
    name: "Wobbly Life",
    releaseDate: "Sep 18, 2025",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
  {
    appId: 433340,
    name: "Slime Rancher",
    releaseDate: "Aug 1, 2017",
    priceLabel: "See Steam",
    platforms: ["windows", "macos", "linux"],
  },
  {
    appId: 2968420,
    name: "PowerWash Simulator 2",
    releaseDate: "Oct 23, 2025",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
  {
    appId: 1135690,
    name: "Unpacking",
    releaseDate: "Nov 2, 2021",
    priceLabel: "See Steam",
    platforms: ["windows", "macos", "linux"],
  },
  {
    appId: 920210,
    name: "LEGO Star Wars: The Skywalker Saga",
    releaseDate: "Apr 5, 2022",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
  {
    appId: 837470,
    name: "Untitled Goose Game",
    releaseDate: "Sep 23, 2020",
    priceLabel: "See Steam",
    platforms: ["windows", "macos"],
  },
  {
    appId: 2486820,
    name: "Sonic Racing: CrossWorlds",
    releaseDate: "Sep 25, 2025",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
  {
    appId: 1337010,
    name: "Alba: A Wildlife Adventure",
    releaseDate: "Dec 11, 2020",
    priceLabel: "See Steam",
    platforms: ["windows", "macos"],
  },
  {
    appId: 2993780,
    name: "FANTASY LIFE i: The Girl Who Steals Time",
    releaseDate: "May 21, 2025",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
  {
    appId: 2495100,
    name: "Hello Kitty Island Adventure",
    releaseDate: "Jan 30, 2025",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
  {
    appId: 1401590,
    name: "Disney Dreamlight Valley",
    releaseDate: "Dec 5, 2023",
    priceLabel: "See Steam",
    platforms: ["windows"],
  },
];

export const popularGameAppIds = popularGames.map((game) => game.appId);
