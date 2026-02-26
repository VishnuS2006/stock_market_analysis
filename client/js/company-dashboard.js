// Company Dashboard JS (White Theme, Robust)
const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';

const errorDiv = document.getElementById('dashboardError');
const loadingDiv = document.getElementById('loading');
const stockTableWrap = document.getElementById('stockTableWrap');
const modal = document.getElementById('modal');
const stockForm = document.getElementById('stockForm');
const modalTitle = document.getElementById('modalTitle');
const saveStockBtn = document.getElementById('saveStockBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const addStockBtn = document.getElementById('addStockBtn');
const logoutBtn = document.getElementById('logoutBtn');

function showError(msg) { errorDiv.textContent = msg; errorDiv.classList.remove('hidden'); }
function hideError() { errorDiv.classList.add('hidden'); }
function showLoading() { loadingDiv.classList.remove('hidden'); }
function hideLoading() { loadingDiv.classList.add('hidden'); }

logoutBtn.onclick = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

async function fetchStocks() {
  showLoading(); hideError();
  try {
    const res = await fetch('/api/stocks/my', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch stocks');
    renderStocks(data.stocks || []);
    renderAnalytics(data.stocks || []);
  } catch (e) { showError(e.message); }
  hideLoading();
}

function renderStocks(stocks) {
  if (!stocks.length) { stockTableWrap.innerHTML = '<div class="text-gray-500">No stocks found.</div>'; return; }
  let html = '<table class="w-full bg-white rounded shadow"><thead><tr><th>Symbol</th><th>Name</th><th>Sector</th><th>Price</th><th>Volume</th><th>Market Cap</th><th>Change %</th><th></th></tr></thead><tbody>';
  for (const s of stocks) {
    html += `<tr><td>${s.symbol}</td><td>${s.name}</td><td>${s.sector}</td><td>${s.price}</td><td>${s.volume}</td><td>${s.marketCap}</td><td>${s.change}</td><td><button onclick="editStock('${s._id}')" class="text-blue-600">Edit</button> <button onclick="deleteStock('${s._id}')" class="text-red-500">Delete</button></td></tr>`;
  }
  html += '</tbody></table>';
  stockTableWrap.innerHTML = html;
}

window.editStock = function(id) { openModal('Edit Stock', id); };
window.deleteStock = async function(id) {
  if (!confirm('Delete this stock?')) return;
  try {
    const res = await fetch(`/api/stocks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Delete failed');
    fetchStocks();
  } catch (e) { showError(e.message); }
};

addStockBtn.onclick = () => openModal('Add Stock');
cancelModalBtn.onclick = closeModal;

function openModal(title, id) {
  modalTitle.textContent = title;
  modal.classList.remove('hidden');
  stockForm.innerHTML = `<input id="symbol" placeholder="Symbol" class="w-full p-2 rounded" required><input id="name" placeholder="Name" class="w-full p-2 rounded" required><input id="sector" placeholder="Sector" class="w-full p-2 rounded" required><input id="price" type="number" placeholder="Price" class="w-full p-2 rounded" required><input id="volume" type="number" placeholder="Volume" class="w-full p-2 rounded" required><input id="marketCap" type="number" placeholder="Market Cap" class="w-full p-2 rounded" required><input id="change" type="number" placeholder="Change %" class="w-full p-2 rounded" required>`;
  if (id) loadStock(id);
  saveStockBtn.onclick = (e) => saveStock(e, id);
}
function closeModal() { modal.classList.add('hidden'); }

async function loadStock(id) {
  try {
    const res = await fetch(`/api/stocks/my`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const stock = (data.stocks || []).find(s => s._id === id);
    if (!stock) return;
    stockForm.symbol.value = stock.symbol;
    stockForm.name.value = stock.name;
    stockForm.sector.value = stock.sector;
    stockForm.price.value = stock.price;
    stockForm.volume.value = stock.volume;
    stockForm.marketCap.value = stock.marketCap;
    stockForm.change.value = stock.change;
  } catch (e) { showError(e.message); }
}

async function saveStock(e, id) {
  e.preventDefault();
  const body = {
    symbol: stockForm.symbol.value,
    name: stockForm.name.value,
    sector: stockForm.sector.value,
    price: Number(stockForm.price.value),
    volume: Number(stockForm.volume.value),
    marketCap: Number(stockForm.marketCap.value),
    change: Number(stockForm.change.value)
  };
  try {
    let res, data;
    if (id) {
      res = await fetch(`/api/stocks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    } else {
      res = await fetch(`/api/stocks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    }
    data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Save failed');
    closeModal();
    fetchStocks();
  } catch (e) { showError(e.message); }
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
