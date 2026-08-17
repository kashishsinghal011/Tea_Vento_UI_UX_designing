/* ===========================================================
   VENTO — Hero
   Cinematic multi-layer hero. Reads Vento.scroll.y / velocity
   from the shared scroll engine (js/scroll.js) and drives:
     - background / glow / steam / leaves at independent depths
     - typography exit with per-line depth + blur
     - product physics: diagonal travel, rotation, scale, shadow
     - on-load entrance sequence
   Nothing here touches scroll.js or introduces new scrolling.
=========================================================== */
(function () {
  const Vento = window.Vento || (window.Vento = {});
  const reduced = Vento.prefersReduced;
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  // easeOutCubic / easeInOutQuad give position vs rotation vs scale
  // visibly different characters, per the "different easing per
  // property" brief, instead of one shared linear multiplier.
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function initHero() {
    const hero = $(".hero");
    if (!hero) return;

    const product = $(".hero-product", hero);
    const productImg = $(".hero-product-img", hero);
    const productShadow = $(".hero-product-shadow", hero);
    const glow = $(".hero-glow", hero);
    const steamVideo = $(".hero-steam-video", hero);
    const leaves = $$(".hero-decor", hero);
    const typeLayers = $$('[data-parallax-layer="type"]', hero);
    const heroH = () => hero.offsetHeight;

    /* ---------- Entrance sequence (runs once, on load-ready) ---------- */
    function playEntrance() {
      if (reduced) {
        hero.classList.add("hero-is-entered");
        return;
      }
      requestAnimationFrame(() => hero.classList.add("hero-is-entered"));
    }
    if (document.documentElement.classList.contains("is-ready")) {
      playEntrance();
    } else {
      const obs = new MutationObserver(() => {
        if (document.documentElement.classList.contains("is-ready")) {
          playEntrance();
          obs.disconnect();
        }
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    if (reduced) return; // keep hero static, respect the OS preference

    /* ---------- Scroll-driven depth + physics ---------- */
    Vento.onScrollFrame((s) => {
      const p = clamp01(s.y / heroH());
      const posT = easeOutCubic(p);
      const rotT = easeInOutQuad(p);

      // Product: diagonal travel toward where the Story visual will
      // sit, with its own scale/rotation/shadow easing so it reads
      // as a physical object settling rather than a linear fade.
      if (product) {
        const translateX = posT * 26;
        const translateY = posT * 150;
        const scale = 1 - posT * 0.16;
        const rotate = rotT * 7;
        product.style.transform =
          `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
        product.style.opacity = String(1 - easeInOutQuad(p) * 0.95);
      }
      if (productShadow) {
        productShadow.style.opacity = String(0.5 * (1 - p));
        productShadow.style.transform = `translateX(-50%) scale(${1 - p * 0.3})`;
      }
      if (productImg) {
        productImg.style.filter = `drop-shadow(0 ${40 - p * 20}px ${60 - p * 30}px rgba(51,11,10,${0.35 - p * 0.15}))`;
      }

      // Background depth stack — each layer moves at its own rate
      // so the hero reads as several planes, not one flat image.
      if (glow) glow.style.transform = `translateX(-50%) translateY(${p * 70}px) scale(${1 + p * 0.08})`;
      if (steamVideo) {
        steamVideo.style.transform = `translateY(${p * 30}px) scale(${1.02 + p * 0.05})`;
        steamVideo.style.opacity = String(0.22 * (1 - p * 0.6));
      }

      leaves.forEach((leaf, i) => {
        const dir = parseFloat(leaf.dataset.leafDir) || (i % 2 === 0 ? 1 : -1);
        const depth = 0.4 + (i % 3) * 0.18; // 0.4 / 0.58 / 0.76 across leaves
        const drift = Math.sin((s.y * 0.006) + i) * 6; // gentle sinusoidal life, not a straight line
        leaf.style.transform =
          `translate3d(${dir * p * 30 * depth + drift}px, ${p * -90 * depth}px, 0) rotate(${dir * p * 50}deg)`;
      });

      // Typography: each element exits at its own depth & blur so
      // the eyebrow, headline lines and CTA separate as they leave.
      typeLayers.forEach((el) => {
        const depth = parseFloat(el.dataset.depth) || 0.4;
        const t = clamp01(p / (depth + 0.35));
        const eased = easeOutCubic(t);
        el.style.transform = `translate3d(0, ${eased * -70 * (depth + 0.4)}px, 0)`;
        el.style.opacity = String(1 - eased * 1.3);
        el.style.filter = eased > 0.55 ? `blur(${(eased - 0.55) * 6}px)` : "none";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initHero);
})();
