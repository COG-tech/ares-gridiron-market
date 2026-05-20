(function (window, document) {
  "use strict";

  const FALLBACK_NAV = {
    menus: [
      { id: "nfl", label: "NFL", summary: "Teams, rankings, scores, and roster moves.", sidebar: [{ label: "NFL Home", href: "index.html" }, { label: "Teams", href: "teams/index.html" }], groups: [{ title: "AFC", items: [{ label: "Teams", href: "teams/index.html" }, { label: "Scores", href: "scores/index.html" }] }, { title: "NFC", items: [{ label: "Rankings", href: "rankings/ares.html" }, { label: "NFL Moves", href: "nfl-moves/index.html" }] }] },
      { id: "college", label: "College", summary: "FBS, FCS, and conference boards.", sidebar: [{ label: "College Home", href: "college/index.html" }], groups: [{ title: "College", items: [{ label: "College ARES", href: "rankings/college-ares.html" }, { label: "College Market", href: "rankings/college-market.html" }] }] },
      { id: "high-school", label: "High School", summary: "Tracked watchlist by region and state.", sidebar: [{ label: "High School Home", href: "high-school/index.html" }], groups: [{ title: "Watchlist", items: [{ label: "High School Board", href: "high-school/index.html" }, { label: "Watchlist", href: "watchlist/index.html" }] }] },
      { id: "scores", label: "Scores", summary: "NFL, college, and high school scoreboards.", sidebar: [{ label: "Scores Home", href: "scores/index.html" }], groups: [{ title: "Scores", items: [{ label: "NFL Scores", href: "scores/index.html#nfl" }, { label: "College Scores", href: "scores/index.html#college" }, { label: "High School Scores", href: "scores/index.html#high-school" }] }] },
      { id: "moves", label: "Moves", summary: "Trades, signings, releases, and development movement.", sidebar: [{ label: "NFL Moves", href: "nfl-moves/index.html" }], groups: [{ title: "Moves", items: [{ label: "NFL Trades", href: "nfl-moves/index.html#trades" }, { label: "Movement Board", href: "movements/index.html" }] }] },
      { id: "players", label: "Players", summary: "Player search and profile routes.", sidebar: [{ label: "Players Home", href: "players/index.html" }], groups: [{ title: "Players", items: [{ label: "NFL Players", href: "players/index.html" }, { label: "Watchlist", href: "watchlist/index.html" }] }] },
      { id: "rankings", label: "Rankings", summary: "ARES and market boards.", sidebar: [{ label: "ARES Rankings", href: "rankings/ares.html" }], groups: [{ title: "Rankings", items: [{ label: "ARES Rankings", href: "rankings/ares.html" }, { label: "Market Rankings", href: "rankings/market.html" }] }] },
      { id: "methodology", label: "Methodology", summary: "Model and source policy.", sidebar: [{ label: "Methodology", href: "methodology.html" }], groups: [{ title: "Docs", items: [{ label: "Methodology", href: "methodology.html" }, { label: "About", href: "about.html" }] }] }
    ]
  };

  function safeText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeRoot(root) {
    if (!root || root === ".") return "";
    return root.replace(/\/+$/, "") + "/";
  }

  function href(root, path) {
    if (!path) return "#";
    if (/^https?:\/\//i.test(path)) return path;
    return normalizeRoot(root) + String(path).replace(/^\/+/, "");
  }

  function activeMenuId() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("/college/") || path.includes("college-")) return "college";
    if (path.includes("/high-school/")) return "high-school";
    if (path.includes("/scores/")) return "scores";
    if (path.includes("/nfl-moves/") || path.includes("/movements/")) return "moves";
    if (path.includes("/players/") || path.includes("/watchlist/")) return "players";
    if (path.includes("/rankings/")) return "rankings";
    if (path.includes("methodology") || path.includes("about")) return "methodology";
    return "nfl";
  }

  function iconText(label, abbr) {
    return abbr || String(label || "AR").split(/\s+/).map(function (word) { return word[0]; }).join("").slice(0, 3);
  }

  function imageTag(root, src, label) {
    if (!src) return "";
    return '<img src="' + safeText(href(root, src)) + '" alt="' + safeText(label || "") + '" loading="lazy">';
  }

  function icon(root, item) {
    const label = item.label || "";
    const text = iconText(label, item.abbr).toUpperCase();
    const image = item.image || (item.abbr ? "assets/media/nav/nfl-badges/" + encodeURIComponent(text) + ".svg" : "");
    return '<span class="ares-mega-icon" aria-hidden="true">' + (image ? imageTag(root, image, label) : safeText(text)) + "</span>";
  }

  function renderItems(root, items) {
    return (items || []).map(function (item) {
      return '<a class="ares-mega-link" href="' + safeText(href(root, item.href)) + '">' +
        icon(root, item) +
        '<span>' + safeText(item.label) + "</span></a>";
    }).join("");
  }

  function menuImage(root, menu) {
    const src = menu.image || "assets/media/nav/menu/" + encodeURIComponent(menu.id || "ares") + ".svg";
    return '<span class="ares-mega-menu-image">' + imageTag(root, src, menu.label) + "</span>";
  }

  function renderMenu(root, menu, activeId) {
    const groups = (menu.groups || []).map(function (group) {
      return '<section class="ares-mega-group"><h3>' + safeText(group.title) + '</h3><div class="ares-mega-links">' + renderItems(root, group.items) + "</div></section>";
    }).join("");
    const sidebar = renderItems(root, menu.sidebar || []);
    const active = menu.id === activeId ? " is-active" : "";
    const footer = menu.footer ? '<a class="ares-mega-footer" href="' + safeText(href(root, menu.footer.href)) + '">' + safeText(menu.footer.label) + "</a>" : "";
    return '<div class="ares-menu' + active + '" data-ares-menu="' + safeText(menu.id) + '">' +
      '<button class="ares-menu-button" type="button" aria-expanded="false">' + safeText(menu.label) + '<span aria-hidden="true">v</span></button>' +
      '<div class="ares-mega-panel" role="menu">' +
      '<aside class="ares-mega-sidebar">' + menuImage(root, menu) + '<strong>' + safeText(menu.label) + '</strong><p>' + safeText(menu.summary || "") + '</p><div>' + sidebar + '</div></aside>' +
      '<div class="ares-mega-groups">' + groups + '</div>' + footer +
      '</div></div>';
  }

  function closeMenus(header) {
    header.querySelectorAll(".ares-menu.is-open").forEach(function (menu) {
      menu.classList.remove("is-open");
      const button = menu.querySelector(".ares-menu-button");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function wire(header) {
    const toggle = header.querySelector(".ares-nav-toggle");
    const nav = header.querySelector(".ares-mega-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        const open = header.classList.toggle("is-mobile-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    header.querySelectorAll(".ares-menu").forEach(function (menu) {
      const button = menu.querySelector(".ares-menu-button");
      const open = function () {
        closeMenus(header);
        menu.classList.add("is-open");
        if (button) button.setAttribute("aria-expanded", "true");
      };
      if (button) button.addEventListener("click", function (event) {
        event.stopPropagation();
        const alreadyOpen = menu.classList.contains("is-open");
        closeMenus(header);
        if (!alreadyOpen) open();
      });
      menu.addEventListener("mouseenter", open);
      menu.addEventListener("mouseleave", function () {
        if (!window.matchMedia("(max-width: 900px)").matches) closeMenus(header);
      });
    });

    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) closeMenus(header);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenus(header);
        header.classList.remove("is-mobile-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function mount(header, data) {
    const root = header.getAttribute("data-ares-root") || ".";
    const nav = header.querySelector(".ares-mega-nav");
    if (!nav) return;
    const activeId = activeMenuId();
    nav.innerHTML = '<a class="ares-home-link' + (activeId === "nfl" ? " is-active" : "") + '" href="' + safeText(href(root, "index.html")) + '">Home</a>' +
      (data.menus || FALLBACK_NAV.menus).map(function (menu) { return renderMenu(root, menu, activeId); }).join("");
    wire(header);
  }

  function init() {
    const header = document.querySelector(".ares-mega-topbar");
    if (!header) return;
    const root = header.getAttribute("data-ares-root") || ".";
    fetch(href(root, "data/navigation.json"), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("navigation unavailable");
        return response.json();
      })
      .then(function (data) { mount(header, data); })
      .catch(function () { mount(header, FALLBACK_NAV); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}(window, document));
