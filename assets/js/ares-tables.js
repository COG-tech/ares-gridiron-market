(function (window) {
  "use strict";

  const data = window.AresData;
  const tableStates = {};
  const NFL_LOGO_SLUGS = {
    ARI: "ari", ATL: "atl", BAL: "bal", BUF: "buf", CAR: "car", CHI: "chi", CIN: "cin", CLE: "cle",
    DAL: "dal", DEN: "den", DET: "det", GB: "gb", HOU: "hou", IND: "ind", JAX: "jax", JAC: "jax",
    KC: "kc", LAC: "lac", LAR: "lar", LA: "lar", LV: "lv", MIA: "mia", MIN: "min", NE: "ne",
    NO: "no", NYG: "nyg", NYJ: "nyj", PHI: "phi", PIT: "pit", SEA: "sea", SF: "sf", TB: "tb",
    TEN: "ten", WAS: "wsh", WSH: "wsh"
  };
  const NFL_TEAM_ALIASES = {
    "arizona cardinals": "ARI", "atlanta falcons": "ATL", "baltimore ravens": "BAL", "buffalo bills": "BUF",
    "carolina panthers": "CAR", "chicago bears": "CHI", "cincinnati bengals": "CIN", "cleveland browns": "CLE",
    "dallas cowboys": "DAL", "denver broncos": "DEN", "detroit lions": "DET", "green bay packers": "GB",
    "houston texans": "HOU", "indianapolis colts": "IND", "jacksonville jaguars": "JAX", "kansas city chiefs": "KC",
    "los angeles chargers": "LAC", "la chargers": "LAC", "los angeles rams": "LAR", "la rams": "LAR",
    "las vegas raiders": "LV", "miami dolphins": "MIA", "minnesota vikings": "MIN", "new england patriots": "NE",
    "new orleans saints": "NO", "new york giants": "NYG", "new york jets": "NYJ", "philadelphia eagles": "PHI",
    "pittsburgh steelers": "PIT", "seattle seahawks": "SEA", "san francisco 49ers": "SF", "tampa bay buccaneers": "TB",
    "tennessee titans": "TEN", "washington commanders": "WAS"
  };

  function getStateByTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
      return null;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody || !tbody.id) {
      return null;
    }
    return tableStates[tbody.id] || null;
  }

  function renderScoreChip(value, type) {
    const className = type === "market" ? "ares-market-chip" : "ares-score-chip";
    return '<span class="' + className + '">' + data.formatScore(value) + "</span>";
  }

  function renderTierChip(value) {
    return '<span class="ares-tier-chip">' + data.safeText(value) + "</span>";
  }

  function renderTrendChip(value) {
    const trend = data.formatTrend(value);
    const key = trend.toLowerCase();
    const className = key === "up" ? "ares-trend-up" : key === "down" ? "ares-trend-down" : "ares-trend-flat";
    return '<span class="' + className + '">' + trend + "</span>";
  }

  function renderConfidenceChip(value) {
    const confidence = data.formatConfidence(value);
    const acronym = typeof data.formatConfidenceAcronym === "function" ? data.formatConfidenceAcronym(value) : confidence.charAt(0).toUpperCase();
    const key = confidence.toLowerCase();
    const className = key === "high" ? "ares-confidence-high" : key === "medium" ? "ares-confidence-medium" : "ares-confidence-low";
    return '<span class="' + className + '" title="' + data.safeText(confidence) + '" aria-label="' + data.safeText(confidence) + ' confidence">' + acronym + "</span>";
  }

  function normalizeTeamKey(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    const compact = raw.replace(/\s+/g, " ");
    const upper = compact.toUpperCase();
    if (NFL_LOGO_SLUGS[upper]) {
      return upper;
    }
    return NFL_TEAM_ALIASES[compact.toLowerCase()] || "";
  }

  function nflLogoUrl(value) {
    const key = normalizeTeamKey(value);
    const slug = NFL_LOGO_SLUGS[key];
    return slug ? "https://a.espncdn.com/i/teamlogos/nfl/500/" + slug + ".png" : "";
  }

  function renderTeamLogo(value) {
    const url = nflLogoUrl(value);
    if (!url) {
      return data.safeText(value);
    }
    return '<span class="ares-team-logo-cell"><img class="ares-team-logo" src="' + data.safeText(url) + '" alt="' + data.safeText(value) + ' logo" loading="lazy"><span>' + data.safeText(value) + "</span></span>";
  }

  function isTeamColumn(key) {
    return ["team", "team_id", "team_name", "home_team", "away_team"].includes(String(key || ""));
  }

  function playerUrl(row, basePath) {
    const playerId = row && row.player_id ? String(row.player_id) : "";
    if (!playerId) {
      return "";
    }
    return (basePath || "players/") + "player-template.html?player_id=" + encodeURIComponent(playerId);
  }

  function renderPlayerLink(value, row, column) {
    const url = playerUrl(row, column && column.basePath);
    if (!url) {
      return data.safeText(value);
    }
    return '<a class="fw-bold" href="' + url + '">' + data.safeText(value) + "</a>";
  }

  function renderCell(row, column) {
    const value = row[column.key];
    if (typeof column.render === "function") {
      return column.render(value, row, column);
    }
    if (column.render === "score") {
      return renderScoreChip(value, column.scoreType || "ares");
    }
    if (column.render === "market") {
      return renderScoreChip(value, "market");
    }
    if (column.render === "tier") {
      return renderTierChip(value);
    }
    if (column.render === "trend") {
      return renderTrendChip(value);
    }
    if (column.render === "confidence") {
      return renderConfidenceChip(value);
    }
    if (column.render === "player") {
      return renderPlayerLink(value, row, column);
    }
    if (column.render === "team" || isTeamColumn(column.key)) {
      return renderTeamLogo(value);
    }
    return data.safeText(value);
  }

  function rowMatches(row, columns, query) {
    if (!query) {
      return true;
    }
    return columns
      .map(function (column) {
        return row[column.key];
      })
      .join(" ")
      .toLowerCase()
      .includes(query);
  }

  function sortedRows(rows, state) {
    if (!state.sort || !state.sort.key) {
      return rows.slice();
    }
    const factor = state.sort.direction === "desc" ? -1 : 1;
    const key = state.sort.key;
    const type = state.sort.type || "text";
    return rows.slice().sort(function (leftRow, rightRow) {
      const left = type === "number" ? Number(leftRow[key] || 0) : String(leftRow[key] || "").toLowerCase();
      const right = type === "number" ? Number(rightRow[key] || 0) : String(rightRow[key] || "").toLowerCase();
      if (left < right) {
        return -1 * factor;
      }
      if (left > right) {
        return 1 * factor;
      }
      return 0;
    });
  }

  function updateCount(tbody, count) {
    const table = tbody.closest("table");
    const countId = table ? table.dataset.countId : "";
    const countElement = countId ? document.getElementById(countId) : null;
    if (countElement) {
      countElement.textContent = count + " rows";
    }
  }

  function renderTable(containerId, rows, columns) {
    const tbody = document.getElementById(containerId);
    if (!tbody) {
      return;
    }
    const existingState = tableStates[containerId] || {};
    const state = Object.assign(existingState, {
      rows: Array.isArray(rows) ? rows : [],
      columns: columns || existingState.columns || []
    });
    tableStates[containerId] = state;

    const query = state.query || "";
    const visibleRows = sortedRows(
      state.rows.filter(function (row) {
        return rowMatches(row, state.columns, query);
      }),
      state
    );

    if (!visibleRows.length) {
      tbody.innerHTML = '<tr><td colspan="' + Math.max(state.columns.length, 1) + '" class="text-muted">No rows available yet.</td></tr>';
    } else {
      tbody.innerHTML = visibleRows
        .map(function (row) {
          return "<tr>" + state.columns.map(function (column) {
            return "<td>" + renderCell(row, column) + "</td>";
          }).join("") + "</tr>";
        })
        .join("");
    }
    updateCount(tbody, visibleRows.length);
    enhanceTeamLogoCells(tbody.closest("table") || document);
  }

  function rerenderTable(tableId) {
    const state = getStateByTable(tableId);
    if (!state) {
      return;
    }
    const table = document.getElementById(tableId);
    const tbody = table.querySelector("tbody");
    renderTable(tbody.id, state.rows, state.columns);
  }

  function makeTableSortable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
      return;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody || !tbody.id) {
      return;
    }
    table.querySelectorAll("[data-sort]").forEach(function (button) {
      button.addEventListener("click", function () {
        const state = tableStates[tbody.id] || {};
        const key = button.dataset.sort;
        const direction = state.sort && state.sort.key === key && state.sort.direction === "asc" ? "desc" : "asc";
        state.sort = {
          key: key,
          direction: direction,
          type: button.dataset.type || "text"
        };
        tableStates[tbody.id] = state;
        rerenderTable(tableId);
      });
    });
  }

  function makeTableSearchable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) {
      return;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody || !tbody.id) {
      return;
    }
    input.addEventListener("input", function () {
      const state = tableStates[tbody.id] || {};
      state.query = input.value.trim().toLowerCase();
      tableStates[tbody.id] = state;
      rerenderTable(tableId);
    });
  }

  function shouldEnhanceHeader(text) {
    const key = String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
    return key === "team" || key === "home" || key === "away" || key === "home team" || key === "away team";
  }

  function enhanceTeamLogoCells(scope) {
    const root = scope || document;
    root.querySelectorAll("table.ares-table").forEach(function (table) {
      const logoColumns = [];
      table.querySelectorAll("thead th").forEach(function (th, index) {
        if (shouldEnhanceHeader(th.textContent)) {
          logoColumns.push(index);
        }
      });
      if (!logoColumns.length) {
        return;
      }
      table.querySelectorAll("tbody tr").forEach(function (row) {
        logoColumns.forEach(function (index) {
          const cell = row.children[index];
          if (!cell || cell.querySelector(".ares-team-logo-cell")) {
            return;
          }
          const label = cell.textContent.trim().replace(/\s+/g, " ");
          const url = nflLogoUrl(label);
          if (!url) {
            return;
          }
          const current = cell.innerHTML;
          cell.innerHTML = '<span class="ares-team-logo-cell"><img class="ares-team-logo" src="' + data.safeText(url) + '" alt="' + data.safeText(label) + ' logo" loading="lazy"><span>' + current + "</span></span>";
        });
      });
    });
  }

  function scheduleEnhance() {
    window.setTimeout(function () { enhanceTeamLogoCells(document); }, 100);
    window.setTimeout(function () { enhanceTeamLogoCells(document); }, 650);
    window.setTimeout(function () { enhanceTeamLogoCells(document); }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEnhance);
  } else {
    scheduleEnhance();
  }

  window.AresTables = {
    renderTable: renderTable,
    makeTableSortable: makeTableSortable,
    makeTableSearchable: makeTableSearchable,
    renderScoreChip: renderScoreChip,
    renderTierChip: renderTierChip,
    renderTrendChip: renderTrendChip,
    renderConfidenceChip: renderConfidenceChip,
    renderTeamLogo: renderTeamLogo,
    enhanceTeamLogoCells: enhanceTeamLogoCells,
    nflLogoUrl: nflLogoUrl,
    renderPlayerLink: renderPlayerLink,
    playerUrl: playerUrl
  };
}(window));
