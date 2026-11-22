# JIMBOB — Roblox portfolio

Static site (HTML, CSS, JS). No build step. Animations use GSAP + ScrollTrigger and Lenis smooth scrolling from jsDelivr. Visitors who prefer reduced motion, or who flip the "Motion" switch in the nav, get the page with no animation.

## Edit your info

Everything personal lives in `js/data.js`:

- `profile` holds your name and your Discord, Roblox and GitHub links
- `games` holds your published games

## Add a game

```bash
node tools/fetch-games.mjs "https://www.roblox.com/games/PLACE_ID/Name"
```

This pulls the title, visits, icon and thumbnail from Roblox and saves them into `js/data.js` and `assets/games/`. Then open `js/data.js` and set that game's `maxCCU`. You can also edit `role`, `blurb` and `tags` there. Add `"hideStats": true` to hide a game's Max CCU and Visits.

Run the script with no links to refresh visits for every game:

```bash
node tools/fetch-games.mjs
```

The top stats (total visits, highest max CCU, games published) are worked out from the list automatically.

## Preview locally

```bash
python3 -m http.server 5178
```

Then open http://localhost:5178. The site uses JS modules, so opening `index.html` straight from disk won't work.

## Publish on GitHub Pages

1. Push this folder to a GitHub repo.
2. Go to the repo's **Settings → Pages**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. The site goes live at `https://<username>.github.io/<repo>/`. If you name the repo `<username>.github.io`, it goes live at `https://<username>.github.io/`.
