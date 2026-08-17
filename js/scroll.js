/* ===========================================================
   VENTO — Smooth Scroll Engine
   Rather than hijacking the native scrollbar (which breaks
   position:sticky and accessibility), we let the browser own
   real scrolling and instead track a *lerped* scroll value on
   top of it. Every module reads Vento.scroll.y (eased) and
   Vento.scroll.velocity from a single rAF loop, giving the
   whole site a consistent, weighted "smooth scroll" feel
   without the jank of a fully virtualized scroll container.
=========================================================== */
(function () {
  const Vento = (window.Vento = window.Vento || {});
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    raw: window.scrollY || 0,
    y: window.scrollY || 0,
    velocity: 0,
    direction: 1,
    max: 0,
    progress: 0,
  };
  function updateMax() {
    state.max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }
  function onScroll() {
    state.raw = window.scrollY || window.pageYOffset || 0;
  }
  const LERP = prefersReduced ? 1 : 0.11;
  function tick() {
    const prevY = state.y;
    state.y += (state.raw - state.y) * LERP;
    if (Math.abs(state.raw - state.y) < 0.05) state.y = state.raw;
    state.velocity = state.y - prevY;
    state.direction = state.velocity >= 0 ? 1 : -1;
    state.progress = state.y / state.max;
    Vento.scroll = state;
    Vento._listeners.forEach((fn) => fn(state));
    requestAnimationFrame(tick);
  }
  Vento._listeners = [];
  Vento.onScrollFrame = function (fn) {
    Vento._listeners.push(fn);
    return () => {
      Vento._listeners = Vento._listeners.filter((f) => f !== fn);
    };
  };
  Vento.scroll = state;
  Vento.prefersReduced = prefersReduced;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateMax);
  updateMax();
  onScroll();
  requestAnimationFrame(tick);
  // Recalculate max scroll after images / late layout shifts settle
  window.addEventListener("load", updateMax);
  setTimeout(updateMax, 800);
})();
