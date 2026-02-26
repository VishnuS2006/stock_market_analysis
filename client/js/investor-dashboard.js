// Investor Dashboard JS (White Theme, Robust)
const errorDiv = document.getElementById('dashboardError');
const loadingDiv = document.getElementById('loading');
const stockTableWrap = document.getElementById('stockTableWrap');
const searchInput = document.getElementById('searchInput');
const sectorFilter = document.getElementById('sectorFilter');
const sortSelect = document.getElementById('sortSelect');
const logoutBtn = document.getElementById('logoutBtn');

function showError(msg) { errorDiv.textContent = msg; errorDiv.classList.remove('hidden'); }
function hideError() { errorDiv.classList.add('hidden'); }
function showLoading() { loadingDiv.classList.remove('hidden'); }
function hideLoading() { loadingDiv.classList.add('hidden'); }

logoutBtn.onclick = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

let allStocks = [];

async function fetchStocks() {
  showLoading(); hideError();
  try {
    const res = await fetch('/api/stocks');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch stocks');
    allStocks = data.stocks || [];
    renderStocks(allStocks);
    renderAnalytics(allStocks);
    populateSectors(allStocks);
  } catch (e) { showError(e.message); }
  hideLoading();
}

function renderStocks(stocks) {
  if (!stocks.length) { stockTableWrap.innerHTML = '<div class="text-gray-500">No stocks found.</div>'; return; }
  let html = '<table class="w-full bg-white rounded shadow"><thead><tr><th>Symbol</th><th>Name</th><th>Sector</th><th>Price</th><th>Volume</th><th>Market Cap</th><th>Change %</th></tr></thead><tbody>';
  for (const s of stocks) {
    html += `<tr><td>${s.symbol}</td><td>${s.name}</td><td>${s.sector}</td><td>${s.price}</td><td>${s.volume}</td><td>${s.marketCap}</td><td>${s.change}</td></tr>`;
  }
  html += '</tbody></table>';
  stockTableWrap.innerHTML = html;
}

function populateSectors(stocks) {
  const sectors = Array.from(new Set(stocks.map(s => s.sector))).sort();
  sectorFilter.innerHTML = '<option value="">All Sectors</option>' + sectors.map(sector => `<option value="${sector}">${sector}</option>`).join('');
}

searchInput.oninput = filterAndRender;
sectorFilter.onchange = filterAndRender;
sortSelect.onchange = filterAndRender;

function filterAndRender() {
  let filtered = allStocks;
  const search = searchInput.value.trim().toLowerCase();
  const sector = sectorFilter.value;
  const sort = sortSelect.value;
  if (search) filtered = filtered.filter(s => s.symbol.toLowerCase().includes(search));
  if (sector) filtered = filtered.filter(s => s.sector === sector);
  if (sort) filtered = filtered.slice().sort((a, b) => b[sort] - a[sort]);
  renderStocks(filtered);
  renderAnalytics(filtered);
}

function renderAnalytics(stocks) {
  const ctx = document.getElementById('analyticsChart').getContext('2d');
  if (window.analyticsChart) window.analyticsChart.destroy();
  const labels = stocks.map(s => s.symbol);
  const prices = stocks.map(s => s.price);
  window.analyticsChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Price', data: prices, backgroundColor: '#60a5fa' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

fetchStocks();
