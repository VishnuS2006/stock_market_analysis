const TOKEN_KEY = "token";

const API = {
  all: "/api/stocks/all",
  bySymbol: (symbol) => `/api/stocks/${encodeURIComponent(symbol)}`,
  history: (symbol) => `/api/stocks/history/${encodeURIComponent(symbol)}`,
};

const state = {
  token: "",
  stocks: [],
  selectedSymbol: "",
};

const dom = {};
let priceChart = null;
let rsiChart = null;
let volumeChart = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  state.token = localStorage.getItem(TOKEN_KEY) || "";
  if (!state.token) {
    window.location.href = "/login";
    return;
  }

  cacheDom();
  bindEvents();
  loadStocks();
}

function cacheDom() {
  dom.logoutBtn = byId("logoutBtn");
  dom.stockSelect = byId("stockSelect");
  dom.refreshBtn = byId("refreshBtn");
  dom.analysisStatus = byId("analysisStatus");

  dom.stockTitle = byId("stockTitle");
  dom.activeStatusChip = byId("activeStatusChip");
  dom.metricPrice = byId("metricPrice");
  dom.metricMarketCap = byId("metricMarketCap");
  dom.metricPeRatio = byId("metricPeRatio");
  dom.metricRsi = byId("metricRsi");
  dom.analysisInsights = byId("analysisInsights");

  dom.priceChartCanvas = byId("priceChart");
  dom.rsiChartCanvas = byId("rsiChart");
  dom.volumeChartCanvas = byId("volumeChart");
  dom.toastContainer = byId("toastContainer");
}

function bindEvents() {
  if (dom.logoutBtn) {
    dom.logoutBtn.addEventListener("click", logout);
  }

  if (dom.stockSelect) {
    dom.stockSelect.addEventListener("change", async () => {
      const symbol = String(dom.stockSelect.value || "").trim().toUpperCase();
      if (!symbol) {
        return;
      }
      state.selectedSymbol = symbol;
      await loadAnalysis(symbol);
    });
  }

  if (dom.refreshBtn) {
    dom.refreshBtn.addEventListener("click", async () => {
      const symbol = state.selectedSymbol || String(dom.stockSelect.value || "").trim().toUpperCase();
      if (!symbol) {
        showToast("Select a stock first", "error");
        return;
      }
      await loadAnalysis(symbol);
    });
  }
}

async function loadStocks() {
  setStatus("Loading stocks...");
  try {
    const response = await request(API.all);
    state.stocks = Array.isArray(response.stocks) ? response.stocks : [];

    if (!state.stocks.length) {
      setStatus("No active stocks are available for analysis.");
      if (dom.stockSelect) {
        dom.stockSelect.innerHTML = `<option value="">No stocks available</option>`;
      }
      renderEmptyState();
      return;
    }

    renderStockOptions(state.stocks);
    state.selectedSymbol = String(state.stocks[0]._id || "").toUpperCase();
    if (dom.stockSelect) {
      dom.stockSelect.value = state.selectedSymbol;
    }

    setStatus(`Loaded ${state.stocks.length} active stock(s).`);
    await loadAnalysis(state.selectedSymbol);
  } catch (error) {
    console.error("loadStocks error:", error);
    setStatus("Failed to load stocks.");
    showToast(error.message || "Failed to load stocks", "error");
    renderEmptyState();
  }
}

function renderStockOptions(stocks) {
  if (!dom.stockSelect) {
    return;
  }

  dom.stockSelect.innerHTML = stocks
    .map((stock) => {
      const symbol = escapeHtml(stock._id || "-");
      const company = escapeHtml(stock.companyName || "Company");
      return `<option value="${symbol}">${symbol} - ${company}</option>`;
    })
    .join("");
}

async function loadAnalysis(symbol) {
  setStatus(`Loading analysis for ${symbol}...`);
  try {
    const [stockRes, historyRes] = await Promise.all([
      request(API.bySymbol(symbol)),
      request(API.history(symbol)),
    ]);

    const stock = stockRes.stock || null;
    const history = Array.isArray(historyRes.history) ? historyRes.history : [];
    const technical = historyRes.technicalIndicators || (stock && stock.technicalIndicators) || {};

    if (!stock) {
      setStatus("Stock details were not found.");
      renderEmptyState();
      return;
    }

    renderMetrics(stock, technical);
    renderInsights(stock, history, technical);
    renderCharts(stock, history, technical);
    setStatus(`Updated analysis for ${symbol}.`);
  } catch (error) {
    console.error("loadAnalysis error:", error);
    setStatus("Failed to load stock analysis.");
    showToast(error.message || "Failed to load analysis", "error");
  }
}

function renderMetrics(stock, technical) {
  setText(dom.stockTitle, `${stock.companyName || "Company"} (${stock._id || "-"})`);
  setText(dom.activeStatusChip, stock.isActive ? "Active Listing" : "Inactive Listing");

  const fundamentals = stock.fundamentals || {};
  setText(dom.metricPrice, formatCurrency(stock.currentPrice, 2));
  setText(dom.metricMarketCap, formatCurrency(fundamentals.marketCap, 0));
  setText(dom.metricPeRatio, formatNumber(fundamentals.peRatio));
  setText(dom.metricRsi, formatNumber(technical.rsi));
}

function renderInsights(stock, history, technical) {
  if (!dom.analysisInsights) {
    return;
  }

  const insights = [];
  const fundamentals = stock.fundamentals || {};
  const priceRange = stock.priceRange || {};
  const rsi = Number(technical.rsi || 0);
  const ma50 = Number(technical.movingAverage50 || 0);
  const ma200 = Number(technical.movingAverage200 || 0);
  const price = Number(stock.currentPrice || 0);

  if (price > ma50 && ma50 > ma200) {
    insights.push("Trend is bullish: price is above MA50 and MA200.");
  } else if (price < ma50 && ma50 < ma200) {
    insights.push("Trend is bearish: price is below MA50 and MA200.");
  } else {
    insights.push("Trend is mixed: moving averages are not aligned.");
  }

  if (rsi >= 70) {
    insights.push("RSI indicates overbought conditions. Pullback risk is elevated.");
  } else if (rsi <= 30) {
    insights.push("RSI indicates oversold conditions. Rebound potential is higher.");
  } else {
    insights.push("RSI is in neutral range.");
  }

  if (Number(fundamentals.peRatio || 0) > 30) {
    insights.push("Valuation is relatively high based on P/E ratio.");
  } else if (Number(fundamentals.peRatio || 0) > 0) {
    insights.push("Valuation is moderate based on P/E ratio.");
  } else {
    insights.push("P/E data is missing or not meaningful.");
  }

  if (Number(priceRange.dayHigh || 0) > 0 && Number(priceRange.dayLow || 0) > 0) {
    const intradaySpread = ((priceRange.dayHigh - priceRange.dayLow) / priceRange.dayLow) * 100;
    insights.push(`Intraday volatility spread is ${intradaySpread.toFixed(2)}%.`);
  }

  if (Array.isArray(history) && history.length >= 2) {
    const last = Number(history[history.length - 1].price || 0);
    const prev = Number(history[history.length - 2].price || 0);
    if (prev > 0) {
      const changePct = ((last - prev) / prev) * 100;
      insights.push(`Latest historical change: ${changePct.toFixed(2)}%.`);
    }
  }

  if (!insights.length) {
    insights.push("Insufficient data for insights.");
  }

  dom.analysisInsights.innerHTML = insights
    .map((line) => `<p class="rounded-lg border border-slate-600/30 bg-slate-900/40 p-3">${escapeHtml(line)}</p>`)
    .join("");
}

function renderCharts(stock, history, technical) {
  const safeHistory = Array.isArray(history) && history.length
    ? history
    : [{ date: new Date().toISOString(), price: stock.currentPrice, volume: stock.currentVolume }];

  const labels = safeHistory.map((entry) => formatDate(entry.date));
  const prices = safeHistory.map((entry) => Number(entry.price || 0));
  const volumes = safeHistory.map((entry) => Number(entry.volume || 0));
  const rsiValues = new Array(labels.length).fill(Number(technical.rsi || 0));
  const ma50 = new Array(labels.length).fill(Number(technical.movingAverage50 || 0));
  const ma200 = new Array(labels.length).fill(Number(technical.movingAverage200 || 0));

  if (priceChart) {
    priceChart.destroy();
    priceChart = null;
  }
  if (rsiChart) {
    rsiChart.destroy();
    rsiChart = null;
  }
  if (volumeChart) {
    volumeChart.destroy();
    volumeChart = null;
  }

  if (dom.priceChartCanvas) {
    priceChart = new Chart(dom.priceChartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Price",
            data: prices,
            borderColor: "#0ea5e9",
            backgroundColor: "rgba(14,165,233,0.2)",
            fill: true,
            tension: 0.25,
          },
          {
            label: "MA 50",
            data: ma50,
            borderColor: "#a78bfa",
            borderDash: [6, 4],
            tension: 0,
            pointRadius: 0,
          },
          {
            label: "MA 200",
            data: ma200,
            borderColor: "#f59e0b",
            borderDash: [8, 5],
            tension: 0,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.08)" } },
          y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.12)" } },
        },
      },
    });
  }

  if (dom.rsiChartCanvas) {
    rsiChart = new Chart(dom.rsiChartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "RSI",
            data: rsiValues,
            borderColor: "#22d3ee",
            backgroundColor: "rgba(34,211,238,0.2)",
            fill: true,
            tension: 0.25,
            pointRadius: 1.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.08)" } },
          y: {
            min: 0,
            max: 100,
            ticks: { color: "#cbd5e1" },
            grid: { color: "rgba(148,163,184,0.12)" },
          },
        },
      },
    });
  }

  if (dom.volumeChartCanvas) {
    volumeChart = new Chart(dom.volumeChartCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Volume",
            data: volumes,
            backgroundColor: "rgba(59,130,246,0.6)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.08)" } },
          y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.12)" } },
        },
      },
    });
  }
}

function renderEmptyState() {
  setText(dom.stockTitle, "-");
  setText(dom.activeStatusChip, "-");
  setText(dom.metricPrice, "$0");
  setText(dom.metricMarketCap, "$0");
  setText(dom.metricPeRatio, "0");
  setText(dom.metricRsi, "0");

  if (dom.analysisInsights) {
    dom.analysisInsights.innerHTML =
      '<p class="rounded-lg border border-slate-600/30 bg-slate-900/40 p-3">No analysis data available.</p>';
  }
}

async function request(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function showToast(message, type = "info") {
  if (!dom.toastContainer) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

function setStatus(text) {
  if (dom.analysisStatus) {
    dom.analysisStatus.textContent = text;
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/login";
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function byId(id) {
  return document.getElementById(id);
}

function formatCurrency(value, decimals = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toLocaleString("en-US");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
