/* ===========================================================
   VENTO — Ritual (Boil -> Steep -> Simmer -> Pour)
   Each stage gets its own visual behaviour rather than the cup
   just rotating: video brightness/opacity shifts, ambient
   particles (leaf/steam flecks) drift during Steep, a slow glow
   pulse deepens during Simmer, and Pour animates a liquid stream
   into the cup with the caption transitioning alongside it.
=========================================================== */
(function () {
  const Vento = window.Vento || (window.Vento = {});
  const reduced = Vento.prefersReduced;
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  function initRitual() {
    const section = $(".ritual");
    if (!section) return;
    const sticky = $(".ritual-sticky", section);
    const steps = $$(".ritual-step", section);
    const cup = $(".ritual-cup", section);
    const caption = $(".ritual-caption", section);
    const video = $(".ritual-bg-video", section);
    const pourStream = $(".ritual-pour-stream", section);
    const cupLiquid = $(".ritual-cup-liquid", section);
    const captions = steps.map((s) => s.dataset.caption || "");
    let current = -1;

    // Per-stage video mood: Boil is brightest/most visible, the mix
    // settles by Ritual/Pour into a calmer, more atmospheric glow.
    const VIDEO_OPACITY = [0.24, 0.16, 0.2, 0.3];
    const VIDEO_BLEND = ["screen", "screen", "soft-light", "screen"];

    Vento.stickySequence({
      section,
      stageCount: steps.length,
      onProgress: (progress, stage) => {
        if (cup && !reduced) {
          cup.style.transform = `rotate(${-6 + progress * 12}deg) translateY(${Math.sin(progress * Math.PI) * -6}px)`;
        }
        if (stage === current) return;
        current = stage;

        steps.forEach((st, i) => st.classList.toggle("is-active", i === stage));
        sticky && (sticky.dataset.stage = String(stage));

        if (caption && captions[stage]) {
          caption.classList.remove("is-swapping");
          // restart the caption's exit/enter animation on each change
          void caption.offsetWidth;
          caption.classList.add("is-swapping");
          caption.textContent = captions[stage];
        }

        if (video && !reduced) {
          video.style.opacity = String(VIDEO_OPACITY[stage] ?? 0.16);
          video.style.mixBlendMode = VIDEO_BLEND[stage] ?? "screen";
        }

        // Pour (stage 3): draw the liquid stream and brighten the
        // cup's surface; every other stage keeps it hidden.
        if (pourStream) {
          pourStream.style.opacity = stage === 3 ? "1" : "0";
        }
        if (cupLiquid) {
          cupLiquid.style.opacity = stage >= 3 ? "1" : stage === 2 ? "0.7" : "0.4";
        }
      },
    });
  }

  document.addEventListener("DOMContentLoaded", initRitual);
})();
