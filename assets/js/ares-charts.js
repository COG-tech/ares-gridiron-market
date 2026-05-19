(function (window) {
  "use strict";

  const charts = {};
  const safe = window.AresData ? window.AresData.safeText : function (value) {
    return value === null || value === undefined ? "" : String(value);
  };

  function getContainer(containerId) {
    return document.getElementById(containerId);
  }

  function cleanNumber(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  function destroyChart(containerId) {
    if (charts[containerId] && typeof charts[containerId].destroy === "function") {
      charts[containerId].destroy();
    }
    charts[containerId] = null;
  }

  function emptyState(container, message) {
    destroyChart(container.id);
    container.innerHTML = '<div class="ares-chart-empty">' + safe(message || "No chart data available yet.") + "</div>";
  }

  function fallbackBars(container, labels, values) {
    const maxValue = Math.max.apply(null, values.concat([1]));
    container.innerHTML = '<div class="ares-chart-fallback">' + labels.map(function (label, index) {
      const value = Number(values[index] || 0);
      const width = Math.max(4, Math.round((value / maxValue) * 100));
      return '<div class="ares-bar-row"><span>' + safe(label) + '</span><div><i style="width:' + width + '%"></i></div><strong>' + safe(value) + "</strong></div>";
    }).join("") + "</div>";
  }

  function baseOptions(labels, values, options) {
    const opts = options || {};
    return {
      chart: {
        type: opts.type || "bar",
        height: opts.height || 240,
        toolbar: { show: false },
        fontFamily: 'Inter, "Segoe UI", sans-serif',
        animations: { enabled: true, speed: 450 }
      },
      colors: opts.colors || ["#1B2B45", "#F7C948", "#2F6B4F", "#5F6B7A", "#B42318"],
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#E3E8EF",
        strokeDashArray: 4
      },
      legend: {
        show: opts.legend !== false,
        position: "bottom",
        fontSize: "12px",
        labels: { colors: "#6B7280" }
      },
      labels: labels,
      series: [{ name: opts.seriesName || "Rows", data: values }],
      xaxis: {
        categories: labels,
        labels: {
          style: { colors: "#6B7280", fontSize: "11px", fontWeight: 700 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        min: 0,
        labels: {
          style: { colors: "#6B7280", fontSize: "11px", fontWeight: 700 }
        }
      },
      tooltip: {
        theme: "light",
        y: { formatter: function (value) { return String(value); } }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: "48%",
          distributed: Boolean(opts.distributed)
        }
      }
    };
  }

  function renderChart(containerId, labels, values, options) {
    const container = getContainer(containerId);
    if (!container) {
      return;
    }
    const cleanValues = values.map(function (value) { return Number(value || 0); });
    if (!labels.length || !cleanValues.some(function (value) { return value > 0; })) {
      emptyState(container, options && options.emptyMessage);
      return;
    }
    destroyChart(containerId);
    container.innerHTML = "";
    if (!window.ApexCharts) {
      fallbackBars(container, labels, cleanValues);
      return;
    }
    const apexOptions = baseOptions(labels, cleanValues, options);
    if (options && options.type === "donut") {
      apexOptions.chart.type = "donut";
      apexOptions.series = cleanValues;
      apexOptions.labels = labels;
      apexOptions.plotOptions = {
        pie: {
          donut: {
            size: "64%",
            labels: {
              show: true,
              total: {
                show: true,
                color: "#172033",
                fontSize: "18px",
                fontWeight: 850
              }
            }
          }
        }
      };
    }
    if (options && options.type === "line") {
      apexOptions.chart.type = "line";
      apexOptions.stroke = { curve: "smooth", width: 3 };
      apexOptions.markers = { size: 4, strokeWidth: 0 };
      apexOptions.colors = options.colors || ["#2F6B4F"];
    }
    charts[containerId] = new window.ApexCharts(container, apexOptions);
    charts[containerId].render();
  }

  function scoreBuckets(rows, key) {
    const buckets = [
      { label: "0-59", min: 0, max: 59.999, count: 0 },
      { label: "60-69", min: 60, max: 69.999, count: 0 },
      { label: "70-79", min: 70, max: 79.999, count: 0 },
      { label: "80-89", min: 80, max: 89.999, count: 0 },
      { label: "90-100", min: 90, max: 100.001, count: 0 }
    ];
    (rows || []).forEach(function (row) {
      const value = cleanNumber(row[key]);
      if (value === null) {
        return;
      }
      const bucket = buckets.find(function (item) {
        return value >= item.min && value < item.max;
      });
      if (bucket) {
        bucket.count += 1;
      }
    });
    return {
      labels: buckets.map(function (bucket) { return bucket.label; }),
      values: buckets.map(function (bucket) { return bucket.count; })
    };
  }

  function countBy(rows, key, limit) {
    const counts = {};
    (rows || []).forEach(function (row) {
      const value = safe(row[key] || "Unknown").trim() || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.keys(counts).map(function (label) {
      return { label: label, value: counts[label] };
    }).sort(function (left, right) {
      return right.value - left.value || left.label.localeCompare(right.label);
    }).slice(0, limit || 8);
  }

  function renderScoreDistribution(containerId, rows, key, label) {
    const buckets = scoreBuckets(rows, key);
    renderChart(containerId, buckets.labels, buckets.values, {
      type: "bar",
      seriesName: label || "Scores",
      distributed: true,
      emptyMessage: "No score distribution available yet."
    });
  }

  function renderCountBy(containerId, rows, key, options) {
    const counts = countBy(rows, key, options && options.limit);
    renderChart(
      containerId,
      counts.map(function (item) { return item.label; }),
      counts.map(function (item) { return item.value; }),
      {
        type: options && options.type || "donut",
        seriesName: options && options.seriesName || "Rows",
        emptyMessage: options && options.emptyMessage || "No grouping data available yet.",
        colors: options && options.colors
      }
    );
  }

  function renderLine(containerId, rows, xKey, yKey, options) {
    const sorted = (rows || []).slice().sort(function (left, right) {
      return String(left[xKey] || "").localeCompare(String(right[xKey] || ""));
    });
    const labels = sorted.map(function (row) { return safe(row[xKey] || ""); });
    const values = sorted.map(function (row) { return cleanNumber(row[yKey]) || 0; });
    renderChart(containerId, labels, values, {
      type: "line",
      seriesName: options && options.seriesName || "Trend",
      emptyMessage: options && options.emptyMessage || "No trend data available yet.",
      colors: options && options.colors
    });
  }

  function renderMovementTimeline(containerId, rows) {
    const container = getContainer(containerId);
    if (!container) {
      return;
    }
    const items = (rows || []).slice(0, 8);
    if (!items.length) {
      emptyState(container, "No movement timeline rows available yet.");
      return;
    }
    destroyChart(containerId);
    container.innerHTML = '<ol class="ares-timeline">' + items.map(function (row) {
      return '<li class="ares-timeline-item"><span>' + safe(row.date || row.last_movement || "") + '</span><strong>' + safe(row.player_name || "Player") + '</strong><em>' + safe(row.movement_type || row.status || "Tracked") + '</em></li>';
    }).join("") + "</ol>";
  }

  window.AresCharts = {
    renderChart: renderChart,
    renderScoreDistribution: renderScoreDistribution,
    renderCountBy: renderCountBy,
    renderLine: renderLine,
    renderMovementTimeline: renderMovementTimeline,
    countBy: countBy,
    scoreBuckets: scoreBuckets
  };
}(window));
