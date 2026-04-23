/**
 * DriveX site enhancements — vanilla JS, no build step.
 * Highlights carousel (home), scroll reveals, respects prefers-reduced-motion.
 */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initSpotlightCarousel(root) {
    var viewport = root.querySelector("[data-spotlight-viewport]");
    var track = root.querySelector("[data-spotlight-track]");
    if (!viewport || !track) return;

    var slides = track.querySelectorAll(".spotlight-slide");
    var n = slides.length;
    if (n < 2) return;

    var prevBtn = root.querySelector("[data-spotlight-prev]");
    var nextBtn = root.querySelector("[data-spotlight-next]");
    var dots = root.querySelector("[data-spotlight-dots]");
    var i = 0;
    var timer = null;
    var touchStartX = null;

    function setIndex(next) {
      i = (next + n) % n;
      var pct = (-i * 100) / n;
      track.style.transform = "translate3d(" + pct + "%,0,0)";

      slides.forEach(function (slide, j) {
        slide.setAttribute("aria-hidden", j === i ? "false" : "true");
      });

      if (dots) {
        dots.querySelectorAll("button").forEach(function (btn, j) {
          btn.setAttribute("aria-selected", j === i ? "true" : "false");
        });
      }
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (reduceMotion) return;
      timer = window.setInterval(function () {
        setIndex(i + 1);
      }, 6500);
    }

    function go(delta, userEvent) {
      if (userEvent) userEvent.preventDefault();
      setIndex(i + delta);
      stopAuto();
      startAuto();
    }

    if (prevBtn) prevBtn.addEventListener("click", function (e) { go(-1, e); });
    if (nextBtn) nextBtn.addEventListener("click", function (e) { go(1, e); });

    if (dots) {
      dots.addEventListener("click", function (e) {
        var t = e.target;
        if (t && t.matches && t.matches("button[data-index]")) {
          e.preventDefault();
          var j = parseInt(t.getAttribute("data-index"), 10);
          if (!isNaN(j)) {
            setIndex(j);
            stopAuto();
            startAuto();
          }
        }
      });
    }

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", startAuto);

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    });

    viewport.addEventListener(
      "touchstart",
      function (e) {
        if (e.changedTouches && e.changedTouches[0]) {
          touchStartX = e.changedTouches[0].clientX;
        }
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchend",
      function (e) {
        if (touchStartX == null || !e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) go(1);
        else go(-1);
      },
      { passive: true }
    );

    setIndex(0);
    startAuto();
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal-on-scroll");
    if (!els.length) return;

    if (reduceMotion || !window.IntersectionObserver) {
      els.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    els.forEach(function (el) {
      io.observe(el);
    });
  }

  document.querySelectorAll("[data-spotlight-carousel]").forEach(initSpotlightCarousel);
  initReveal();
})();
