(function () {
  "use strict";

  document.querySelectorAll("[data-ares-premium-lock]").forEach(function (panel) {
    const href = panel.getAttribute("data-premium-href");
    const overlay = panel.querySelector(".ares-premium-overlay");
    if (href && overlay) {
      overlay.setAttribute("href", href);
    }
  });
}());
