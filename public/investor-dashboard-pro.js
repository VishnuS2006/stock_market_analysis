// Professional Investor Dashboard Script
const API_BASE = "/api";
let detailChart = null;

const state = {
    stocks: [],
    filtered: [],
    all: [],
};

// Initialize
document.addEventListener("DOMContentLoaded", init);

function init() {
    setupEventListeners();
    loadAllStocks();
}

function setupEventListeners() {
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("applyFilters").addEventListener("click", applyFilters);
    document.getElementById("clearFilters").addEventListener("click", clearFilters);
    document.getElementById("advancedToggle").addEventListener("click", toggleAdvanced);
    document.getElementById("searchInput").addEventListener("input", quickSearch);
    document.getElementById("detailClose").addEventListener("click", closeDetail);
}

function toggleAdvanced() {
    document.getElementById("advancedFilters").classList.toggle("hidden");
}

async function loadAllStocks() {
    try {
        const response = await fetch(`${API_BASE}/stocks/all`);
        const data = await response.json();
        state.all = Array.isArray(data.stocks) ? data.stocks : [];
        state.stocks = [...state.all];
        state.filtered = [...state.all];
        renderStocks();
        updateStats();
    } catch (error) {
        console.error("Error loading stocks:", error);
        showToast("Failed to load stocks", "error");
    }
}

function quickSearch() {
    const term = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!term) {
        state.filtered = [...state.stocks];
    } else {
        state.filtered = state.stocks.filter(s =>
            s._id.toLowerCase().includes(term) || (s.companyName && s.companyName.toLowerCase().includes(term))
        );
    }
    renderStocks();
}

function applyFilters() {
    const sector = document.getElementById("sectorFilter").value;
    const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
    const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
    const minCap = parseInt(document.getElementById("minCap").value) || 0;
    const maxCap = parseInt(document.getElementById("maxCap").value) || Infinity;
    
    state.filtered = state.all.filter(stock => {
        const matchSector = !sector || stock.sector === sector;
        const matchPrice = stock.currentPrice >= minPrice && stock.currentPrice <= maxPrice;
        const matchCap = (stock.fundamentals?.marketCap || 0) >= minCap && (stock.fundamentals?.marketCap || 0) <= maxCap;
        return matchSector && matchPrice && matchCap;
    });
    
    applySorting();
    renderStocks();
}

function applySorting() {
    const sort = document.getElementById("sortSelect").value;
    if (!sort) return;
    
    const [field, order] = sort.split("_");
    state.filtered.sort((a, b) => {
        let aVal = field === "price" ? a.currentPrice : (a.fundamentals?.marketCap || 0);
        let bVal = field === "price" ? b.currentPrice : (b.fundamentals?.marketCap || 0);
        return order === "asc" ? aVal - bVal : bVal - aVal;
    });
}

function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("sectorFilter").value = "";
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";
    document.getElementById("minCap").value = "";
    document.getElementById("maxCap").value = "";
    document.getElementById("sortSelect").value = "";
    state.filtered = [...state.all];
    renderStocks();
}

function renderStocks() {
    const tbody = document.getElementById("stocksTableBody");
    const noMsg = document.getElementById("noStocksMsg");
    
    if (state.filtered.length === 0) {
        tbody.innerHTML = "";
        noMsg.style.display = "block";
        return;
    }
    
    noMsg.style.display = "none";
    tbody.innerHTML = state.filtered.map(stock => `
        <tr class="stock-row cursor-pointer transition">
            <td class="px-6 py-4 font-bold text-blue-400" onclick="openDetail('${stock._id}')">${stock._id}</td>
            <td class="px-6 py-4 text-gray-300">${stock.companyName || "N/A"}</td>
            <td class="px-6 py-4 text-gray-400">${stock.sector || "N/A"}</td>
            <td class="px-6 py-4 text-green-400 font-semibold">$${stock.currentPrice.toFixed(2)}</td>
            <td class="px-6 py-4 text-purple-400">${formatNumber(stock.fundamentals?.marketCap || 0)}</td>
            <td class="px-6 py-4 text-orange-400">${(stock.fundamentals?.peRatio || 0).toFixed(2)}</td>
            <td class="px-6 py-4">
                <button onclick="openDetail('${stock._id}')" class="glow-button text-xs text-white px-3 py-1 rounded">View</button>
            </td>
        </tr>
    `).join("");
}

function updateStats() {
    const stats = {
        total: state.all.length,
        ipos: state.all.filter(s => s.ipoDetails?.status === "open").length,
        avgPrice: state.all.length > 0 ? state.all.reduce((sum, s) => sum + s.currentPrice, 0) / state.all.length : 0,
        totalCap: state.all.reduce((sum, s) => sum + (s.fundamentals?.marketCap || 0), 0),
    };
    
    document.getElementById("totalStocksCount").textContent = stats.total;
    document.getElementById("activeIpos").textContent = stats.ipos;
    document.getElementById("avgPrice").textContent = "$" + stats.avgPrice.toFixed(2);
    document.getElementById("totalCap").textContent = formatNumber(stats.totalCap);
}

async function openDetail(symbol) {
    const stock = state.all.find(s => s._id === symbol);
    if (!stock) return;
    
    document.getElementById("detailSymbol").textContent = symbol;
    document.getElementById("detailCompanyName").textContent = stock.companyName || "N/A";
    document.getElementById("detailPrice").textContent = "$" + stock.currentPrice.toFixed(2);
    document.getElementById("detailCap").textContent = formatNumber(stock.fundamentals?.marketCap || 0);
    document.getElementById("detailPE").textContent = (stock.fundamentals?.peRatio || 0).toFixed(2);
    document.getElementById("detailEPS").textContent = "$" + (stock.fundamentals?.eps || 0).toFixed(2);
    
    // Show IPO section if available
    const ipoSection = document.getElementById("ipoSection");
    if (stock.ipoDetails && stock.ipoDetails.status) {
        ipoSection.classList.remove("hidden");
        document.getElementById("ipoIssuePrice").textContent = "$" + (stock.ipoDetails.issuePrice || 0).toFixed(2);
        document.getElementById("ipoTotalShares").textContent = formatNumber(stock.ipoDetails.totalShares || 0);
        document.getElementById("ipoListingDate").textContent = stock.ipoDetails.listingDate ? new Date(stock.ipoDetails.listingDate).toLocaleDateString() : "N/A";
        document.getElementById("ipoStatus").textContent = stock.ipoDetails.status;
    } else {
        ipoSection.classList.add("hidden");
    }
    
    // Render chart with historical prices
    renderDetailChart(stock.historicalPrices || []);
    
    document.getElementById("detailModal").classList.remove("hidden");
}

function renderDetailChart(historicalPrices) {
    if (detailChart) detailChart.destroy();
    
    if (!Array.isArray(historicalPrices) || historicalPrices.length === 0) {
        historicalPrices = [{ date: new Date(), price: 0, volume: 0 }];
    }
    
    const labels = historicalPrices.map(h => new Date(h.date).toLocaleDateString());
    const prices = historicalPrices.map(h => h.price);
    const volumes = historicalPrices.map(h => h.volume);
    
    const ctx = document.getElementById("detailChart");
    detailChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'y',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Volume',
                    data: volumes,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.4,
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { type: 'linear', position: 'left', title: { display: true, text: 'Price ($)' } },
                y1: { type: 'linear', position: 'right', title: { display: true, text: 'Volume' }, grid: { drawOnChartArea: false } },
            },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function closeDetail() {
    document.getElementById("detailModal").classList.add("hidden");
    if (detailChart) detailChart.destroy();
}

function formatNumber(num) {
    if (num >= 1_000_000_000) return "$" + (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return "$" + (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return "$" + (num / 1_000).toFixed(1) + "K";
    return "$" + num.toFixed(0);
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}
