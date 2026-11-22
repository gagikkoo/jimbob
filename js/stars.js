// Galaxy background: three layers of stars that drift at different speeds as you scroll,
// twinkle, and now and then a shooting star. With motion off it draws one still frame.

const LAYERS = [
  { density: 0.00018, size: [0.4, 0.9], speed: 0.04, alpha: [0.25, 0.6] },
  { density: 0.00008, size: [0.8, 1.4], speed: 0.1, alpha: [0.4, 0.85] },
  { density: 0.00002, size: [1.3, 2.1], speed: 0.2, alpha: [0.7, 1] },
];
const TINTS = ["255,255,255", "224,212,255", "196,170,255"];
const rand = (a, b) => a + Math.random() * (b - a);

export function initStars() {
  const canvas = document.querySelector("[data-stars]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const moving = document.documentElement.classList.contains("motion");
  let w = 0, h = 0, dpr = 1, stars = [], shooter = null, nextShot = 0;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    LAYERS.forEach((l) => {
      const n = Math.round(w * h * l.density);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(...l.size),
          a: rand(...l.alpha),
          tw: rand(0.4, 1.6),
          ph: Math.random() * Math.PI * 2,
          speed: l.speed,
          tint: TINTS[(Math.random() * TINTS.length) | 0],
        });
      }
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const sy = window.scrollY;
    for (const s of stars) {
      const y = (((s.y - sy * s.speed) % h) + h) % h;
      const a = moving ? s.a * (0.65 + 0.35 * Math.sin(t * 0.001 * s.tw + s.ph)) : s.a;
      ctx.fillStyle = `rgba(${s.tint},${a})`;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.5) {
        // soft halo on the brightest stars
        ctx.fillStyle = `rgba(${s.tint},${a * 0.12})`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (!moving) return;

    if (!shooter && t > nextShot) {
      shooter = { x: rand(w * 0.2, w), y: rand(0, h * 0.5), vx: -rand(7, 11), vy: rand(2.5, 4), life: 0 };
    }
    if (shooter) {
      const s = shooter;
      s.x += s.vx; s.y += s.vy; s.life++;
      const fade = Math.min(1, s.life / 8) * Math.max(0, 1 - s.life / 70);
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
      g.addColorStop(0, `rgba(255,255,255,${fade})`);
      g.addColorStop(1, "rgba(184,150,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
      ctx.stroke();
      if (s.life > 70) { shooter = null; nextShot = t + rand(5000, 11000); }
    }
  }

  build();
  nextShot = performance.now() + 2500;
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); if (!moving) draw(0); }, 150);
  });

  if (!moving) {
    draw(0);
    window.addEventListener("scroll", () => draw(0), { passive: true });
    return;
  }
  const loop = (t) => { draw(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
