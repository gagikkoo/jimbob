// Everything on the page that changes per person lives here.

export const profile = {
  name: "JIMBOB",
  discord: "https://discord.com/users/487766643934756884",
  roblox: "https://www.roblox.com/", // your Roblox profile
  github: "https://github.com/gagikkoo",
};

// Published games only. `npm run fetch -- <roblox game link>` (see README) fills in
// title, visits, icon and thumbnail from Roblox. Max CCU you type in yourself.
//
// {
//   title: "Game name",
//   link: "https://www.roblox.com/games/PLACE_ID",
//   maxCCU: 12400,           // your peak concurrent players
//   visits: 3800000,         // filled by the fetch script
//   icon: "assets/games/PLACE_ID-icon.png",
//   thumb: "assets/games/PLACE_ID-thumb.png",
//   role: "Scripting / Building",
//   blurb: "One or two lines about what you made.",
//   tags: ["Systems", "Map", "Monetization"],
//   hideStats: true,         // hide Max CCU / Visits for this game (and leave it out of the totals)
// }
export const games = [
  {
    "maxCCU": 0,
    "role": "Scripting / Building",
    "title": "Eat All The Slime!",
    "blurb": "Eat your way out of houses packed with slime, flush what you ate for coins, and buy bigger tools to escape house after house.",
    "tags": [
      "Full game",
      "Systems",
      "Map",
      "Monetization"
    ],
    "link": "https://www.roblox.com/games/93325887899188",
    "visits": 974847,
    "icon": "assets/games/93325887899188-icon.png",
    "thumb": "assets/games/93325887899188-thumb.png"
  },
  {
    "maxCCU": 0,
    "role": "Scripting / Building",
    "title": "Break Prison Walls!",
    "blurb": "Punch through your cell wall chunk by chunk, hide the evidence before the guard looks, and break out of tougher and tougher prisons.",
    "tags": [
      "Full game",
      "Systems",
      "Map",
      "Stealth"
    ],
    "link": "https://www.roblox.com/games/133879656874943",
    "visits": 581008,
    "icon": "assets/games/133879656874943-icon.png",
    "thumb": "assets/games/133879656874943-thumb.png"
  },
  {
    "maxCCU": 0,
    "role": "Scripting / Building",
    "title": "Sideline Soccer",
    "hideStats": true,
    "blurb": "Fast side-on soccer on the beach. Spin for anime-inspired styles, each with its own signature ability, and time the perfect shot in 1v1 and 2v2 matches.",
    "tags": [
      "Full game",
      "Systems",
      "Abilities",
      "PvP"
    ],
    "link": "https://www.roblox.com/games/77401482361058",
    "visits": 651,
    "icon": "assets/games/77401482361058-icon.png",
    "thumb": "assets/games/77401482361058-thumb.png"
  },
  {
    "maxCCU": 0,
    "role": "Scripting / Building",
    "title": "Dive",
    "blurb": "Dive into a giant blue hole through 13 zones down to 2,000m, harpoon 200+ fish and leviathans, hunt rare mutations and show off your best catches on your plot.",
    "tags": ["Full game", "Systems", "Map", "Live events"],
    "link": "https://www.roblox.com/games/115870835122969",
    "visits": 71389,
    "icon": "assets/games/115870835122969-icon.png",
    "thumb": "assets/games/115870835122969-thumb.png"
  }
];
