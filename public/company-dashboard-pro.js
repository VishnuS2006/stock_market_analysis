const API_BASE = "/api";
const TOKEN_KEY = "token";

const state = {
    company: {},
    stocks: [],
    currentView: "stocks",
    editingSymbol: null,
};

let authToken = localStorage.getItem(TOKEN_KEY);

document.addEventListener("DOMContentLoaded", init);

function init() {
    if (!authToken) {
        window.location.href = "/login";
        return;
    }

    setupTabs();
    setupEventListeners();
    resetStockForm();
    loadCompanyProfile();
    loadMyStocks();
}

function setupTabs() {
    document.querySelectorAll(".sidebar-item[data-tab]").forEach((item) => {
        item.addEventListener("click", () => {
            const tab = item.getAttribute("data-tab");
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.add("hidden");
    });

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.remove("hidden");
    }

    document.querySelectorAll(".sidebar-item[data-tab]").forEach((item) => {
        item.classList.remove("active");
        if (item.getAttribute("data-tab") === tabName) {
            item.classList.add("active");
        }
    });

    state.currentView = tabName;
}

function setupEventListeners() {
    const logoutBtn = document.getElementById("logoutBtn");
    const addStockForm = document.getElementById("addStockForm");
    const profileForm = document.getElementById("profileForm");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
    if (addStockForm) {
        addStockForm.addEventListener("submit", handleAddOrUpdateStock);
    }
    if (profileForm) {
        profileForm.addEventListener("submit", handleSaveProfile);
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            resetStockForm();
            switchTab("stocks");
        });
    }
}

async function loadCompanyProfile() {
    try {
        const response = await fetch(`${API_BASE}/company/profile`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
            }
            showToast(data.message || "Failed to load profile", "error");
            return;
        }

        state.company = data.profile || {};
        setValue("profileCompanyName", state.company.companyName || "");
        setValue("profileIndustry", state.company.industry || "");
        setValue("profileFoundedYear", state.company.foundedYear || "");
        setValue("profileFundingNeeded", state.company.fundingNeeded || "");
        setValue(
            "profileEquityOffered",
            state.company.equityOffered !== undefined ? state.company.equityOffered : ""
        );
        refreshProfilePresentation();
    } catch (error) {
        console.error("Error loading profile:", error);
        showToast("Failed to load company profile", "error");
    }
}

async function loadMyStocks() {
    try {
        const response = await fetch(`${API_BASE}/stocks/my`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            showToast(data.message || "Failed to load stocks", "error");
            return;
        }

        state.stocks = Array.isArray(data.stocks) ? data.stocks : [];
        renderMyStocks();
        updateStockStats();
    } catch (error) {
        console.error("Error loading stocks:", error);
        showToast("Failed to load stocks", "error");
    }
}

function renderMyStocks() {
    const container = document.getElementById("stocksContainer");
    const noMsg = document.getElementById("noStocksMsg");

    if (!container || !noMsg) {
        return;
    }

    if (!state.stocks.length) {
        container.innerHTML = "";
        noMsg.style.display = "block";
        return;
    }

    noMsg.style.display = "none";
    container.innerHTML = state.stocks
        .map((stock) => {
            const rawSymbol = String(stock.stockSymbol || stock._id || "").trim().toUpperCase();
            const symbol = escapeHtml(rawSymbol || "-");
            const marketCap = Number(stock.fundamentals && stock.fundamentals.marketCap || 0);
            const price = Number(stock.currentPrice || 0);
            const volume = Number(stock.currentVolume || 0);
            const currency = normalizeCurrencyCode(stock.currency);
            const isActive = Boolean(stock.isActive);
            const statusClass = isActive ? "active" : "inactive";
            const statusLabel = isActive ? "Active" : "Inactive";

            return `
                <article class="stock-row-card">
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div class="flex-1">
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                                <h3 class="stock-symbol">${symbol}</h3>
                                <span class="stock-chip currency">${escapeHtml(currency)}</span>
                                <span class="stock-chip ${statusClass}">${statusLabel}</span>
                            </div>
                            <p class="text-sm text-slate-300">${escapeHtml(stock.sector || "N/A")}</p>
                            <div class="stock-metrics mt-3">
                                <div class="stock-metric">
                                    <p class="stock-metric-label">Market Cap</p>
                                    <p class="stock-metric-value">${formatCurrency(marketCap, currency, 0)}</p>
                                </div>
                                <div class="stock-metric">
                                    <p class="stock-metric-label">Volume</p>
                                    <p class="stock-metric-value">${volume.toLocaleString("en-US")}</p>
                                </div>
                                <div class="stock-metric">
                                    <p class="stock-metric-label">Tags</p>
                                    <p class="stock-metric-value">${escapeHtml((stock.tags || []).join(", ") || "None")}</p>
                                </div>
                                <div class="stock-metric">
                                    <p class="stock-metric-label">P/E Ratio</p>
                                    <p class="stock-metric-value">${formatDecimal(stock.fundamentals && stock.fundamentals.peRatio)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="lg:text-right">
                            <p class="text-3xl font-bold text-cyan-200">${formatCurrency(price, currency, 2)}</p>
                            <p class="mt-1 text-sm text-slate-300">Updated for investors</p>
                            <div class="stock-actions mt-3">
                                <button onclick="editStock('${symbol}')" class="stock-btn btn-edit">Edit</button>
                                <button onclick="deleteStock('${symbol}')" class="stock-btn btn-delete">Delete</button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");
}

function updateStockStats() {
    const totalStocks = state.stocks.length;
    const totalMarketCap = state.stocks.reduce((sum, stock) => sum + Number(stock.fundamentals && stock.fundamentals.marketCap || 0), 0);
    const avgPrice = totalStocks
        ? state.stocks.reduce((sum, stock) => sum + Number(stock.currentPrice || 0), 0) / totalStocks
        : 0;
    const defaultCurrency = normalizeCurrencyCode(totalStocks ? state.stocks[0].currency : "USD");

    setText("totalStocks", String(totalStocks));
    setText("totalMarketCap", formatCurrency(totalMarketCap, defaultCurrency, 0));
    setText("avgPrice", formatCurrency(avgPrice, defaultCurrency, 2));
    refreshProfilePresentation();
}

function buildStockPayload() {
    const symbol = String(document.getElementById("stockSymbol").value || "").trim().toUpperCase();
    const sector = String(document.getElementById("sector").value || "").trim();
    const currency = String(document.getElementById("currency").value || "USD").trim().toUpperCase();

    const currentPrice = getRequiredNumber("currentPrice");
    const currentVolume = getRequiredNumber("currentVolume");
    const marketCap = getRequiredNumber("marketCap");

    if (!symbol || !/^[A-Z0-9.-]{1,15}$/.test(symbol)) {
        return { error: "Enter a valid stock symbol (A-Z, 0-9, . or -)" };
    }
    if (!sector) {
        return { error: "Sector is required" };
    }
    if (currentPrice === null || currentVolume === null || marketCap === null) {
        return { error: "Price, volume and market cap are required numbers" };
    }

    const peRatio = getOptionalNumber("peRatio", 0);
    const eps = getOptionalNumber("eps", 0);
    const roe = getOptionalNumber("roe", 0);
    const rsi = getOptionalNumber("rsi", 0);
    const movingAverage50 = getOptionalNumber("movingAverage50", currentPrice);
    const movingAverage200 = getOptionalNumber("movingAverage200", currentPrice);

    const dayHigh = getOptionalNumber("dayHigh", currentPrice);
    const dayLow = getOptionalNumber("dayLow", currentPrice);
    const fiftyTwoWeekHigh = getOptionalNumber("fiftyTwoWeekHigh", currentPrice);
    const fiftyTwoWeekLow = getOptionalNumber("fiftyTwoWeekLow", currentPrice);

    if (rsi < 0 || rsi > 100) {
        return { error: "RSI must be between 0 and 100" };
    }
    if (dayLow > dayHigh) {
        return { error: "Day Low cannot be greater than Day High" };
    }
    if (fiftyTwoWeekLow > fiftyTwoWeekHigh) {
        return { error: "52W Low cannot be greater than 52W High" };
    }

    const majorShareholders = parseMajorShareholders(document.getElementById("majorShareholdersInput").value);
    if (majorShareholders.error) {
        return { error: majorShareholders.error };
    }

    const dividendHistory = parseDividendHistory(document.getElementById("dividendHistoryInput").value);
    if (dividendHistory.error) {
        return { error: dividendHistory.error };
    }

    const historicalPrices = parseHistoricalPrices(document.getElementById("historicalPricesInput").value);
    if (historicalPrices.error) {
        return { error: historicalPrices.error };
    }

    const ipoDetails = parseIpoDetailsFromForm();
    if (ipoDetails.error) {
        return { error: ipoDetails.error };
    }

    const payload = {
        stockSymbol: symbol,
        sector,
        currency,
        currentPrice,
        currentVolume,
        isActive: Boolean(document.getElementById("isActive").checked),
        tags: splitCsv(document.getElementById("tags").value),
        listedExchanges: splitCsv(document.getElementById("listedExchanges").value).map((item) => item.toUpperCase()),
        fundamentals: {
            marketCap,
            peRatio,
            eps,
            roe,
        },
        technicalIndicators: {
            rsi,
            movingAverage50,
            movingAverage200,
        },
        priceRange: {
            dayHigh,
            dayLow,
            fiftyTwoWeekHigh,
            fiftyTwoWeekLow,
        },
        majorShareholders: majorShareholders.value,
        dividendHistory: dividendHistory.value,
        historicalPrices: historicalPrices.value,
        ipoDetails: ipoDetails.value,
    };

    return { payload, symbol };
}

async function handleAddOrUpdateStock(event) {
    event.preventDefault();

    const buildResult = buildStockPayload();
    if (buildResult.error) {
        showToast(buildResult.error, "error");
        return;
    }

    const { payload, symbol } = buildResult;
    const isEditing = Boolean(state.editingSymbol);
    const endpoint = isEditing ? `${API_BASE}/stocks/${encodeURIComponent(state.editingSymbol)}` : `${API_BASE}/stocks`;
    const method = isEditing ? "PUT" : "POST";

    try {
        const response = await fetch(endpoint, {
            method,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            showToast(data.message || `Failed to ${isEditing ? "update" : "add"} stock`, "error");
            return;
        }

        showToast(isEditing ? `Stock ${state.editingSymbol} updated` : `Stock ${symbol} added`, "success");
        resetStockForm();
        await loadMyStocks();
        switchTab("stocks");
    } catch (error) {
        console.error("Error saving stock:", error);
        showToast(`Error trying to ${isEditing ? "update" : "add"} stock`, "error");
    }
}

async function deleteStock(stockSymbol) {
    if (!confirm(`Delete ${stockSymbol}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/stocks/${encodeURIComponent(stockSymbol)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` },
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            showToast(data.message || "Failed to delete stock", "error");
            return;
        }

        if (state.editingSymbol === stockSymbol) {
            resetStockForm();
        }

        showToast("Stock deleted", "success");
        await loadMyStocks();
    } catch (error) {
        console.error("Error deleting stock:", error);
        showToast("Error deleting stock", "error");
    }
}

function editStock(symbol) {
    const target = String(symbol || "").toUpperCase().trim();
    const stock = state.stocks.find((item) => String(item.stockSymbol || item._id || "").toUpperCase() === target);

    if (!stock) {
        showToast("Stock not found for editing", "error");
        return;
    }

    state.editingSymbol = target;

    document.getElementById("stockSymbol").value = target;
    document.getElementById("stockSymbol").disabled = true;
    document.getElementById("sector").value = stock.sector || "";
    document.getElementById("currency").value = stock.currency || "USD";
    document.getElementById("currentPrice").value = Number(stock.currentPrice || 0);
    document.getElementById("currentVolume").value = Number(stock.currentVolume || 0);
    document.getElementById("marketCap").value = Number(stock.fundamentals && stock.fundamentals.marketCap || 0);
    document.getElementById("peRatio").value = Number(stock.fundamentals && stock.fundamentals.peRatio || 0);
    document.getElementById("eps").value = Number(stock.fundamentals && stock.fundamentals.eps || 0);
    document.getElementById("roe").value = Number(stock.fundamentals && stock.fundamentals.roe || 0);
    document.getElementById("rsi").value = Number(stock.technicalIndicators && stock.technicalIndicators.rsi || 0);
    document.getElementById("movingAverage50").value = Number(stock.technicalIndicators && stock.technicalIndicators.movingAverage50 || 0);
    document.getElementById("movingAverage200").value = Number(stock.technicalIndicators && stock.technicalIndicators.movingAverage200 || 0);
    document.getElementById("dayHigh").value = Number(stock.priceRange && stock.priceRange.dayHigh || 0);
    document.getElementById("dayLow").value = Number(stock.priceRange && stock.priceRange.dayLow || 0);
    document.getElementById("fiftyTwoWeekHigh").value = Number(stock.priceRange && stock.priceRange.fiftyTwoWeekHigh || 0);
    document.getElementById("fiftyTwoWeekLow").value = Number(stock.priceRange && stock.priceRange.fiftyTwoWeekLow || 0);
    document.getElementById("tags").value = (stock.tags || []).join(", ");
    document.getElementById("listedExchanges").value = (stock.listedExchanges || []).join(", ");
    document.getElementById("majorShareholdersInput").value = (stock.majorShareholders || [])
        .map((item) => `${item.name}:${item.holdingPercent}`)
        .join(", ");
    document.getElementById("dividendHistoryInput").value = (stock.dividendHistory || [])
        .map((item) => `${item.year}:${item.dividendPerShare}`)
        .join(", ");
    document.getElementById("historicalPricesInput").value = (stock.historicalPrices || [])
        .map((item) => {
            const datePart = formatDateForInput(item.date);
            const pricePart = Number(item.price || 0);
            const volumePart = Number(item.volume || 0);
            return `${datePart}:${pricePart}:${volumePart}`;
        })
        .filter((entry) => entry && !entry.startsWith(":"))
        .join(", ");

    const ipoDetails = stock.ipoDetails || {};
    document.getElementById("ipoIssuePrice").value = Number(ipoDetails.issuePrice || 0);
    document.getElementById("ipoTotalShares").value = Number(ipoDetails.totalShares || 0);
    document.getElementById("ipoOpenDate").value = formatDateForInput(ipoDetails.ipoOpenDate);
    document.getElementById("ipoCloseDate").value = formatDateForInput(ipoDetails.ipoCloseDate);
    document.getElementById("ipoListingDate").value = formatDateForInput(ipoDetails.listingDate);
    document.getElementById("isActive").checked = Boolean(stock.isActive);

    document.getElementById("stockFormTitle").textContent = `Edit Stock: ${target}`;
    document.getElementById("stockFormSubTitle").textContent = "Update the stock details and save changes.";
    document.getElementById("stockSubmitBtn").textContent = "Update Stock";
    document.getElementById("cancelEditBtn").classList.remove("hidden");

    switchTab("add-stock");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetStockForm() {
    const form = document.getElementById("addStockForm");
    if (!form) {
        return;
    }

    form.reset();
    state.editingSymbol = null;

    document.getElementById("stockSymbol").disabled = false;
    document.getElementById("stockFormTitle").textContent = "Add New Stock";
    document.getElementById("stockFormSubTitle").textContent = "Create a stock listing with fundamentals and technical data.";
    document.getElementById("stockSubmitBtn").textContent = "Add Stock";
    document.getElementById("cancelEditBtn").classList.add("hidden");

    document.getElementById("currency").value = "USD";
    document.getElementById("isActive").checked = true;
}

async function handleSaveProfile(event) {
    event.preventDefault();

    const companyName = getTextValue("profileCompanyName");
    const industry = getTextValue("profileIndustry");
    const foundedYearText = getTextValue("profileFoundedYear");
    const fundingNeeded = getTextValue("profileFundingNeeded");
    const equityOfferedText = getTextValue("profileEquityOffered");

    const updates = {};
    if (companyName) updates.companyName = companyName;
    if (industry) updates.industry = industry;

    if (foundedYearText) {
        const foundedYear = Number(foundedYearText);
        if (!Number.isInteger(foundedYear)) {
            showToast("Founded year must be a whole number", "error");
            return;
        }
        updates.foundedYear = foundedYear;
    }

    if (fundingNeeded) {
        updates.fundingNeeded = fundingNeeded;
    }

    if (equityOfferedText) {
        const equityOffered = Number(equityOfferedText);
        if (!Number.isFinite(equityOffered) || equityOffered < 0 || equityOffered > 100) {
            showToast("Equity offered must be between 0 and 100", "error");
            return;
        }
        updates.equityOffered = equityOffered;
    }

    if (!Object.keys(updates).length) {
        showToast("No profile fields to update", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/company/profile`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            showToast(data.message || "Failed to update profile", "error");
            return;
        }

        showToast("Profile updated", "success");
        loadCompanyProfile();
    } catch (error) {
        console.error("Error updating profile:", error);
        showToast("Error updating profile", "error");
    }
}

function parseMajorShareholders(input) {
    const value = String(input || "").trim();
    if (!value) {
        return { value: [] };
    }

    const parsed = [];
    const entries = splitCsv(value);

    for (const entry of entries) {
        const parts = entry.split(":");
        if (parts.length !== 2) {
            return { error: `Invalid major shareholder format: ${entry}` };
        }

        const name = String(parts[0] || "").trim();
        const holdingPercent = Number(parts[1]);
        if (!name || !Number.isFinite(holdingPercent) || holdingPercent < 0 || holdingPercent > 100) {
            return { error: `Invalid major shareholder value: ${entry}` };
        }

        parsed.push({ name, holdingPercent });
    }

    return { value: parsed };
}

function parseDividendHistory(input) {
    const value = String(input || "").trim();
    if (!value) {
        return { value: [] };
    }

    const parsed = [];
    const entries = splitCsv(value);

    for (const entry of entries) {
        const parts = entry.split(":");
        if (parts.length !== 2) {
            return { error: `Invalid dividend history format: ${entry}` };
        }

        const year = Number(parts[0]);
        const dividendPerShare = Number(parts[1]);
        if (!Number.isInteger(year) || year < 1900 || !Number.isFinite(dividendPerShare) || dividendPerShare < 0) {
            return { error: `Invalid dividend history value: ${entry}` };
        }

        parsed.push({ year, dividendPerShare });
    }

    return { value: parsed };
}

function parseHistoricalPrices(input) {
    const value = String(input || "").trim();
    if (!value) {
        return { value: [] };
    }

    const parsed = [];
    const entries = splitCsv(value);

    for (const entry of entries) {
        const parts = entry.split(":");
        if (parts.length !== 3) {
            return { error: `Invalid historical price format: ${entry}` };
        }

        const dateText = String(parts[0] || "").trim();
        const price = Number(parts[1]);
        const volume = Number(parts[2]);
        const date = new Date(dateText);

        if (
            !dateText ||
            Number.isNaN(date.getTime()) ||
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isFinite(volume) ||
            volume < 0
        ) {
            return { error: `Invalid historical price value: ${entry}` };
        }

        parsed.push({
            date: date.toISOString(),
            price,
            volume,
        });
    }

    return { value: parsed };
}

function parseIpoDetailsFromForm() {
    const issuePrice = getOptionalNumber("ipoIssuePrice", 0);
    const totalShares = getOptionalNumber("ipoTotalShares", 0);
    const ipoOpenDate = getOptionalDate("ipoOpenDate");
    const ipoCloseDate = getOptionalDate("ipoCloseDate");
    const listingDate = getOptionalDate("ipoListingDate");

    if (issuePrice < 0 || totalShares < 0) {
        return { error: "IPO issue price and total shares must be non-negative" };
    }

    if (ipoOpenDate && ipoCloseDate && new Date(ipoOpenDate) > new Date(ipoCloseDate)) {
        return { error: "IPO open date cannot be after close date" };
    }

    return {
        value: {
            issuePrice,
            totalShares,
            ipoOpenDate,
            ipoCloseDate,
            listingDate,
        },
    };
}

function splitCsv(raw) {
    return String(raw || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function getTextValue(id) {
    return String(document.getElementById(id).value || "").trim();
}

function getRequiredNumber(id) {
    const raw = String(document.getElementById(id).value || "").trim();
    if (!raw) {
        return null;
    }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || numeric < 0) {
        return null;
    }
    return numeric;
}

function getOptionalNumber(id, fallback = 0) {
    const raw = String(document.getElementById(id).value || "").trim();
    if (!raw) {
        return fallback;
    }
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function getOptionalDate(id) {
    const raw = String(document.getElementById(id).value || "").trim();
    if (!raw) {
        return null;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString();
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type} animate__animated animate__fadeInUp`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("animate__fadeOutDown"), 2400);
    setTimeout(() => toast.remove(), 3000);
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function refreshProfilePresentation() {
    const companyName = String(state.company.companyName || "Company").trim() || "Company";
    const industry = String(state.company.industry || "Industry not set").trim() || "Industry not set";
    const foundedYear = Number(state.company.foundedYear);
    const foundedLabel = Number.isInteger(foundedYear) && foundedYear > 1800 ? String(foundedYear) : "--";
    const completeness = getProfileCompletenessPercent(state.company);

    setText("companyNameDisplay", companyName);
    setText("profileHeroName", companyName);
    setText("profileHeroIndustry", industry);
    setText("profileIndustryBadge", industry);
    setText("profileFoundedBadge", `Founded: ${foundedLabel}`);
    setText("profileStocksCount", String(state.stocks.length));
    setText("profileCompleteness", `${completeness}%`);
    setText("profileAvatar", getInitials(companyName));
}

function getProfileCompletenessPercent(profile) {
    const checks = [
        Boolean(String(profile.companyName || "").trim()),
        Boolean(String(profile.industry || "").trim()),
        Number.isInteger(Number(profile.foundedYear)) && Number(profile.foundedYear) > 1800,
    ];
    const score = checks.filter(Boolean).length / checks.length;
    return Math.round(score * 100);
}

function getInitials(name) {
    const tokens = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!tokens.length) return "CO";

    const first = tokens[0].charAt(0);
    const second = tokens.length > 1 ? tokens[1].charAt(0) : tokens[0].charAt(1) || "";
    return `${first}${second}`.toUpperCase();
}

function normalizeCurrencyCode(value) {
    const code = String(value || "USD").trim().toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

function formatCurrency(value, currencyCode = "USD", decimals = 2) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "$0";

    const safeCurrency = normalizeCurrencyCode(currencyCode);
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: safeCurrency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numeric);
    } catch {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numeric);
    }
}

function formatDecimal(value, maxFractionDigits = 2) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0";
    return numeric.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

function formatDateForInput(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return date.toISOString().slice(0, 10);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}
