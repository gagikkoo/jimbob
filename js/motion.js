// All scroll and pointer motion. GSAP, ScrollTrigger and Lenis load as deferred globals.
// Nothing here runs when motion is off: the page is complete without it.
import { compact } from "./format.js";

const root = document.documentElement;
const finePointer = () => window.matchMedia("(pointer: fine)").matches;

function giveUp() {
  root.classList.remove("motion");
}

function fontsReady(timeout = 1200) {
  if (!document.fonts?.ready) return Promise.resolve();
  return Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, timeout))]);
}

// Wrap each word in a span, leaving inline pills alone.
function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest(".pill") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) frag.append(document.createTextNode(" "));
      else {
        const w = document.createElement("span");
        w.className = "w";
        w.textContent = part;
        frag.append(w);
      }
    }
    node.replaceWith(frag);
  }
  return [...el.querySelectorAll(".w, .pill")];
}

// Split a title on <br> into masked lines.
function splitLines(el) {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="line"><span>${p.trim()}</span></span>`).join("");
  return el.querySelectorAll(".line > span");
}

function countUp(el, gsap, opts = {}) {
  const target = Number(el.dataset.value ?? el.dataset.num) || 0;
  const plain = el.dataset.count === "games";
  const o = { v: 0 };
  return gsap.to(o, {
    v: target,
    duration: opts.duration ?? 2,
    ease: "power3.out",
    onUpdate: () => (el.textContent = plain ? String(Math.round(o.v)) : compact(o.v)),
    ...opts,
  });
}

export function initMotion() {
  if (!root.classList.contains("motion")) return null;
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return giveUp();
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Smooth scroll ----------
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    const id = a.getAttribute("href");
    const target = id === "#top" || id === "#main" ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4 });
    history.replaceState(null, "", id);
  });

  // ---------- Progress bar ----------
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  // ---------- Hero intro ----------
  const hero = document.querySelector("[data-hero]");
  fontsReady().then(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(".hero__letters .ch > span", { yPercent: 105, y: 0 }, { yPercent: 0, y: 0, duration: 1.5, stagger: 0.07 })
      .fromTo("[data-hero-orbit]", { opacity: 0, scale: 0.6, rotate: -20 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.8 }, 0.25)
      .fromTo(".hero__meta", { opacity: 0 }, { opacity: 1, duration: 1 }, 0.2)
      .fromTo(".hero__copy > *", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.55)
      .fromTo(".stat .mask > span", { yPercent: 105 }, { yPercent: 0, duration: 1.3, stagger: 0.08 }, 0.7)
      .add(() => document.querySelectorAll("[data-count]").forEach((el) => countUp(el, gsap, { duration: 2.2 })), 0.7);
    ScrollTrigger.refresh();
  });

  // Pointer depth: letters move least, orbit moves most.
  if (hero && finePointer()) {
    const layers = [...hero.querySelectorAll("[data-depth]")].map((el) => ({
      d: Number(el.dataset.depth) || 0,
      x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
    }));
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { l.x(nx * -40 * l.d); l.y(ny * -24 * l.d); });
    });
    hero.addEventListener("pointerleave", () => layers.forEach((l) => { l.x(0); l.y(0); }));
  }

  // Leaving the hero: letters sink, orbit rises, copy fades.
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
    .to(".hero__letters", { yPercent: 28, ease: "none" }, 0)
    .to(".orbit__core, .orbit__ring, .orbit__track", { yPercent: -30, ease: "none" }, 0)
    .to("[data-hero-copy], [data-stats]", { y: -50, opacity: 0, ease: "none", duration: 0.4 }, 0);

  // ---------- Orbit ----------
  const track = document.querySelector("[data-orbit-track]");
  if (track) {
    const items = [...track.children];
    let angle = 0;
    let speed = 0.25;
    gsap.ticker.add((_, dt) => {
      speed += (0.25 - speed) * 0.04;
      angle += (dt / 1000) * speed;
      const n = items.length;
      items.forEach((el, i) => {
        const a = angle + (i / n) * Math.PI * 2;
        const depth = Math.sin(a); // -1 back, 1 front
        const s = 0.68 + (depth + 1) * 0.22;
        el.style.transform = `translate(${Math.cos(a) * 220}%, ${depth * 127}%) rotate(12deg) scale(${s})`;
        el.style.zIndex = depth > 0 ? 3 : 0;
        el.style.opacity = 0.55 + (depth + 1) * 0.225;
      });
    });
    // Scrolling spins it faster for a moment.
    ScrollTrigger.create({
      trigger: hero, start: "top top", end: "bottom top",
      onUpdate: (self) => { speed = Math.max(speed, 0.25 + Math.min(Math.abs(self.getVelocity()) / 1200, 3)); },
    });
    const core = document.querySelector(".orbit__core .brick");
    if (core) {
      gsap.fromTo(core, { "--ry": "15deg" }, { "--ry": "75deg", duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo(core, { "--fy": "0px" }, { "--fy": "-16px", duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
  }

  // ---------- Statement: words light up as you read ----------
  const statement = document.querySelector("[data-words]");
  if (statement) {
    const words = splitWords(statement);
    gsap.to(words, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 45%", scrub: true } });
    gsap.fromTo(statement.querySelectorAll(".pill"), { scale: 0.3, rotate: -20 }, {
      scale: 1, rotate: 0, ease: "back.out(2)", stagger: 0.2,
      scrollTrigger: { trigger: statement, start: "top 80%", end: "top 40%", scrub: true },
    });
  }

  // ---------- Section titles rise out of masks ----------
  document.querySelectorAll("[data-split]").forEach((t) => {
    gsap.fromTo(splitLines(t), { yPercent: 105 }, {
      yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.1,
      scrollTrigger: { trigger: t, start: "top 85%", once: true },
    });
  });
  gsap.utils.toArray(".section-head__meta").forEach((m) => {
    gsap.fromTo(m, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: m, start: "top 90%", once: true } });
  });

  // ---------- Games ----------
  gsap.utils.toArray("[data-game]").forEach((game) => {
    const media = game.querySelector(".game__media");
    const img = game.querySelector("[data-parallax]");
    const info = game.querySelectorAll(".game__info > *, .game__info .chips li");
    const tl = gsap.timeline({ scrollTrigger: { trigger: game, start: "top 80%", once: true }, defaults: { ease: "expo.out" } });
    tl.fromTo(media, { clipPath: "inset(18% 12% 18% 12% round 40px)", scale: 0.94 }, { clipPath: "inset(0% 0% 0% 0% round 22px)", scale: 1, duration: 1.6 })
      .fromTo(game.querySelectorAll(".badge"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, 0.4)
      .add(() => game.querySelectorAll("[data-num]").forEach((b) => countUp(b, gsap, { duration: 1.8 })), 0.4)
      .fromTo(info, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.05 }, 0.2);
    if (img) {
      gsap.fromTo(img, { yPercent: -8, scale: 1.18 }, { yPercent: 8, scale: 1.18, ease: "none", scrollTrigger: { trigger: game, start: "top bottom", end: "bottom top", scrub: true } });
    }
  });

  // ---------- Bento ----------
  ScrollTrigger.batch("[data-cell]", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }),
  });
  const code = document.querySelector(".code");
  if (code) {
    gsap.fromTo(code.querySelectorAll(".ln"), { opacity: 0, x: -14 }, {
      opacity: 1, x: 0, duration: 0.5, ease: "power2.out", stagger: 0.12,
      scrollTrigger: { trigger: code, start: "top 80%", once: true },
    });
  }
  const stack = document.querySelector("[data-stack]");
  if (stack) {
    gsap.fromTo(stack.children, { y: -260, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: "bounce.out", stagger: 0.16,
      scrollTrigger: { trigger: stack, start: "top 85%", once: true },
    });
  }
  const line = document.querySelector("[data-draw]");
  if (line) {
    const len = line.getTotalLength();
    gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, ease: "none",
      scrollTrigger: { trigger: line.closest(".cell"), start: "top 85%", end: "bottom 60%", scrub: true },
    });
    gsap.fromTo(".graph__area", { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: line.closest(".cell"), start: "top 70%", end: "bottom 60%", scrub: true } });
  }

  // ---------- Tilt + pointer glow ----------
  if (finePointer()) {
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest?.("[data-tilt]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.transform = `perspective(1000px) rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 6}deg)`;
    });
    document.querySelectorAll("[data-tilt]").forEach((el) =>
      el.addEventListener("pointerleave", () => (el.style.transform = ""))
    );

    // Magnetic buttons
    document.querySelectorAll(".magnetic").forEach((btn) => {
      const x = gsap.quickTo(btn, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const y = gsap.quickTo(btn, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.3);
        y((e.clientY - r.top - r.height / 2) * 0.4);
      });
      btn.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  // ---------- Marquee: loops forever, scroll speed pushes it ----------
  const rows = gsap.utils.toArray("[data-marquee]").map((row) => {
    const inner = row.querySelector(".marquee__inner");
    for (let i = 0; i < 3; i++) row.append(inner.cloneNode(true));
    row.querySelectorAll(".marquee__inner").forEach((n, i) => i && n.setAttribute("aria-hidden", "true"));
    const dir = Number(row.dataset.marquee);
    const tween = gsap.fromTo(row, { xPercent: dir > 0 ? 0 : -25 }, { xPercent: dir > 0 ? -25 : 0, duration: 22, ease: "none", repeat: -1 });
    return tween;
  });
  if (rows.length) {
    let dir = 1;
    let boost = 1;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        dir = self.direction || dir;
        boost = Math.max(boost, 1 + Math.min(Math.abs(self.getVelocity()) / 400, 5));
      },
    });
    gsap.ticker.add(() => {
      boost += (1 - boost) * 0.06;
      rows.forEach((t) => t.timeScale(boost * dir));
    });
  }

  // ---------- Process tabs fade in ----------
  gsap.fromTo(".loop__tabs button, .loop__panels", { opacity: 0, y: 30 }, {
    opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
    scrollTrigger: { trigger: "[data-loop]", start: "top 82%", once: true },
  });

  // ---------- Closer: the lockup closes in, bricks rise ----------
  const closer = document.querySelector("[data-closer]");
  if (closer) {
    const spans = closer.querySelectorAll(".closer__title span");
    gsap.timeline({ scrollTrigger: { trigger: closer, start: "top bottom", end: "top 15%", scrub: true } })
      .fromTo(spans[0], { xPercent: -22 }, { xPercent: 0, ease: "none" }, 0)
      .fromTo(spans[1], { xPercent: 18 }, { xPercent: 0, ease: "none" }, 0)
      .fromTo("[data-closer-bricks] .brick", { "--by": "160px", "--ry": "5deg" }, { "--by": "0px", "--ry": "60deg", ease: "none", stagger: 0.05 }, 0);
    gsap.utils.toArray("[data-closer-bricks] .brick").forEach((b, i) => {
      gsap.fromTo(b, { "--fy": "0px" }, { "--fy": "-14px", duration: 1.8 + i * 0.3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1 });
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  return { lenis };
}
