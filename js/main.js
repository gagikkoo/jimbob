import { profile, games } from "./data.js";
import { initMotion } from "./motion.js";
import { compact } from "./format.js";

const root = document.documentElement;

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function applyProfile() {
  const name = profile.name || "";
  document.querySelectorAll("[data-name]").forEach((el) => (el.textContent = name));
  const h1 = document.querySelector("[data-hero-word]");
  if (h1) h1.setAttribute("aria-label", name);
  const letters = document.querySelector("[data-letters]");
  if (letters) {
    letters.innerHTML = [...name].map((c) => `<span class="ch"><span>${esc(c)}</span></span>`).join("");
  }
  const set = (sel, url) => url && document.querySelectorAll(sel).forEach((a) => (a.href = url));
  set("[data-discord]", profile.discord);
  set("[data-roblox]", profile.roblox);
  set("[data-github]", profile.github);
}

function renderStats() {
  const counted = games.filter((g) => !g.hideStats);
  const visits = counted.reduce((s, g) => s + (Number(g.visits) || 0), 0);
  const ccu = counted.reduce((m, g) => Math.max(m, Number(g.maxCCU) || 0), 0);
  const values = { visits, ccu, games: games.length };
  document.querySelectorAll("[data-count]").forEach((el) => {
    const v = values[el.dataset.count];
    if (!v) { el.textContent = "—"; el.removeAttribute("data-count"); return; }
    el.dataset.value = v;
    el.textContent = el.dataset.count === "games" ? String(v) : compact(v);
  });
}

function renderGames() {
  const list = document.querySelector("[data-games]");
  if (!list) return;
  if (!games.length) {
    list.innerHTML = `<div class="games__empty"><strong>Games loading in.</strong>Published games show up here with their max CCU and visits.</div>`;
    return;
  }
  // Biggest game first
  const sorted = [...games].sort((a, b) => !!a.hideStats - !!b.hideStats || (b.maxCCU || 0) - (a.maxCCU || 0) || (b.visits || 0) - (a.visits || 0));
  list.innerHTML = sorted
    .map((g, i) => {
      const num = String(i + 1).padStart(2, "0");
      const tag = g.link ? "a" : "div";
      const href = g.link ? ` href="${esc(g.link)}" target="_blank" rel="noopener"` : "";
      const label = g.link ? ` aria-label="Play ${esc(g.title)} on Roblox"` : "";
      return `
      <article class="game" data-game>
        <${tag} class="game__media" data-tilt${href}${label}>
          ${g.thumb ? `<img src="${esc(g.thumb)}" alt="" loading="lazy" data-parallax />` : ""}
          <span class="game__num mono">${num}</span>
          ${g.hideStats ? "" : `<div class="game__badges">
            <div class="badge badge--hot"><b ${g.maxCCU ? `data-num="${Number(g.maxCCU)}"` : ""}>${g.maxCCU ? compact(g.maxCCU) : "—"}</b><small>Max CCU</small></div>
            <div class="badge"><b data-num="${Number(g.visits) || 0}">${compact(g.visits)}</b><small>Visits</small></div>
          </div>`}
        </${tag}>
        <div class="game__info">
          ${g.role ? `<p class="game__role mono">${esc(g.role)}</p>` : ""}
          <h3 class="game__title">${g.icon ? `<img class="game__icon" src="${esc(g.icon)}" alt="" loading="lazy" />` : ""}${esc(g.title)}</h3>
          ${g.blurb ? `<p class="game__blurb">${esc(g.blurb)}</p>` : ""}
          ${g.tags?.length ? `<ul class="chips">${g.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          ${g.link ? `<a class="game__play" href="${esc(g.link)}" target="_blank" rel="noopener">Play on Roblox <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </article>`;
    })
    .join("");
}

// Game icons ride the hero orbit. With fewer than 5, coloured studs fill the gaps.
function renderOrbit() {
  const track = document.querySelector("[data-orbit-track]");
  if (!track) return;
  const icons = games.filter((g) => g.icon).slice(0, 7);
  const studs = ["#ff5b2e", "#9b8cff", "#ffc53d", "#f3eee6", "#ff8a5c"];
  const items = icons.map((g) => `<div class="orbit__item"><img src="${esc(g.icon)}" alt="" /></div>`);
  for (let i = 0; items.length < 5; i++) items.push(`<div class="orbit__item orbit__item--stud" style="--c:${studs[i % studs.length]}"></div>`);
  track.innerHTML = items.join("");
}

function initMotionToggle() {
  const btn = document.querySelector("[data-motion-toggle]");
  if (!btn) return;
  const label = btn.querySelector("[data-motion-label]");
  const on = root.classList.contains("motion");
  btn.setAttribute("aria-pressed", String(on));
  label.textContent = on ? "Motion on" : "Motion off";
  btn.addEventListener("click", () => {
    const next = btn.getAttribute("aria-pressed") !== "true";
    try { localStorage.setItem("motion", next ? "on" : "off"); } catch (e) {}
    location.reload();
  });
}

// Process tabs: click to switch, and they advance on their own while motion is on.
function initLoop() {
  const loop = document.querySelector("[data-loop]");
  if (!loop) return;
  const tabs = [...loop.querySelectorAll("[data-step]")];
  const panels = [...loop.querySelectorAll(".loop__panel")];
  const pauseBtn = loop.querySelector("[data-loop-pause]");
  const STEP_MS = 5200;
  let index = 0;
  let paused = !root.classList.contains("motion");
  let elapsed = 0;
  let visible = false;

  if (paused) pauseBtn.hidden = true;

  const show = (i) => {
    index = i;
    tabs.forEach((t, n) => {
      t.setAttribute("aria-selected", String(n === i));
      t.tabIndex = n === i ? 0 : -1;
      t.querySelector(".bar i").style.transform = "scaleX(0)";
    });
    panels.forEach((p, n) => p.classList.toggle("is-active", n === i));
    elapsed = 0;
  };

  tabs.forEach((t, n) =>
    t.addEventListener("click", () => {
      show(n);
    })
  );
  loop.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    show((index + dir + tabs.length) % tabs.length);
    tabs[index].focus();
  });
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "Play loop" : "Pause loop";
  });
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(loop);

  let last = performance.now();
  const tick = (now) => {
    const dt = now - last;
    last = now;
    if (!paused && visible) {
      elapsed += dt;
      const p = Math.min(elapsed / STEP_MS, 1);
      tabs[index].querySelector(".bar i").style.transform = `scaleX(${p})`;
      if (p >= 1) show((index + 1) % tabs.length);
    }
    requestAnimationFrame(tick);
  };
  show(0);
  if (!paused) requestAnimationFrame(tick);
}

function init() {
  window.__ready = true;
  applyProfile();
  renderStats();
  renderGames();
  renderOrbit();
  initMotionToggle();
  initLoop();
  window.__motion = initMotion();
}

init();
