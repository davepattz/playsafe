// Update this list weekly with the Steam app IDs you want to feature first.
// These local fallbacks keep Popular useful if Steam pauses API access.
// Use priceLabel for a stable fallback such as "See Steam", "Free", or "$19.95".
// Platforms can be "windows", "macos", and/or "linux".
export const popularGames = [
  {
    appId: 413150,
    name: "Stardew Valley",
    releaseDate: "Feb 26, 2016",
    priceLabel: "See Steam",
    platforms: ["windows", "macos", "linux"],
  },
  {
    appId: 433340,
    name: "Slime Rancher",
    releaseDate: "Aug 1, 2017",
    priceLabel: "See Steam",
    platforms: ["windows", "macos", "linux"],
  },
  {
    appId: 1455840,
    name: "Dorfromantik",
    releaseDate: "Apr 28, 2022",
    priceLabel: "See Steam",
    platforms: ["windows", "macos", "linux"],
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
    appId: 1055540,
    name: "A Short Hike",
    releaseDate: "Jul 30, 2019",
    priceLabel: "See Steam",
    platforms: ["windows", "macos", "linux"],
  },
  {
    appId: 1337010,
    name: "Alba: A Wildlife Adventure",
    releaseDate: "Dec 11, 2020",
    priceLabel: "See Steam",
    platforms: ["windows", "macos"],
  },
  {
    appId: 1127500,
    name: "Mini Motorways",
    releaseDate: "Jul 20, 2021",
    priceLabel: "See Steam",
    platforms: ["windows", "macos"],
  },
  {
    appId: 1291340,
    name: "Townscaper",
    releaseDate: "Aug 26, 2021",
    priceLabel: "See Steam",
    platforms: ["windows", "macos"],
  },
];

export const popularGameAppIds = popularGames.map((game) => game.appId);
