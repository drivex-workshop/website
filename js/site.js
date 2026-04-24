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

  /**
   * Hero animated canvas — sparse dot grid that drifts subtly and reacts to
   * the cursor with a soft cyan light cone. Designed to feel like a
   * scientific instrument readout, not a marketing background.
   */
  function initHeroCanvas() {
    var canvas = document.querySelector("[data-hero-canvas]");
    if (!canvas) return;
    if (reduceMotion) return;

    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    var hero = canvas.parentElement;
    if (!hero) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var dots = [];
    var spacing = 40;
    var mouse = { x: -9999, y: -9999, active: false };
    var rafId = null;
    var visible = true;

    function resize() {
      var rect = hero.getBoundingClientRect();
      width = Math.max(rect.width, 320);
      height = Math.max(rect.height, 320);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDots();
    }

    function buildDots() {
      dots = [];
      var cols = Math.ceil(width / spacing) + 2;
      var rows = Math.ceil(height / spacing) + 2;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          dots.push({
            x: c * spacing - spacing,
            y: r * spacing - spacing,
            phase: Math.random() * Math.PI * 2,
            speed: 0.6 + Math.random() * 0.7
          });
        }
      }
    }

    function render(t) {
      ctx.clearRect(0, 0, width, height);
      var time = t * 0.0006;

      var glowR = 180;
      var hasGlow = mouse.active;

      if (hasGlow) {
        var glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowR);
        glow.addColorStop(0, "rgba(6, 182, 212, 0.18)");
        glow.addColorStop(0.55, "rgba(6, 182, 212, 0.05)");
        glow.addColorStop(1, "rgba(6, 182, 212, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var ox = Math.cos(time * d.speed + d.phase) * 1.6;
        var oy = Math.sin(time * d.speed + d.phase) * 1.6;
        var x = d.x + ox;
        var y = d.y + oy;

        var alpha = 0.18;
        var radius = 1;
        var color = "15, 53, 87";

        if (hasGlow) {
          var dx = x - mouse.x;
          var dy = y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < glowR) {
            var k = 1 - dist / glowR;
            alpha = 0.18 + k * 0.55;
            radius = 1 + k * 1.6;
            if (k > 0.4) color = "6, 182, 212";
          }
        }

        ctx.fillStyle = "rgba(" + color + "," + alpha + ")";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visible) rafId = window.requestAnimationFrame(render);
    }

    function start() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(render);
    }

    function stop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    hero.addEventListener("mouseleave", function () {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
          if (visible) start();
          else stop();
        });
      }, { threshold: 0.01 });
      io.observe(hero);
    }

    resize();
    start();
  }

  /**
   * Stat counters — count up from 0 to target when scrolled into view.
   */
  function initStatCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (!els.length) return;

    function format(n, target) {
      var width = String(target).length;
      var s = String(Math.floor(n));
      while (s.length < width) s = "0" + s;
      return s;
    }

    function animate(el) {
      var raw = el.getAttribute("data-target") || "0";
      var target = parseInt(raw, 10);
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target)) return;

      if (reduceMotion) {
        el.textContent = format(target, raw) + suffix;
        return;
      }

      var dur = 1100;
      var t0 = null;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var current = target * eased;
        el.textContent = format(current, raw) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = format(target, raw) + suffix;
      }
      window.requestAnimationFrame(step);
    }

    if (!window.IntersectionObserver) {
      els.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animate(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { io.observe(el); });
  }

  document.querySelectorAll("[data-spotlight-carousel]").forEach(initSpotlightCarousel);
  initReveal();
  initHeroCanvas();
  initStatCounters();
})();
