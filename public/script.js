const API = "http://localhost:5000/api";
let chart;

// Load Stocks
async function loadStocks() {
    const res = await fetch(`${API}/stocks`);
    const stocks = await res.json();

    const select = document.getElementById("stockSelect");
    select.innerHTML = "";

    stocks.forEach(stock => {
        const option = document.createElement("option");
        option.value = stock._id;
        option.textContent = `${stock.name} (${stock.symbol})`;
        select.appendChild(option);
    });

    displayDashboard();
}

// Add Stock
async function addStock() {
    const data = {
        name: stockName.value,
        symbol: symbol.value,
        sector: sector.value,
        currentPrice: price.value
    };

    await fetch(`${API}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    loadStocks();
}

// Add Event
async function addEvent() {
    const data = {
        title: eventTitle.value,
        description: eventDesc.value,
        eventDate: eventDate.value,
        impact: impact.value,
        priceChangePercentage: change.value,
        stockId: stockSelect.value
    };

    await fetch(`${API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    displayDashboard();
}

// Delete Event
async function deleteEvent(id) {
    await fetch(`${API}/events/${id}`, {
        method: "DELETE"
    });

    displayDashboard();
}

// Correlation Strength Logic
function getCorrelationStrength(change) {
    change = Math.abs(change);

    if (change > 5) return "Strong";
    if (change > 2) return "Moderate";
    return "Weak";
}

// Dashboard Display
async function displayDashboard() {
    const res = await fetch(`${API}/events`);
    const events = await res.json();

    const dashboard = document.getElementById("dashboard");
    dashboard.innerHTML = "";

    const labels = [];
    const dataPoints = [];

    events.forEach(event => {
        const div = document.createElement("div");
        div.className = "stock-card";

        const strength = getCorrelationStrength(event.priceChangePercentage);

        div.innerHTML = `
            <h3>${event.stockId.name} (${event.stockId.symbol})</h3>
            <p><strong>Event:</strong> ${event.title}</p>
            <p class="${event.impact.toLowerCase()}">
                <strong>Impact:</strong> ${event.impact}
            </p>
            <p><strong>Price Change:</strong> ${event.priceChangePercentage}%</p>
            <p><strong>Correlation Strength:</strong> ${strength}</p>
            <button class="delete-btn" onclick="deleteEvent('${event._id}')">
                Delete
            </button>
        `;

        dashboard.appendChild(div);

        labels.push(event.title);
        dataPoints.push(event.priceChangePercentage);
    });

    updateChart(labels, dataPoints);
}

// Chart Update
function updateChart(labels, data) {
    const ctx = document.getElementById("correlationChart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Price Change %",
                data: data
            }]
        }
    });
}

window.onload = loadStocks;