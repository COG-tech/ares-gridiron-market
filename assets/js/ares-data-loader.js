(function (window) {
  "use strict";

  if (window.document && !window.document.__aresReadyShim) {
    const originalAddEventListener = window.document.addEventListener.bind(window.document);
    window.document.addEventListener = function (type, listener, options) {
      if (type === "DOMContentLoaded" && typeof listener === "function") {
        let called = false;
        const runOnce = function (event) {
          if (called) {
            return;
          }
          called = true;
          listener.call(window.document, event || new window.Event("DOMContentLoaded"));
        };
        originalAddEventListener(type, runOnce, options);
        window.setTimeout(function () {
          runOnce(new window.Event("DOMContentLoaded"));
        }, 0);
        return;
      }
      originalAddEventListener(type, listener, options);
    };
    window.document.__aresReadyShim = true;
  }

  function safeText(value) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load " + path);
    }
    return response.json();
  }

  function formatScore(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return safeText(value);
    }
    return numberValue.toFixed(1);
  }

  function formatTrend(value) {
    const trend = safeText(value).trim();
    if (!trend) {
      return "Flat";
    }
    return trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();
  }

  function formatConfidence(value) {
    const confidence = safeText(value).trim();
    if (!confidence) {
      return "Low";
    }
    return confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase();
  }

  function formatConfidenceAcronym(value) {
    const confidence = formatConfidence(value);
    const key = confidence.toLowerCase();
    if (key === "high") {
      return "H";
    }
    if (key === "medium") {
      return "M";
    }
    if (key === "low") {
      return "L";
    }
    if (key === "insufficient") {
      return "I";
    }
    return confidence.charAt(0).toUpperCase();
  }

  function showLoadError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }
    container.innerHTML = '<div class="alert alert-warning mb-0">' + safeText(message) + "</div>";
  }

  window.AresData = {
    loadJson: loadJson,
    safeText: safeText,
    formatScore: formatScore,
    formatTrend: formatTrend,
    formatConfidence: formatConfidence,
    formatConfidenceAcronym: formatConfidenceAcronym,
    showLoadError: showLoadError
  };
}(window));
