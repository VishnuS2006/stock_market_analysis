const TOKEN_KEY = "token";

const API = {
  profile: "/api/company/profile",
  myStocks: "/api/stocks/my",
  analytics: "/api/stocks/analytics",
  stocks: "/api/stocks",
};

const state = {
  token: "",
  profile: null,
  stocks: [],
  stats: null,
};

const dom = {};
let priceChart = null;
let volumeChart = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheDom();
  bindEvents();

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    redirectToLogin();
    return;
  }

  state.token = token;
  loadDashboard();
}

function cacheDom() {
  dom.sidebar = byId("sidebar");
  dom.sidebarToggle = byId("sidebarToggle");
  dom.sidebarOverlay = byId("sidebarOverlay");

  dom.logoutBtn = byId("logoutBtn");
  dom.sidebarLogoutBtn = byId("sidebarLogoutBtn");

  dom.headerCompanyName = byId("headerCompanyName");
  dom.headerInitials = byId("headerInitials");

  dom.statTotalStocks = byId("statTotalStocks");
  dom.statActiveStocks = byId("statActiveStocks");
  dom.statAveragePrice = byId("statAveragePrice");
  dom.statMarketCap = byId("statMarketCap");
  dom.statVolume = byId("statVolume");

  dom.stockTableBody = byId("stockTableBody");
  dom.stockEmptyState = byId("stockEmptyState");
  dom.openStockModalBtn = byId("openStockModalBtn");
  dom.sidebarAddStockBtn = byId("sidebarAddStockBtn");

  dom.ipoCards = byId("ipoCards");
  dom.ipoEmptyState = byId("ipoEmptyState");

  dom.priceChartCanvas = byId("priceChart");
  dom.volumeChartCanvas = byId("volumeChart");

  dom.profileView = byId("profileView");
  dom.profileForm = byId("profileForm");
  dom.toggleProfileEditBtn = byId("toggleProfileEditBtn");
  dom.cancelProfileEditBtn = byId("cancelProfileEditBtn");
  dom.profileCompanyName = byId("profileCompanyName");
  dom.profileEmail = byId("profileEmail");
  dom.profileIndustry = byId("profileIndustry");
  dom.profileFoundedYear = byId("profileFoundedYear");
  dom.profileFundingNeeded = byId("profileFundingNeeded");
  dom.profileEquityOffered = byId("profileEquityOffered");
  dom.profileCompanyInput = byId("profileCompanyInput");
  dom.profileIndustryInput = byId("profileIndustryInput");
  dom.profileFoundedInput = byId("profileFoundedInput");
  dom.profileFundingInput = byId("profileFundingInput");
  dom.profileEquityInput = byId("profileEquityInput");

  dom.stockModal = byId("stockModal");
  dom.stockModalTitle = byId("stockModalTitle");
  dom.closeStockModalBtn = byId("closeStockModalBtn");
  dom.cancelStockBtn = byId("cancelStockBtn");
  dom.stockForm = byId("stockForm");
  dom.stockIdInput = byId("stockIdInput");
  dom.stockSymbolInput = byId("stockSymbolInput");
  dom.stockSectorInput = byId("stockSectorInput");
  dom.stockPriceInput = byId("stockPriceInput");
  dom.stockVolumeInput = byId("stockVolumeInput");
  dom.stockCurrencyInput = byId("stockCurrencyInput");
  dom.stockTagsInput = byId("stockTagsInput");
  dom.stockExchangesInput = byId("stockExchangesInput");
  dom.stockMarketCapInput = byId("stockMarketCapInput");
  dom.stockPeInput = byId("stockPeInput");
  dom.stockEpsInput = byId("stockEpsInput");
  dom.stockRoeInput = byId("stockRoeInput");
  dom.stockRsiInput = byId("stockRsiInput");
  dom.stockMa50Input = byId("stockMa50Input");
  dom.stockMa200Input = byId("stockMa200Input");
  dom.stockDayHighInput = byId("stockDayHighInput");
  dom.stockDayLowInput = byId("stockDayLowInput");
  dom.stock52HighInput = byId("stock52HighInput");
  dom.stock52LowInput = byId("stock52LowInput");
  dom.stockIssuePriceInput = byId("stockIssuePriceInput");
  dom.stockTotalSharesInput = byId("stockTotalSharesInput");
  dom.stockDividendYearInput = byId("stockDividendYearInput");
  dom.stockDividendValueInput = byId("stockDividendValueInput");
  dom.submitStockBtn = byId("submitStockBtn");

  dom.globalLoader = byId("globalLoader");
  dom.toastContainer = byId("toastContainer");
}

function bindEvents() {
  if (dom.sidebarToggle) dom.sidebarToggle.addEventListener("click", toggleSidebar);
  if (dom.sidebarOverlay) dom.sidebarOverlay.addEventListener("click", closeSidebar);

  if (dom.logoutBtn) dom.logoutBtn.addEventListener("click", logout);
  if (dom.sidebarLogoutBtn) dom.sidebarLogoutBtn.addEventListener("click", logout);

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      closeSidebar();
    }
  });

  if (dom.openStockModalBtn) dom.openStockModalBtn.addEventListener("click", () => openStockModal());
  if (dom.sidebarAddStockBtn) dom.sidebarAddStockBtn.addEventListener("click", () => openStockModal());
  if (dom.closeStockModalBtn) dom.closeStockModalBtn.addEventListener("click", closeStockModal);
  if (dom.cancelStockBtn) dom.cancelStockBtn.addEventListener("click", closeStockModal);
  if (dom.stockForm) dom.stockForm.addEventListener("submit", onSubmitStock);

  if (dom.stockTableBody) dom.stockTableBody.addEventListener("click", onStockTableAction);
  if (dom.ipoCards) dom.ipoCards.addEventListener("click", onIpoAction);

  if (dom.toggleProfileEditBtn) dom.toggleProfileEditBtn.addEventListener("click", openProfileEdit);
  if (dom.cancelProfileEditBtn) dom.cancelProfileEditBtn.addEventListener("click", closeProfileEdit);
  if (dom.profileForm) dom.profileForm.addEventListener("submit", onProfileSubmit);
}

async function loadDashboard() {
  showLoader(true);
  try {
    const [profileRes, stocksRes, analyticsRes] = await Promise.all([
      request(API.profile),
      request(API.myStocks),
      request(API.analytics),
    ]);

    state.profile = profileRes.profile || null;
    state.stocks = Array.isArray(stocksRes.stocks) ? stocksRes.stocks : [];
    state.stats = analyticsRes.stats || null;

    renderAll();
    showToast("Dashboard loaded", "success");
  } catch (error) {
    console.error("loadDashboard error:", error);
    showToast(error.message || "Failed to load dashboard", "error");
  } finally {
    showLoader(false);
  }
}

async function refreshStocksAndAnalytics() {
  try {
    const [stocksRes, analyticsRes] = await Promise.all([request(API.myStocks), request(API.analytics)]);
    state.stocks = Array.isArray(stocksRes.stocks) ? stocksRes.stocks : [];
    state.stats = analyticsRes.stats || null;
    renderStocks(state.stocks);
    renderIpoCards(state.stocks);
    renderStats(state.stats, state.stocks);
    renderCharts(state.stocks);
  } catch (error) {
    console.error("refreshStocksAndAnalytics error:", error);
    showToast(error.message || "Failed to refresh stocks", "error");
  }
}

function renderAll() {
  renderHeader(state.profile || {});
  renderProfile(state.profile || {});
  renderStocks(state.stocks);
  renderIpoCards(state.stocks);
  renderStats(state.stats, state.stocks);
  renderCharts(state.stocks);
}

function renderHeader(profile) {
  const companyName = String(profile.companyName || "Company").trim() || "Company";
  setText(dom.headerCompanyName, companyName);
  setText(dom.headerInitials, initials(companyName));
}

function renderProfile(profile) {
  setText(dom.profileCompanyName, profile.companyName || "-");
  setText(dom.profileEmail, profile.email || "-");
  setText(dom.profileIndustry, profile.industry || "-");
  setText(dom.profileFoundedYear, profile.foundedYear || "-");
  setText(dom.profileFundingNeeded, profile.fundingNeeded || "-");
  setText(dom.profileEquityOffered, Number.isFinite(Number(profile.equityOffered)) ? `${Number(profile.equityOffered).toFixed(2)}%` : "-");
}

function renderStats(stats, stocks) {
  const fallbackTotal = stocks.length;
  const fallbackActive = stocks.filter((stock) => stock.isActive).length;
  const fallbackAvgPrice = fallbackTotal
    ? stocks.reduce((sum, stock) => sum + Number(stock.currentPrice || 0), 0) / fallbackTotal
    : 0;
  const fallbackCap = stocks.reduce((sum, stock) => sum + Number(stock.fundamentals && stock.fundamentals.marketCap || 0), 0);
  const fallbackVolume = stocks.reduce((sum, stock) => sum + Number(stock.currentVolume || 0), 0);

  const values = {
    totalStocks: Number(stats && stats.totalStocks) || fallbackTotal,
    activeStocks: Number(stats && stats.activeStocks) || fallbackActive,
    averagePrice: Number(stats && stats.averagePrice) || fallbackAvgPrice,
    totalMarketCap: Number(stats && stats.totalMarketCap) || fallbackCap,
    totalVolume: Number(stats && stats.totalVolume) || fallbackVolume,
  };

  setText(dom.statTotalStocks, formatNumber(values.totalStocks));
  setText(dom.statActiveStocks, formatNumber(values.activeStocks));
  setText(dom.statAveragePrice, formatCurrency(values.averagePrice, 2));
  setText(dom.statMarketCap, formatCurrency(values.totalMarketCap, 0));
  setText(dom.statVolume, formatNumber(values.totalVolume));
}

function renderStocks(stocks) {
  if (!dom.stockTableBody || !dom.stockEmptyState) return;

  dom.stockTableBody.innerHTML = "";
  if (!stocks.length) {
    dom.stockEmptyState.classList.remove("hidden");
    return;
  }

  dom.stockEmptyState.classList.add("hidden");
  dom.stockTableBody.innerHTML = stocks
    .map((stock) => {
      const ipoStatus = String(stock.ipoDetails && stock.ipoDetails.status || "draft").toLowerCase();
      return `
        <tr class="text-slate-200">
          <td class="px-4 py-3 font-semibold">${escapeHtml(stock._id)}</td>
          <td class="px-4 py-3">${escapeHtml(stock.companyName || "-")}</td>
          <td class="px-4 py-3">${escapeHtml(stock.sector || "-")}</td>
          <td class="px-4 py-3">${formatCurrency(stock.currentPrice, 2)}</td>
          <td class="px-4 py-3">${formatCurrency(stock.fundamentals && stock.fundamentals.marketCap, 0)}</td>
          <td class="px-4 py-3">${buildStatusBadge(ipoStatus)}</td>
          <td class="px-4 py-3 text-right">
            <div class="inline-flex gap-2">
              <button data-action="edit" data-symbol="${escapeHtml(stock._id)}" class="soft-btn rounded-lg px-3 py-1.5 text-xs">Edit</button>
              <button data-action="delete" data-symbol="${escapeHtml(stock._id)}" class="rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-200">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderIpoCards(stocks) {
  if (!dom.ipoCards || !dom.ipoEmptyState) return;

  dom.ipoCards.innerHTML = "";
  if (!stocks.length) {
    dom.ipoEmptyState.classList.remove("hidden");
    return;
  }

  dom.ipoEmptyState.classList.add("hidden");
  dom.ipoCards.innerHTML = stocks
    .map((stock) => {
      const ipo = stock.ipoDetails || {};
      const status = String(ipo.status || "draft").toLowerCase();
      return `
        <article class="rounded-2xl border border-slate-600/30 bg-slate-900/45 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-display text-lg">${escapeHtml(stock._id)}</h3>
              <p class="text-sm text-slate-400">${escapeHtml(stock.companyName || "")}</p>
            </div>
            ${buildStatusBadge(status)}
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <p><span class="text-slate-400">Issue:</span> ${formatCurrency(ipo.issuePrice, 2)}</p>
            <p><span class="text-slate-400">Shares:</span> ${formatNumber(ipo.totalShares || 0)}</p>
            <p><span class="text-slate-400">Open:</span> ${formatDate(ipo.ipoOpenDate)}</p>
            <p><span class="text-slate-400">Close:</span> ${formatDate(ipo.ipoCloseDate)}</p>
            <p><span class="text-slate-400">List Date:</span> ${formatDate(ipo.listingDate)}</p>
            <p><span class="text-slate-400">Exchanges:</span> ${(stock.listedExchanges || []).join(", ") || "-"}</p>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button data-ipo-action="configure" data-symbol="${escapeHtml(stock._id)}" class="soft-btn rounded-lg px-3 py-1.5 text-xs">Step 4 Configure</button>
            <button data-ipo-action="open" data-symbol="${escapeHtml(stock._id)}" class="soft-btn rounded-lg px-3 py-1.5 text-xs">Step 5 Open</button>
            <button data-ipo-action="close" data-symbol="${escapeHtml(stock._id)}" class="soft-btn rounded-lg px-3 py-1.5 text-xs">Step 5 Close</button>
            <button data-ipo-action="list" data-symbol="${escapeHtml(stock._id)}" class="glow-btn rounded-lg px-3 py-1.5 text-xs font-semibold">Step 6 List</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCharts(stocks) {
  const labels = stocks.map((stock) => stock._id);
  const prices = stocks.map((stock) => Number(stock.currentPrice || 0));
  const volumes = stocks.map((stock) => Number(stock.currentVolume || 0));

  if (priceChart) {
    priceChart.destroy();
    priceChart = null;
  }
  if (volumeChart) {
    volumeChart.destroy();
    volumeChart = null;
  }

  if (dom.priceChartCanvas) {
    const ctx = dom.priceChartCanvas.getContext("2d");
    priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Current Price",
            data: prices,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.25)",
            borderWidth: 2.4,
            fill: true,
            tension: 0.35,
            pointRadius: 3.2,
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

  if (dom.volumeChartCanvas) {
    const ctx = dom.volumeChartCanvas.getContext("2d");
    volumeChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Current Volume",
            data: volumes,
            backgroundColor: "rgba(99, 102, 241, 0.7)",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { display: false } },
          y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.12)" } },
        },
      },
    });
  }
}

function openStockModal(stock = null) {
  resetStockForm();
  if (stock) {
    setText(dom.stockModalTitle, `Edit Stock ${stock._id}`);
    dom.stockIdInput.value = stock._id;
    dom.stockSymbolInput.value = stock._id;
    dom.stockSymbolInput.disabled = true;
    dom.stockSectorInput.value = stock.sector || "";
    dom.stockPriceInput.value = Number(stock.currentPrice || 0);
    dom.stockVolumeInput.value = Number(stock.currentVolume || 0);
    dom.stockCurrencyInput.value = stock.currency || "USD";
    dom.stockTagsInput.value = (stock.tags || []).join(", ");
    dom.stockExchangesInput.value = (stock.listedExchanges || []).join(", ");
    dom.stockMarketCapInput.value = Number(stock.fundamentals && stock.fundamentals.marketCap || 0);
    dom.stockPeInput.value = Number(stock.fundamentals && stock.fundamentals.peRatio || 0);
    dom.stockEpsInput.value = Number(stock.fundamentals && stock.fundamentals.eps || 0);
    dom.stockRoeInput.value = Number(stock.fundamentals && stock.fundamentals.roe || 0);
    dom.stockRsiInput.value = Number(stock.technicalIndicators && stock.technicalIndicators.rsi || 0);
    dom.stockMa50Input.value = Number(stock.technicalIndicators && stock.technicalIndicators.movingAverage50 || 0);
    dom.stockMa200Input.value = Number(stock.technicalIndicators && stock.technicalIndicators.movingAverage200 || 0);
    dom.stockDayHighInput.value = Number(stock.priceRange && stock.priceRange.dayHigh || 0);
    dom.stockDayLowInput.value = Number(stock.priceRange && stock.priceRange.dayLow || 0);
    dom.stock52HighInput.value = Number(stock.priceRange && stock.priceRange.fiftyTwoWeekHigh || 0);
    dom.stock52LowInput.value = Number(stock.priceRange && stock.priceRange.fiftyTwoWeekLow || 0);
    dom.stockIssuePriceInput.value = Number(stock.ipoDetails && stock.ipoDetails.issuePrice || 0);
    dom.stockTotalSharesInput.value = Number(stock.ipoDetails && stock.ipoDetails.totalShares || 0);
  } else {
    setText(dom.stockModalTitle, "Add Stock");
    dom.stockSymbolInput.disabled = false;
  }

  dom.stockModal.classList.remove("hidden");
  dom.stockModal.classList.add("flex");
}

function closeStockModal() {
  dom.stockModal.classList.add("hidden");
  dom.stockModal.classList.remove("flex");
  resetStockForm();
}

function resetStockForm() {
  if (!dom.stockForm) return;
  dom.stockForm.reset();
  dom.stockIdInput.value = "";
  dom.stockCurrencyInput.value = "USD";
  dom.stockSymbolInput.disabled = false;
}

async function onSubmitStock(event) {
  event.preventDefault();
  try {
    const symbol = String(dom.stockSymbolInput.value || "").trim().toUpperCase();
    const sector = String(dom.stockSectorInput.value || "").trim();
    const currentPrice = Number(dom.stockPriceInput.value);
    const currentVolume = Number(dom.stockVolumeInput.value);

    if (!symbol) {
      showToast("Stock symbol is required", "error");
      return;
    }
    if (!sector) {
      showToast("Sector is required", "error");
      return;
    }
    if (!Number.isFinite(currentPrice) || currentPrice < 0) {
      showToast("Current Price must be a valid number", "error");
      return;
    }
    if (!Number.isFinite(currentVolume) || currentVolume < 0) {
      showToast("Current Volume must be a valid number", "error");
      return;
    }

    const dividendYear = Number(dom.stockDividendYearInput.value);
    const dividendPerShare = Number(dom.stockDividendValueInput.value);
    const marketCapValue = Number(dom.stockMarketCapInput.value || 0);

    const payload = {
      stockSymbol: symbol,
      symbol,
      stockName: `${symbol} Listing`,
      sector,
      currentPrice,
      currentVolume,
      currency: String(dom.stockCurrencyInput.value || "USD").trim().toUpperCase(),
      tags: splitCsv(dom.stockTagsInput.value),
      listedExchanges: splitCsv(dom.stockExchangesInput.value).map((entry) => entry.toUpperCase()),
      priceRange: {
        dayHigh: Number(dom.stockDayHighInput.value || 0),
        dayLow: Number(dom.stockDayLowInput.value || 0),
        fiftyTwoWeekHigh: Number(dom.stock52HighInput.value || 0),
        fiftyTwoWeekLow: Number(dom.stock52LowInput.value || 0),
      },
      fundamentals: {
        marketCap: Number.isFinite(marketCapValue) ? marketCapValue : 0,
        peRatio: Number(dom.stockPeInput.value || 0),
        eps: Number(dom.stockEpsInput.value || 0),
        roe: Number(dom.stockRoeInput.value || 0),
      },
      technicalIndicators: {
        rsi: Number(dom.stockRsiInput.value || 0),
        movingAverage50: Number(dom.stockMa50Input.value || 0),
        movingAverage200: Number(dom.stockMa200Input.value || 0),
      },
      ipoDetails: {
        issuePrice: Number(dom.stockIssuePriceInput.value || 0),
        totalShares: Number(dom.stockTotalSharesInput.value || 0),
      },
      // Legacy aliases for older backend contracts.
      price: currentPrice,
      volume: currentVolume,
      marketCap: Number.isFinite(marketCapValue) ? marketCapValue : 0,
      changePercent: 0,
    };

    if (Number.isFinite(dividendYear) && dividendYear > 0 && Number.isFinite(dividendPerShare)) {
      payload.dividendHistory = [{ year: dividendYear, dividendPerShare }];
    }

    const stockId = String(dom.stockIdInput.value || "").trim().toUpperCase();
    if (stockId) {
      await request(`${API.stocks}/${encodeURIComponent(stockId)}`, {
        method: "PUT",
        body: payload,
      });
      showToast("Stock updated", "success");
    } else {
      await request(API.stocks, { method: "POST", body: payload });
      showToast("Stock created", "success");
    }

    closeStockModal();
    await refreshStocksAndAnalytics();
  } catch (error) {
    console.error("onSubmitStock error:", error);
    if (String(error.message || "").toLowerCase().includes("all stock fields are required")) {
      showToast("Server is still on old stock API. Restart backend and try again.", "error");
      return;
    }
    showToast(error.message || "Failed to save stock", "error");
  }
}

async function onStockTableAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const symbol = String(button.dataset.symbol || "").toUpperCase();
  const stock = state.stocks.find((entry) => String(entry._id).toUpperCase() === symbol);
  if (!stock) return;

  if (action === "edit") {
    openStockModal(stock);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete stock ${symbol}?`);
    if (!confirmed) return;

    try {
      await request(`${API.stocks}/${encodeURIComponent(symbol)}`, { method: "DELETE" });
      showToast("Stock deleted", "success");
      await refreshStocksAndAnalytics();
    } catch (error) {
      console.error("delete stock error:", error);
      showToast(error.message || "Failed to delete stock", "error");
    }
  }
}

async function onIpoAction(event) {
  const button = event.target.closest("[data-ipo-action]");
  if (!button) return;

  const action = button.dataset.ipoAction;
  const symbol = String(button.dataset.symbol || "").toUpperCase();
  if (!symbol) return;

  const stock = state.stocks.find((entry) => String(entry._id).toUpperCase() === symbol);
  if (!stock) return;

  try {
    if (action === "configure") {
      const issuePrice = window.prompt("Enter IPO issue price", String(stock.ipoDetails && stock.ipoDetails.issuePrice || 0));
      if (issuePrice === null) return;
      const totalShares = window.prompt("Enter total IPO shares", String(stock.ipoDetails && stock.ipoDetails.totalShares || 0));
      if (totalShares === null) return;
      await request(`${API.stocks}/${encodeURIComponent(symbol)}`, {
        method: "PUT",
        body: {
          ipoDetails: {
            issuePrice: Number(issuePrice),
            totalShares: Number(totalShares),
          },
        },
      });
      showToast(`${symbol} IPO configured`, "success");
    }

    if (action === "open") {
      await request(`${API.stocks}/${encodeURIComponent(symbol)}`, {
        method: "PUT",
        body: {
          ipoDetails: {
            issuePrice: Number(stock.ipoDetails && stock.ipoDetails.issuePrice || 0),
            totalShares: Number(stock.ipoDetails && stock.ipoDetails.totalShares || 0),
            ipoOpenDate: new Date().toISOString(),
          },
        },
      });
      showToast(`${symbol} IPO opened`, "success");
    }

    if (action === "close") {
      await request(`${API.stocks}/${encodeURIComponent(symbol)}`, {
        method: "PUT",
        body: {
          ipoDetails: {
            issuePrice: Number(stock.ipoDetails && stock.ipoDetails.issuePrice || 0),
            totalShares: Number(stock.ipoDetails && stock.ipoDetails.totalShares || 0),
            ipoOpenDate: stock.ipoDetails && stock.ipoDetails.ipoOpenDate || new Date().toISOString(),
            ipoCloseDate: new Date().toISOString(),
          },
        },
      });
      showToast(`${symbol} IPO closed`, "success");
    }

    if (action === "list") {
      const exchangeInput = window.prompt(
        "Enter exchanges (comma separated, e.g. NSE,BSE)",
        (stock.listedExchanges || ["NSE", "BSE"]).join(",")
      );
      if (exchangeInput === null) return;

      await request(`${API.stocks}/${encodeURIComponent(symbol)}`, {
        method: "PUT",
        body: {
          listedExchanges: splitCsv(exchangeInput).map((entry) => entry.toUpperCase()),
          isActive: true,
          ipoDetails: {
            issuePrice: Number(stock.ipoDetails && stock.ipoDetails.issuePrice || 0),
            totalShares: Number(stock.ipoDetails && stock.ipoDetails.totalShares || 0),
            ipoOpenDate: stock.ipoDetails && stock.ipoDetails.ipoOpenDate || null,
            ipoCloseDate: stock.ipoDetails && stock.ipoDetails.ipoCloseDate || null,
            listingDate: new Date().toISOString(),
          },
        },
      });
      showToast(`${symbol} listed successfully`, "success");
    }

    await refreshStocksAndAnalytics();
  } catch (error) {
    console.error("onIpoAction error:", error);
    showToast(error.message || "Failed IPO action", "error");
  }
}

function openProfileEdit() {
  if (!state.profile) return;

  dom.profileCompanyInput.value = state.profile.companyName || "";
  dom.profileIndustryInput.value = state.profile.industry || "";
  dom.profileFoundedInput.value = Number(state.profile.foundedYear || "");
  dom.profileFundingInput.value = state.profile.fundingNeeded || "";
  dom.profileEquityInput.value = Number(state.profile.equityOffered || 0);

  dom.profileView.classList.add("hidden");
  dom.profileForm.classList.remove("hidden");
  dom.toggleProfileEditBtn.classList.add("hidden");
}

function closeProfileEdit() {
  dom.profileView.classList.remove("hidden");
  dom.profileForm.classList.add("hidden");
  dom.toggleProfileEditBtn.classList.remove("hidden");
}

async function onProfileSubmit(event) {
  event.preventDefault();
  try {
    const payload = {
      companyName: String(dom.profileCompanyInput.value || "").trim(),
      industry: String(dom.profileIndustryInput.value || "").trim(),
      foundedYear: Number(dom.profileFoundedInput.value),
      fundingNeeded: String(dom.profileFundingInput.value || "").trim(),
      equityOffered: Number(dom.profileEquityInput.value),
    };

    const response = await request(API.profile, { method: "PUT", body: payload });
    state.profile = response.profile || payload;
    renderHeader(state.profile);
    renderProfile(state.profile);
    closeProfileEdit();
    showToast("Profile updated", "success");
  } catch (error) {
    console.error("onProfileSubmit error:", error);
    showToast(error.message || "Failed to update profile", "error");
  }
}

function buildStatusBadge(status) {
  const normalized = String(status || "draft").toLowerCase();
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `<span class="badge badge-${escapeHtml(normalized)}">${escapeHtml(label)}</span>`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.token}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin();
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

function toggleSidebar() {
  if (!dom.sidebar || !dom.sidebarOverlay) return;

  const isClosed = dom.sidebar.classList.contains("-translate-x-full");
  if (isClosed) {
    dom.sidebar.classList.remove("-translate-x-full");
    dom.sidebarOverlay.classList.remove("hidden");
  } else {
    closeSidebar();
  }
}

function closeSidebar() {
  if (!dom.sidebar || !dom.sidebarOverlay) return;
  dom.sidebar.classList.add("-translate-x-full");
  dom.sidebarOverlay.classList.add("hidden");
}

function showLoader(show) {
  if (!dom.globalLoader) return;
  if (show) {
    dom.globalLoader.classList.remove("hidden");
    dom.globalLoader.classList.add("flex");
  } else {
    dom.globalLoader.classList.add("hidden");
    dom.globalLoader.classList.remove("flex");
  }
}

function showToast(message, type = "info") {
  if (!dom.toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = "/login";
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatCurrency(value, decimals = 2) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function initials(name) {
  const parts = String(name || "Company").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CO";
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function setText(element, value) {
  if (element) element.textContent = value;
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
