// Pull name, visits, icon and thumbnail for Roblox games into js/data.js.
// Usage: node tools/fetch-games.mjs <game link> [<game link> ...]
// Re-run with no links to refresh visits for every game already listed.
// Max CCU, role, blurb and tags are yours to type in data.js; this script keeps them.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const dataFile = path.join(site, "js", "data.js");

async function getJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "portfolio-fetch/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function download(url, rel) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(path.join(site, rel), Buffer.from(await res.arrayBuffer()));
  return rel;
}

function placeIdFrom(link) {
  const m = String(link).match(/games\/(\d+)/) || String(link).match(/^(\d+)$/);
  if (!m) throw new Error(`No place id in: ${link}`);
  return m[1];
}

async function fetchGame(link) {
  const placeId = placeIdFrom(link);
  const { universeId } = await getJSON(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
  const { data } = await getJSON(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
  const g = data[0];
  const icon = (await getJSON(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`)).data[0];
  const thumb = (await getJSON(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=Png&countPerUniverse=1`)).data[0]?.thumbnails?.[0];
  const out = {
    title: g.name.replace(/^(\s*[\[(][^\])]*[\])]\s*)+/, "").trim(), // drop update tags like [🍂]
    link: `https://www.roblox.com/games/${placeId}`,
    visits: g.visits,
    playingNow: g.playing,
  };
  if (icon?.state === "Completed") out.icon = await download(icon.imageUrl, `assets/games/${placeId}-icon.png`);
  if (thumb?.state === "Completed") out.thumb = await download(thumb.imageUrl, `assets/games/${placeId}-thumb.png`);
  return out;
}

const { profile, games } = await import(pathToFileURL(dataFile).href + `?t=${Date.now()}`);
const links = process.argv.slice(2);
const targets = links.length ? links : games.map((g) => g.link).filter(Boolean);
if (!targets.length) {
  console.log("Pass one or more Roblox game links.");
  process.exit(1);
}

const list = [...games];
for (const link of targets) {
  try {
    const fresh = await fetchGame(link);
    const i = list.findIndex((g) => g.link && placeIdFrom(g.link) === placeIdFrom(fresh.link));
    const merged = i >= 0 ? { ...list[i], ...fresh, title: list[i].title || fresh.title } : { maxCCU: 0, role: "Scripting / Building", ...fresh };
    delete merged.playingNow;
    if (i >= 0) list[i] = merged;
    else list.push(merged);
    console.log(`✓ ${merged.title}: ${merged.visits.toLocaleString()} visits (playing now: ${fresh.playingNow})`);
  } catch (e) {
    console.error(`✗ ${link}: ${e.message}`);
  }
}

const src = await readFile(dataFile, "utf8");
const cut = src.indexOf("export const games");
await writeFile(dataFile, src.slice(0, cut) + `export const games = ${JSON.stringify(list, null, 2)};\n`);
console.log(`Saved ${list.length} game(s) to js/data.js. Set maxCCU for each one by hand.`);
