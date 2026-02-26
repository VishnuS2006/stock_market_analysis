# Professional Stock Listing + IPO Simulation Platform

Full-stack fintech platform with:
- Company dashboard for multi-stock listing and IPO lifecycle management.
- Investor dashboard for market discovery, filtering/sorting, and analytics.
- JWT auth, MongoDB persistence, and Chart.js visualizations.

## Tech Stack
- Frontend: HTML + Tailwind CSS + Vanilla JavaScript + Chart.js
- Backend: Node.js + Express
- Database: MongoDB (`stockDB`) with Mongoose
- Authentication: JWT + bcrypt

## Implemented Highlights

### 1) Investor Signup Fix (Critical)
- `express.json()` and URL-encoded middleware enabled in `server.js`.
- `POST /api/auth/signup/investor` fully validated and hardened.
- Password hashing with bcrypt.
- Duplicate email checks across company + investor collections.
- Consistent JSON responses with status codes.
- Try/catch + debug logging in controller.
- Frontend signup calls corrected to explicit auth endpoints and redirects to `/login`.
- `Investor` schema exports correctly.

### 2) Advanced Stock Schema
`models/Stock.js` now supports nested structured data with:
- `_id` = `stockSymbol`
- `companyId` reference + auto-filled `companyName`, `foundedYear`
- `sector`, `isActive`, `currentPrice`, `currency`, `tags`
- `priceRange`, `fundamentals`, `dividendHistory`
- `technicalIndicators`, `majorShareholders`, `listedExchanges`
- `ipoDetails` with lifecycle status (`draft/configured/open/closed/listed`)
- `historicalPrices` and `lastUpdated`
- `timestamps`

### 3) Company Multi-Stock + IPO Flow
Protected company APIs:
- `POST /api/stocks`
- `GET /api/stocks/my`
- `PUT /api/stocks/:id`
- `DELETE /api/stocks/:id`
- `GET /api/stocks/analytics`

Security:
- JWT verification + company-role enforcement.
- Owner-only stock updates/deletes.

IPO flow supported via update payloads:
- Step 4: `issuePrice`, `totalShares`
- Step 5: `ipoOpenDate`, `ipoCloseDate`
- Step 6: `listingDate`, `listedExchanges`, `isActive`

### 4) Investor Market View
Public market APIs:
- `GET /api/stocks/all` (active stocks)
- `GET /api/stocks/:symbol` (full stock details)
- `GET /api/stocks/filter` (sector, price, market cap, tags, search)
- `GET /api/stocks/sort` (price, marketCap, volume, peRatio)
- `GET /api/stocks/history/:symbol` (historical series)

### 5) Chart.js Analytics
- Company dashboard:
  - Price overview chart
  - Volume overview chart
- Investor detail modal:
  - Price trend + moving average overlays
  - Volume series
  - RSI visualization

All chart data comes from MongoDB-backed stock documents.

## Dashboard UI

### Company (`public/company-dashboard.html`)
- Premium dark gradient fintech style
- Glass cards, glow CTAs, responsive sidebar
- Sections:
  - My Stocks
  - Add Stock (modal form)
  - IPO Management
  - Stock Analytics
  - Profile
  - Logout
- Toast notifications + loading overlay

### Investor (`public/investor-dashboard.html`)
- Modern market terminal layout
- Search, advanced filtering, sorting
- Card-based stock browsing
- Full details modal with fundamentals, technicals, dividends, charts

## Folder Structure

```text
stock_analysis/
  controllers/
    authController.js
    companyController.js
    stockController.js
  middleware/
    auth.js
  models/
    Company.js
    Investor.js
    Stock.js
    StockHistory.js
  routes/
    auth.js
    company.js
    stocks.js
  public/
    index.html
    signup.html
    login.html
    auth.js
    company-dashboard.html
    company-dashboard-v2.js
    investor-dashboard.html
    investor-dashboard.js
  server.js
  package.json
  README.md
```

## Run Instructions

1. Install dependencies
   ```bash
   cd stock_analysis
   npm install
   ```

2. Create `.env`
   ```ini
   MONGO_URI=mongodb://127.0.0.1:27017/stockDB
   JWT_SECRET=change_this_secret
   PORT=5000
   ```

3. Start server
   ```bash
   npm start
   ```

4. Open app
- Home: `http://localhost:5000/`
- Signup: `http://localhost:5000/signup`
- Login: `http://localhost:5000/login`
- Company dashboard: `http://localhost:5000/company-dashboard.html`
- Investor dashboard: `http://localhost:5000/investor-dashboard.html`
