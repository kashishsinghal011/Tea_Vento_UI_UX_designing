/* ===========================================================
   VENTO — Core Interactions
   Built on top of the existing Vento.scroll lerp engine
   (js/scroll.js). Nothing here re-implements smooth scrolling;
   it only reads Vento.scroll.y / velocity each frame.

   This file owns: loader, nav (hide/reveal + active-section
   underline + mobile drawer), generic reveal-on-scroll, split-
   line stagger, and marquee velocity response. Hero, story and
   ritual each have their own dedicated module (hero.js,
   story.js, ritual.js, products.js) so the animation logic for
   each cinematic sequence stays easy to find and tune.
=========================================================== */
(function () {
  const Vento = window.Vento || (window.Vento = {});
  const reduced = Vento.prefersReduced;
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  /* ---------- Loader ---------- */
  function initLoader() {
    const done = () => document.documentElement.classList.add("is-ready");
    if (document.fonts && document.fonts.ready) {
      Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 1200)),
      ]).then(() => setTimeout(done, 250));
    } else {
      window.addEventListener("load", () => setTimeout(done, 250));
    }
    // hard fallback so a slow font never blocks the site
    setTimeout(done, 2500);
  }

  /* ---------- Nav: hide on scroll down, blur bg, active-section underline ---------- */
  function initNav() {
    const nav = $(".nav");
    if (!nav) return;
    let lastY = 0;
    Vento.onScrollFrame((s) => {
      nav.classList.toggle("is-scrolled", s.y > 40);
      if (s.y > 220 && s.direction === 1 && s.y - lastY > 0.4) {
        nav.classList.add("is-hidden");
      } else if (s.direction === -1 || s.y < 220) {
        nav.classList.remove("is-hidden");
      }
      lastY = s.y;
    });

    const burger = $(".nav-burger");
    const links = $(".nav-links");
    if (burger && links) {
      burger.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        burger.classList.toggle("is-active", open);
        document.body.style.overflow = open ? "hidden" : "";
      });
      $$(".nav-link", links).forEach((a) =>
        a.addEventListener("click", () => {
          links.classList.remove("is-open");
          burger.classList.remove("is-active");
          document.body.style.overflow = "";
        })
      );
    }

    /* Active-section underline: track which section is centred in
       the viewport and slide a single underline beneath its link,
       rather than re-drawing an underline per link. */
    const navLinks = $$(".nav-link[data-nav-section]", nav);
    const underline = $(".nav-underline", nav);
    if (!navLinks.length || !underline) return;
    const sections = navLinks
      .map((a) => ({ link: a, el: document.getElementById(a.dataset.navSection) }))
      .filter((x) => x.el);

    function positionUnderline(link) {
      const navInner = $(".nav-inner", nav);
      const linkRect = link.getBoundingClientRect();
      const baseRect = navInner.getBoundingClientRect();
      underline.style.width = linkRect.width * 0.72 + "px";
      underline.style.transform = `translateX(${linkRect.left - baseRect.left + linkRect.width * 0.14}px)`;
      underline.style.opacity = "1";
    }

    if ("IntersectionObserver" in window) {
      let active = null;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const match = sections.find((s) => s.el === entry.target);
              if (match && match.link !== active) {
                active = match.link;
                positionUnderline(active);
              }
            }
          });
        },
        { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
      );
      sections.forEach((s) => io.observe(s.el));
      window.addEventListener("resize", () => active && positionUnderline(active));
    }
  }

  /* ---------- Reveal-on-scroll (IntersectionObserver) ---------- */
  function initReveals() {
    const targets = $$("[data-reveal-line], .product-card, .finale-inner");
    if (!("IntersectionObserver" in window) || !targets.length) {
      targets.forEach((t) => t.classList.add("is-revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t, i) => {
      const group = t.closest("[data-reveal-group]");
      const stagger = group ? Array.from(group.children).indexOf(t) : i % 4;
      t.style.setProperty("--reveal-delay", (stagger % 4) * 0.09 + "s");
      t.style.setProperty("--card-delay", (stagger % 4) * 0.09 + "s");
      io.observe(t);
    });
  }

  /* ---------- Split-line stagger (sets --split-delay per span) ---------- */
  function initSplitStagger() {
    $$(".split-line").forEach((line, gi) => {
      $$("span", line).forEach((span, i) => {
        span.style.setProperty("--split-delay", (gi * 0.06 + i * 0.02) + "s");
      });
    });
  }

  /* ---------- Marquee: speed responds to scroll velocity ---------- */
  function initMarquee() {
    const track = $(".marquee-track");
    if (!track || reduced) return;
    const BASE = 32; // seconds, matches CSS default duration
    let currentDur = BASE;
    Vento.onScrollFrame((s) => {
      const speed = Math.min(Math.abs(s.velocity), 40);
      // faster scroll -> shorter duration (faster marquee), settles back to BASE
      const targetDur = BASE - speed * 0.55;
      currentDur += (targetDur - currentDur) * 0.08;
      track.style.animationDuration = Math.max(8, currentDur) + "s";
    });
  }

  /* ---------- Generic sticky-sequence progress helper, shared by
     story.js and ritual.js so both read scroll the same way. ---------- */
  Vento.stickySequence = function ({ section, stageCount, onProgress }) {
    if (!section) return;
    Vento.onScrollFrame(() => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      const progress = Math.min(1, Math.max(0, raw));
      const stage = Math.min(stageCount - 1, Math.floor(progress * stageCount));
      onProgress(progress, stage);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initNav();
    initSplitStagger();
    initReveals();
    initMarquee();
  });
})();
