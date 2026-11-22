// Pull name, visits, icon and thumbnail for Roblox games into js/data.js.
// Usage: node tools/fetch-games.mjs <game link> [<game link> ...]
// Re-run with no links to refresh visits for every game already listed.
// Max CCU is the all-time peak from rowatcher.com. Role, blurb and tags are yours; this script keeps them.
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

// RoWatcher's trend page says "All-time peak 236 on ..." (or "2K" once it passes 1,000).
async function rowatcherPeak(universeId) {
  const res = await fetch(`https://rowatcher.com/games/${universeId}/game/dying`, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return null;
  const m = (await res.text()).match(/All-time peak ([\d,.]+)\s*([KM]?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  const unit = { "": 1, K: 1e3, M: 1e6 }[m[2]];
  return { value: Math.round(n * unit), exact: !m[2], unit };
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
  const peak = await rowatcherPeak(universeId).catch(() => null);
  const out = {
    peak,
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
    const merged = i >= 0 ? { ...list[i], ...fresh, title: list[i].title || fresh.title } : { maxCCU: 0, role: "Scripting / UI", ...fresh };
    delete merged.playingNow;
    delete merged.peak;
    // Exact peaks only ever go up. A rounded one ("2K") is used only if nothing better is stored.
    const p = fresh.peak;
    const old = Number(merged.maxCCU) || 0;
    if (p && p.exact && p.value > old) merged.maxCCU = p.value;
    else if (p && !p.exact && p.value - p.unit / 2 > old) {
      merged.maxCCU = p.value;
      console.log(`  ! RoWatcher rounds this peak to ${p.value}. Open rowatcher.com/games/<id>/game/dying in a browser for the exact number.`);
    }
    if (i >= 0) list[i] = merged;
    else list.push(merged);
    console.log(`✓ ${merged.title}: ${merged.visits.toLocaleString()} visits, max CCU ${merged.maxCCU} (playing now: ${fresh.playingNow})`);
  } catch (e) {
    console.error(`✗ ${link}: ${e.message}`);
  }
}

const src = await readFile(dataFile, "utf8");
const cut = src.indexOf("export const games");
await writeFile(dataFile, src.slice(0, cut) + `export const games = ${JSON.stringify(list, null, 2)};\n`);
console.log(`Saved ${list.length} game(s) to js/data.js.`);
