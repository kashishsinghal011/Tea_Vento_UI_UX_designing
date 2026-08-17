/* ===========================================================
   VENTO — Product Collection
   Card entrance/hover already lives in tokens.css + animations.css
   (transform/opacity transitions, IntersectionObserver reveal in
   app.js). This file adds the desktop-only interactive layer:
   subtle cursor parallax on the product image and an accent-
   tinted glow that reflects each chai's identity.
=========================================================== */
(function () {
  const Vento = window.Vento || (window.Vento = {});
  const reduced = Vento.prefersReduced;
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  const ACCENTS = {
    red: "rgba(182,42,34,.35)",
    orange: "rgba(224,142,44,.35)",
    gold: "rgba(231,200,124,.5)",
  };

  function initProductCards() {
    const cards = $$(".product-card");
    if (!cards.length) return;

    const canHover = window.matchMedia("(pointer: fine)").matches;

    cards.forEach((card) => {
      const img = card.querySelector(".product-card-img");
      const glow = card.querySelector(".product-card-glow");
      const accent = ACCENTS[card.dataset.accent] || ACCENTS.gold;
      if (glow) glow.style.background = `radial-gradient(closest-side, ${accent}, transparent 70%)`;

      if (!canHover || reduced || !img) return;

      let raf = null;
      let hovering = false;
      let targetX = 0, targetY = 0, curX = 0, curY = 0;
      const MAX = 12; // px — keep movement subtle per the design brief

      function apply() {
        curX += (targetX - curX) * 0.18;
        curY += (targetY - curY) * 0.18;
        const settled = Math.abs(targetX - curX) < 0.05 && Math.abs(targetY - curY) < 0.05;
        if (!hovering && settled) {
          img.style.transform = ""; // hand control back to the CSS hover default
          raf = null;
          return;
        }
        img.style.transform = `translate3d(${curX}px, ${curY - 8}px, 0) scale(1.04) rotate(${curX * 0.15}deg)`;
        raf = settled ? null : requestAnimationFrame(apply);
      }

      card.addEventListener("mousemove", (e) => {
        hovering = true;
        const rect = card.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = nx * MAX * 2;
        targetY = ny * MAX * 2;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      card.addEventListener("mouseleave", () => {
        hovering = false;
        targetX = 0;
        targetY = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initProductCards);
})();
