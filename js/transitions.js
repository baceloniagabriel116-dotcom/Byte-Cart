/* =====================================================
   Byte Cart — Transitions & Micro-interactions Engine
   Pure JS, no dependencies. Hardware-accelerated only.
   ===================================================== */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. Page transition overlay ---------- */
  var overlay = document.createElement("div");
  overlay.id = "page-transition-overlay";
  overlay.innerHTML = '<span class="pt-logo">Byte Cart</span>';
  document.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(overlay);
  });

  /* ---------- 2. Intercept internal link clicks ---------- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[href]");
    if (!link) return;

    var href = link.getAttribute("href");

    // Only transition internal .html pages (with or without ?query), same tab
    var isInternalPage = /\.html([?#].*)?$/.test(href);
    if (
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
      link.target === "_blank" ||
      href.startsWith("http") || href.startsWith("mailto:") ||
      href.startsWith("tel:") || href === "#" || href.startsWith("#") ||
      !isInternalPage
    ) return;

    e.preventDefault();

    if (reducedMotion.matches) {
      window.location.href = href;
      return;
    }

    // Direction-aware slide (forward = left, back = right)
    var isBack = false;
    try {
      var navEntry = performance.getEntriesByType("navigation")[0];
      if (navEntry && navEntry.type === "back_forward") isBack = true;
    } catch (err) { /* noop */ }
    var rtl = isBack;

    overlay.style.setProperty("--slide-dir", rtl ? "1" : "-1");
    overlay.classList.add("is-active");

    // Fade current page out slightly for extra smoothness
    document.body.style.transition = "opacity 220ms ease, transform 220ms ease";
    document.body.style.opacity = "0.85";
    document.body.style.transform = rtl ? "translateX(12px)" : "translateX(-12px)";

    setTimeout(function () {
      window.location.href = href;
    }, 260);
  });

  /* ---------- 3. Page entry animation on load ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (reducedMotion.matches) return;

    var main =
      document.querySelector("main") ||
      document.querySelector(".hero") ||
      document.querySelector(".container") ||
      document.body;

    main.classList.add("page-enter");

    // Slide direction if arriving via back/forward
    try {
      var navEntry = performance.getEntriesByType("navigation")[0];
      if (navEntry && navEntry.type === "back_forward") {
        main.classList.add("page-enter--slide");
      }
    } catch (err) { /* noop */ }

    // Stagger grid children (product/category grids)
    document.querySelectorAll(".grid").forEach(function (grid) {
      grid.classList.add("stagger-in");
    });

    // Clean up after animation so will-change doesn't linger
    main.addEventListener("animationend", function () {
      main.classList.remove("page-enter", "page-enter--slide");
      main.style.willChange = "auto";
    }, { once: true });
  });

  /* ---------- 4. Ripple effect on buttons & nav items ---------- */
  function createRipple(e) {
    if (reducedMotion.matches) return;
    var host = e.currentTarget;

    // Make sure the host can clip the ripple
    var pos = getComputedStyle(host).position;
    if (pos === "static") host.classList.add("ripple-host");

    var rect = host.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX || rect.width / 2) - rect.left - size / 2 + "px";
    ripple.style.top = (e.clientY || rect.height / 2) - rect.top - size / 2 + "px";

    host.appendChild(ripple);
    ripple.addEventListener("animationend", function () {
      ripple.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var rippleTargets = document.querySelectorAll(
      ".btn, .cta-button, .nav-center a, .cart-icon, button, .category-card"
    );
    rippleTargets.forEach(function (el) {
      el.addEventListener("pointerdown", createRipple);
    });
  });

  /* ---------- 5. Touch/click press feedback via .pressable ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var pressTargets = document.querySelectorAll(
      ".product-card, .category-card, .btn, .cta-button, a"
    );
    pressTargets.forEach(function (el) {
      el.classList.add("pressable");
    });
  });

  /* ---------- 6. Cart icon pop when count changes ---------- */
  var lastCount = null;
  function watchCart() {
    var countEl = document.getElementById("cartCount");
    var icon = document.querySelector(".cart-icon");
    if (!countEl || !icon) return;
    var text = countEl.textContent.trim();
    if (lastCount !== null && text !== lastCount) {
      icon.classList.remove("pop");
      // Force reflow to restart animation
      void icon.offsetWidth;
      icon.classList.add("pop");
    }
    lastCount = text;
  }
  setInterval(watchCart, 400);

  /* ---------- 7. Respect live changes to reduced motion ---------- */
  reducedMotion.addEventListener("change", function (e) {
    if (e.matches) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }
  });
})();
