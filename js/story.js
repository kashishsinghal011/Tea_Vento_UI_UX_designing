/* ===========================================================
   VENTO — Story (Origin -> Blend -> Brew -> Ritual)
   A continuous, scroll-scrubbed sticky sequence rather than a
   hard image-1/image-2 switch. Uses Vento.stickySequence (from
   app.js) to read section-relative progress each frame, then
   interpolates:
     - outgoing/incoming product transform + opacity by the
       fractional position between two stages
     - background colour wash (Origin greens -> Blend spice ->
       Brew maroon -> Ritual cream), cross-faded continuously
     - text frame swap + progress bar fill
=========================================================== */
(function () {
  const Vento = window.Vento || (window.Vento = {});
  const reduced = Vento.prefersReduced;
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // One background wash per stage — interpolated via crossfaded
  // opacity on the sticky container's ::before/::after equivalent
  // (two CSS custom properties consumed by tokens.css).
  const STAGE_WASH = [
    "radial-gradient(120% 100% at 15% 10%, rgba(62,91,52,.14), transparent 60%)",   // Origin — botanical green
    "radial-gradient(120% 100% at 85% 15%, rgba(182,42,34,.16), transparent 60%)",  // Blend — spice red
    "radial-gradient(120% 100% at 20% 90%, rgba(51,11,10,.22), transparent 65%)",   // Brew — deep maroon
    "radial-gradient(120% 100% at 80% 85%, rgba(231,200,124,.20), transparent 65%)" // Ritual — cream/gold
  ];

  function initStory() {
    const section = $(".story");
    if (!section) return;
    const sticky = $(".story-sticky", section);
    const frames = $$(".story-frame", section);
    const imgs = $$(".story-img", section);
    const bgPhotos = $$(".story-bg-photo", section);
    const fill = $(".story-progress-fill", section);
    const labels = $$(".story-progress-labels span", section);
    const stageCount = frames.length;
    let currentStage = -1;

    Vento.stickySequence({
      section,
      stageCount,
      onProgress: (progress) => {
        const scaled = clamp01(progress) * stageCount;
        const idx = Math.min(stageCount - 1, Math.floor(scaled));
        const frac = reduced ? 0 : clamp01(scaled - idx);
        const nextIdx = Math.min(stageCount - 1, idx + 1);

        // Text frames + labels only need a discrete swap at each
        // stage boundary — swapping continuously would make copy
        // unreadable, so this part stays binary.
        if (idx !== currentStage) {
          currentStage = idx;
          frames.forEach((f, i) => f.classList.toggle("is-active", i === idx));
          labels.forEach((l, i) => l.classList.toggle("is-active", i === idx));
        }

        // Progress fill stretches continuously across the whole
        // timeline (not just per-stage) for a true scroll-scrub feel.
        if (fill) fill.style.transform = `scaleX(${clamp01(progress)})`;

        if (reduced) {
          imgs.forEach((im, i) => im.classList.toggle("is-active", i === idx));
          bgPhotos.forEach((p, i) => p.classList.toggle("is-active", i === idx));
          if (sticky) sticky.style.setProperty("--story-wash", STAGE_WASH[idx]);
          return;
        }

        // Product transition: outgoing image eases out with scale
        // + rotation + slide, incoming eases in from the opposite
        // side — driven directly by `frac`, so it scrubs with the
        // scrollbar instead of firing a fixed CSS transition.
        const t = easeInOutQuad(frac);
        imgs.forEach((img, i) => {
          if (i === idx) {
            const scale = 1 - t * 0.18;
            const rotate = -2 - t * 4;
            const tx = -t * 90;
            img.style.opacity = String(1 - t);
            img.style.transform = `translate3d(${tx}px, ${t * -10}px, 0) scale(${scale}) rotate(${rotate}deg)`;
            img.style.zIndex = 2;
          } else if (i === nextIdx && nextIdx !== idx) {
            const scale = 0.82 + t * 0.18;
            const rotate = 6 - t * 6;
            const tx = 90 - t * 90;
            img.style.opacity = String(t);
            img.style.transform = `translate3d(${tx}px, ${(1 - t) * 10}px, 0) scale(${scale}) rotate(${rotate}deg)`;
            img.style.zIndex = 3;
          } else {
            img.style.opacity = "0";
            img.style.zIndex = 1;
          }
        });

        // Environment wash cross-fades between the current and next
        // stage colour so the background evolves continuously.
        if (sticky) {
          sticky.style.setProperty("--story-wash", STAGE_WASH[idx]);
          sticky.style.setProperty("--story-wash-next", STAGE_WASH[nextIdx]);
          sticky.style.setProperty("--story-wash-t", String(t));
        }

        // Real photography backdrop crossfades the same way as the
        // product art, one photo per stage (garden / picker / boil / pour).
        bgPhotos.forEach((photo, i) => {
          if (i === idx) photo.style.opacity = String(0.8 * (1 - t));
          else if (i === nextIdx) photo.style.opacity = String(0.8 * t);
          else photo.style.opacity = "0";
        });
      },
    });
  }

  document.addEventListener("DOMContentLoaded", initStory);
})();
