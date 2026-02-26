const TOKEN_KEY = "token";

const API = {
  all: "/api/stocks/all",
  filter: "/api/stocks/filter",
  sort: "/api/stocks/sort",
  bySymbol: (symbol) => `/api/stocks/${encodeURIComponent(symbol)}`,
  history: (symbol) => `/api/stocks/history/${encodeURIComponent(symbol)}`,
};

const state = {
  token: "",
  allStocks: [],
  displayedStocks: [],
  detailStock: null,
  detailHistory: [],
};

const dom = {};
let priceVolumeChart = null;
let rsiChart = null;
let searchDebounce = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  state.token = localStorage.getItem(TOKEN_KEY) || "";
  if (!state.token) {
    redirectToLogin();
    return;
  }

  cacheDom();
  bindEvents();
  loadAllStocks();
}

function cacheDom() {
  dom.logoutBtn = byId("logoutBtn");
  dom.applyFilterBtn = byId("applyFilterBtn");
  dom.clearFilterBtn = byId("clearFilterBtn");

  dom.searchInput = byId("searchInput");
  dom.minPriceInput = byId("minPriceInput");
  dom.maxPriceInput = byId("maxPriceInput");
  dom.minMarketCapInput = byId("minMarketCapInput");
  dom.maxMarketCapInput = byId("maxMarketCapInput");
  dom.sortFieldSelect = byId("sortFieldSelect");
  dom.sortOrderSelect = byId("sortOrderSelect");

  dom.stockGrid = byId("stockGrid");
  dom.stockEmpty = byId("stockEmpty");
  dom.stockCountLabel = byId("stockCountLabel");

  dom.detailModal = byId("detailModal");
  dom.closeDetailBtn = byId("closeDetailBtn");
  dom.detailTitle = byId("detailTitle");
  dom.detailSubTitle = byId("detailSubTitle");
  dom.detailPrice = byId("detailPrice");
  dom.detailVolume = byId("detailVolume");
  dom.detailMarketCap = byId("detailMarketCap");
  dom.detailPeRatio = byId("detailPeRatio");
  dom.detailFundamentals = byId("detailFundamentals");
  dom.detailTechnicals = byId("detailTechnicals");
  dom.detailDividends = byId("detailDividends");
  dom.priceVolumeChartCanvas = byId("priceVolumeChart");
  dom.rsiChartCanvas = byId("rsiChart");

  dom.toastContainer = byId("toastContainer");
}

function bindEvents() {
  if (dom.logoutBtn) dom.logoutBtn.addEventListener("click", logout);
  if (dom.applyFilterBtn) dom.applyFilterBtn.addEventListener("click", applyFilters);
  if (dom.clearFilterBtn) dom.clearFilterBtn.addEventListener("click", clearFilters);
  if (dom.sortFieldSelect) dom.sortFieldSelect.addEventListener("change", applySorting);
  if (dom.sortOrderSelect) dom.sortOrderSelect.addEventListener("change", applySorting);

  if (dom.searchInput) {
    dom.searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        applyFilters();
      }, 260);
    });
  }

  [dom.minPriceInput, dom.maxPriceInput, dom.minMarketCapInput, dom.maxMarketCapInput]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener("change", applyFilters);
    });

  if (dom.stockGrid) {
    dom.stockGrid.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-symbol]");
      if (!button) return;
      const symbol = String(button.dataset.symbol || "").trim().toUpperCase();
      if (!symbol) return;
      await openDetail(symbol);
    });
  }

  if (dom.closeDetailBtn) dom.closeDetailBtn.addEventListener("click", closeDetailModal);
  if (dom.detailModal) {
    dom.detailModal.addEventListener("click", (event) => {
      if (event.target === dom.detailModal) {
        closeDetailModal();
      }
    });
  }
}

async function loadAllStocks() {
  try {
    const response = await request(API.all);
    state.allStocks = Array.isArray(response.stocks) ? response.stocks : [];
    state.displayedStocks = [...state.allStocks];
    applySorting();
  } catch (error) {
    console.error("loadAllStocks error:", error);
    showToast(error.message || "Failed to load stocks", "error");
  }
}

async function applyFilters() {
  try {
    const params = new URLSearchParams();
    const search = valueOf(dom.searchInput);
    const minPrice = valueOf(dom.minPriceInput);
    const maxPrice = valueOf(dom.maxPriceInput);
    const minMarketCap = valueOf(dom.minMarketCapInput);
    const maxMarketCap = valueOf(dom.maxMarketCapInput);

    if (search) params.set("search", search);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minMarketCap) params.set("minMarketCap", minMarketCap);
    if (maxMarketCap) params.set("maxMarketCap", maxMarketCap);

    const query = params.toString();
    if (!query) {
      state.displayedStocks = [...state.allStocks];
      applySorting();
      return;
    }

    const response = await request(`${API.filter}?${query}`);
    state.displayedStocks = Array.isArray(response.stocks) ? response.stocks : [];
    applySorting();
  } catch (error) {
    console.error("applyFilters error:", error);
    showToast(error.message || "Failed to apply filters", "error");
  }
}

async function applySorting() {
  try {
    const field = valueOf(dom.sortFieldSelect);
    const order = valueOf(dom.sortOrderSelect) || "asc";
    const hasFilter = hasActiveFilters();

    if (!field) {
      renderStockGrid(state.displayedStocks);
      return;
    }

    if (!hasFilter) {
      const response = await request(`${API.sort}?field=${encodeURIComponent(field)}&order=${encodeURIComponent(order)}`);
      state.displayedStocks = Array.isArray(response.stocks) ? response.stocks : [];
      renderStockGrid(state.displayedStocks);
      return;
    }

    const sorted = [...state.displayedStocks].sort((a, b) => {
      const aValue = sortableValue(a, field);
      const bValue = sortableValue(b, field);
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return String(a._id).localeCompare(String(b._id));
    });

    state.displayedStocks = sorted;
    renderStockGrid(state.displayedStocks);
  } catch (error) {
    console.error("applySorting error:", error);
    showToast(error.message || "Failed to sort stocks", "error");
  }
}

function renderStockGrid(stocks) {
  if (!dom.stockGrid || !dom.stockEmpty || !dom.stockCountLabel) return;

  dom.stockGrid.innerHTML = "";
  dom.stockCountLabel.textContent = `${stocks.length} ${stocks.length === 1 ? "result" : "results"}`;

  if (!stocks.length) {
    dom.stockEmpty.classList.remove("hidden");
    return;
  }
  dom.stockEmpty.classList.add("hidden");

  dom.stockGrid.innerHTML = stocks
    .map((stock, index) => {
      const symbolRaw = String(stock.stockSymbol || stock._id || "").trim().toUpperCase();
      const symbol = escapeHtml(symbolRaw || "-");
      const companyName = escapeHtml(stock.companyName || "Unknown Company");
      const currencyCode = normalizeCurrencyCode(stock.currency);
      const fundamentals = stock.fundamentals || {};
      const range = stock.priceRange || {};
      const rsiInfo = getRsiSignal(stock.technicalIndicators && stock.technicalIndicators.rsi);
      const positionPercent = calcRangePosition(stock.currentPrice, range.fiftyTwoWeekLow, range.fiftyTwoWeekHigh);
      const statusText = stock.isActive === false ? "Inactive" : "Active";
      const statusClass = stock.isActive === false ? "inactive" : "active";

      return `
        <article class="stock-card" style="--delay:${Math.min(index * 45, 360)}ms;">
          <div class="stock-head">
            <div>
              <h3 class="stock-symbol">${symbol}</h3>
              <p class="stock-company">${companyName}</p>
            </div>
            <div class="stock-pills">
              <span class="stock-pill currency">${escapeHtml(currencyCode)}</span>
              <span class="stock-pill ${statusClass}">${statusText}</span>
            </div>
          </div>
          <div class="stock-price-row">
            <p class="stock-price">${formatCurrency(stock.currentPrice, 2, currencyCode)}</p>
            <span class="stock-rsi ${rsiInfo.className}">${rsiInfo.label}</span>
          </div>
          <div class="stock-metrics">
            <article class="metric-tile">
              <p class="metric-label">Volume</p>
              <p class="metric-value">${formatNumber(stock.currentVolume)}</p>
            </article>
            <article class="metric-tile">
              <p class="metric-label">P/E Ratio</p>
              <p class="metric-value">${formatDecimal(fundamentals.peRatio)}</p>
            </article>
            <article class="metric-tile">
              <p class="metric-label">Market Cap</p>
              <p class="metric-value">${formatCurrency(fundamentals.marketCap, 0, currencyCode)}</p>
            </article>
            <article class="metric-tile">
              <p class="metric-label">Last Update</p>
              <p class="metric-value">${formatDate(stock.lastUpdated)}</p>
            </article>
          </div>
          <div class="range-wrap">
            <div class="range-meta">
              <span>52W Position</span>
              <span>${formatPercent(positionPercent)}</span>
            </div>
            <div class="range-track">
              <span class="range-fill" style="width:${positionPercent}%;"></span>
            </div>
          </div>
          <button data-symbol="${symbol}" class="stock-action">View Details</button>
        </article>
      `;
    })
    .join("");
}

async function openDetail(symbol) {
  try {
    const [stockRes, historyRes] = await Promise.all([
      request(API.bySymbol(symbol)),
      request(API.history(symbol)),
    ]);

    const stock = stockRes.stock || null;
    const history = Array.isArray(historyRes.history) ? historyRes.history : [];
    if (!stock) {
      showToast("Stock details not found", "error");
      return;
    }
    const currencyCode = normalizeCurrencyCode(stock.currency);

    state.detailStock = stock;
    state.detailHistory = history;

    const stockSymbol = String(stock.stockSymbol || stock._id || "").trim().toUpperCase();
    setText(dom.detailTitle, `${stock.companyName || "Company"} (${stockSymbol})`);
    setText(dom.detailSubTitle, `${stock.currency || "USD"} | ${stock.isActive ? "Active" : "Inactive"}`);
    setText(dom.detailPrice, formatCurrency(stock.currentPrice, 2, currencyCode));
    setText(dom.detailVolume, formatNumber(stock.currentVolume));
    setText(dom.detailMarketCap, formatCurrency(stock.fundamentals && stock.fundamentals.marketCap, 0, currencyCode));
    setText(dom.detailPeRatio, formatNumber(stock.fundamentals && stock.fundamentals.peRatio));

    renderFundamentals(stock);
    renderTechnicals(stock);
    renderDividends(stock);
    renderDetailCharts(stock, history, historyRes.technicalIndicators || stock.technicalIndicators || {});

    dom.detailModal.classList.remove("hidden");
    dom.detailModal.classList.add("flex");
  } catch (error) {
    console.error("openDetail error:", error);
    showToast(error.message || "Failed to load stock details", "error");
  }
}

function renderFundamentals(stock) {
  if (!dom.detailFundamentals) return;
  const fundamentals = stock.fundamentals || {};
  const currencyCode = normalizeCurrencyCode(stock.currency);
  dom.detailFundamentals.innerHTML = [
    `Market Cap: ${formatCurrency(fundamentals.marketCap, 0, currencyCode)}`,
    `P/E Ratio: ${formatNumber(fundamentals.peRatio)}`,
    `EPS: ${formatNumber(fundamentals.eps)}`,
    `ROE: ${formatNumber(fundamentals.roe)}%`,
    `Founded Year: ${escapeHtml(stock.foundedYear || "-")}`,
    `Exchanges: ${escapeHtml((stock.listedExchanges || []).join(", ") || "-")}`,
  ]
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function renderTechnicals(stock) {
  if (!dom.detailTechnicals) return;
  const technical = stock.technicalIndicators || {};
  const range = stock.priceRange || {};
  const currencyCode = normalizeCurrencyCode(stock.currency);
  dom.detailTechnicals.innerHTML = [
    `RSI: ${formatNumber(technical.rsi)}`,
    `MA 50: ${formatCurrency(technical.movingAverage50, 2, currencyCode)}`,
    `MA 200: ${formatCurrency(technical.movingAverage200, 2, currencyCode)}`,
    `Day High / Low: ${formatCurrency(range.dayHigh, 2, currencyCode)} / ${formatCurrency(range.dayLow, 2, currencyCode)}`,
    `52W High / Low: ${formatCurrency(range.fiftyTwoWeekHigh, 2, currencyCode)} / ${formatCurrency(range.fiftyTwoWeekLow, 2, currencyCode)}`,
    `Last Updated: ${formatDate(stock.lastUpdated)}`,
  ]
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function renderDividends(stock) {
  if (!dom.detailDividends) return;
  const dividends = Array.isArray(stock.dividendHistory) ? stock.dividendHistory : [];
  const currencyCode = normalizeCurrencyCode(stock.currency);
  if (!dividends.length) {
    dom.detailDividends.innerHTML = "<p>No dividend history available.</p>";
    return;
  }
  dom.detailDividends.innerHTML = dividends
    .sort((a, b) => Number(a.year) - Number(b.year))
    .map((entry) => `<p>${escapeHtml(entry.year)}: ${formatCurrency(entry.dividendPerShare, 2, currencyCode)} per share</p>`)
    .join("");
}

function renderDetailCharts(stock, history, technical) {
  const safeHistory = Array.isArray(history) && history.length
    ? history
    : [{ date: new Date().toISOString(), price: stock.currentPrice, volume: stock.currentVolume }];

  const labels = safeHistory.map((entry) => formatDate(entry.date));
  const prices = safeHistory.map((entry) => Number(entry.price || 0));
  const volumes = safeHistory.map((entry) => Number(entry.volume || 0));
  const ma50 = new Array(labels.length).fill(Number(technical.movingAverage50 || 0));
  const ma200 = new Array(labels.length).fill(Number(technical.movingAverage200 || 0));
  const rsiValues = new Array(labels.length).fill(Number(technical.rsi || 0));

  if (priceVolumeChart) {
    priceVolumeChart.destroy();
    priceVolumeChart = null;
  }
  if (rsiChart) {
    rsiChart.destroy();
    rsiChart = null;
  }

  if (dom.priceVolumeChartCanvas) {
    const ctx = dom.priceVolumeChartCanvas.getContext("2d");
    priceVolumeChart = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          {
            type: "line",
            label: "Price",
            data: prices,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.22)",
            fill: true,
            yAxisID: "priceAxis",
            tension: 0.3,
          },
          {
            type: "line",
            label: "MA 50",
            data: ma50,
            borderColor: "#a78bfa",
            borderDash: [6, 4],
            yAxisID: "priceAxis",
            pointRadius: 0,
          },
          {
            type: "line",
            label: "MA 200",
            data: ma200,
            borderColor: "#f59e0b",
            borderDash: [8, 5],
            yAxisID: "priceAxis",
            pointRadius: 0,
          },
          {
            type: "bar",
            label: "Volume",
            data: volumes,
            yAxisID: "volumeAxis",
            backgroundColor: "rgba(99, 102, 241, 0.55)",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.08)" } },
          priceAxis: {
            type: "linear",
            position: "left",
            ticks: { color: "#cbd5e1" },
            grid: { color: "rgba(148,163,184,0.12)" },
          },
          volumeAxis: {
            type: "linear",
            position: "right",
            ticks: { color: "#cbd5e1" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  if (dom.rsiChartCanvas) {
    const ctx = dom.rsiChartCanvas.getContext("2d");
    rsiChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "RSI",
            data: rsiValues,
            borderColor: "#22d3ee",
            backgroundColor: "rgba(34, 211, 238, 0.2)",
            fill: true,
            tension: 0.3,
            pointRadius: 1.8,
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
}

function closeDetailModal() {
  dom.detailModal.classList.add("hidden");
  dom.detailModal.classList.remove("flex");
}

function clearFilters() {
  [
    dom.searchInput,
    dom.minPriceInput,
    dom.maxPriceInput,
    dom.minMarketCapInput,
    dom.maxMarketCapInput,
  ].forEach((input) => {
    if (input) input.value = "";
  });
  if (dom.sortFieldSelect) dom.sortFieldSelect.value = "";
  if (dom.sortOrderSelect) dom.sortOrderSelect.value = "asc";
  state.displayedStocks = [...state.allStocks];
  renderStockGrid(state.displayedStocks);
}

function hasActiveFilters() {
  return Boolean(
    valueOf(dom.searchInput) ||
      valueOf(dom.minPriceInput) ||
      valueOf(dom.maxPriceInput) ||
      valueOf(dom.minMarketCapInput) ||
      valueOf(dom.maxMarketCapInput)
  );
}

function sortableValue(stock, field) {
  if (field === "price") return Number(stock.currentPrice || 0);
  if (field === "marketCap") return Number(stock.fundamentals && stock.fundamentals.marketCap || 0);
  if (field === "volume") return Number(stock.currentVolume || 0);
  if (field === "peRatio") return Number(stock.fundamentals && stock.fundamentals.peRatio || 0);
  return 0;
}

function calcRangePosition(currentValue, lowValue, highValue) {
  const current = Number(currentValue);
  const low = Number(lowValue);
  const high = Number(highValue);
  if (!Number.isFinite(current) || !Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    return 0;
  }
  const position = ((current - low) / (high - low)) * 100;
  return Math.max(0, Math.min(100, position));
}

function getRsiSignal(rsiValue) {
  const rsi = Number(rsiValue);
  if (!Number.isFinite(rsi)) {
    return { className: "balanced", label: "RSI --" };
  }
  if (rsi >= 70) {
    return { className: "hot", label: `RSI ${formatDecimal(rsi, 1)} High` };
  }
  if (rsi <= 30) {
    return { className: "cool", label: `RSI ${formatDecimal(rsi, 1)} Low` };
  }
  return { className: "balanced", label: `RSI ${formatDecimal(rsi, 1)} Mid` };
}

function formatPercent(value, maxFractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${number.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits })}%`;
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
  if (!dom.toastContainer) return;
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

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = "/login";
}

function normalizeCurrencyCode(value) {
  const code = String(value || "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

function formatCurrency(value, decimals = 2, currencyCode = "USD") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "$0";
  const safeCurrency = normalizeCurrencyCode(currencyCode);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  }
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toLocaleString("en-US");
}

function formatDecimal(value, maxFractionDigits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
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

function setText(element, value) {
  if (element) element.textContent = value;
}

function valueOf(element) {
  if (!element) return "";
  return String(element.value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function byId(id) {
  return document.getElementById(id);
}
