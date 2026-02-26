# COMPLETE SETUP & DEPLOYMENT GUIDE

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB 4.0+ running on localhost:27017 (or configure MONGO_URI in .env)
- npm v7+

### Installation (5 minutes)

```bash
# Navigate to project
cd stock_analysis

# Install dependencies
npm install

# Server will automatically use .env file created during setup
# .env contains:
# - MONGO_URI: MongoDB connection string
# - JWT_SECRET: JWT signing key  
# - PORT: Server port (default 5000)

# Start the server
npm start

# Server runs on http://localhost:5000
```

---

## 📁 FOLDER STRUCTURE

```
stock_analysis/
├── .env                          # Environment variables (created)
├── package.json                  # Dependencies
├── server.js                     # Express server entry point
│
├── models/
│   ├── Company.js               # Company schema (signup, profile)
│   ├── Investor.js              # Investor schema (signup)
│   ├── Stock.js                 # Advanced stock with IPO, fundamentals, etc
│   └── StockHistory.js          # Historical tracking
│
├── controllers/
│   ├── authController.js        # Signup/Login (FIXED investor signup)
│   ├── companyController.js     # Profile management
│   └── stockController.js       # Stock CRUD + analytics (advanced)
│
├── routes/
│   ├── auth.js                  # /api/auth/*
│   ├── company.js               # /api/company/*
│   └── stocks.js                # /api/stocks/*
│
├── middleware/
│   └── auth.js                  # JWT verification
│
└── public/                       # Frontend assets
    ├── index.html               # Landing page
    ├── signup.html              # Signup form
    ├── login.html               # Login form
    ├── company-dashboard-pro.html    # Company dashboard (NEW)
    ├── company-dashboard-pro.js      # Company dashboard script (NEW)
    ├── investor-dashboard-pro.html   # Investor dashboard (NEW)
    ├── investor-dashboard-pro.js     # Investor dashboard script (NEW)
    ├── auth.js                  # Auth logic (FIXED)
    └── style.css                # Styles
```

---

## 🔧 KEY FIXES IMPLEMENTED

### ✅ PART 1: INVESTOR SIGNUP (FIXED)
- ✓ Express.json() middleware enabled
- ✓ POST /api/auth/signup/investor routes working
- ✓ Required field validation
- ✓ bcrypt password hashing
- ✓ Duplicate email prevention
- ✓ Proper JSON responses
- ✓ Try/catch error handling with console logs
- ✓ Investor model exported correctly
- ✓ Frontend fetch request corrected
- ✓ Redirect after signup working

**Test it:**
```
1. Go to http://localhost:5000/signup
2. Click "Investor" tab
3. Fill all fields and submit
4. Should redirect to login with success message
```

### ✅ PART 2: ADVANCED STOCK SCHEMA
Stock model now supports:
```javascript
{
  _id: "AAPL",                    // Symbol as primary key
  companyId: ObjectId,
  companyName: "Apple Inc.",
  sector: "Technology",
  isActive: true,
  foundedYear: 1976,
  currentPrice: 150.25,
  currentVolume: 1000000,
  currency: "USD",
  tags: ["tech", "dividend", "mega-cap"],
  
  priceRange: {
    dayHigh: 152.00,
    dayLow: 149.50,
    fiftyTwoWeekHigh: 195.00,
    fiftyTwoWeekLow: 125.00
  },
  
  fundamentals: {
    marketCap: 2500000000,
    peRatio: 28.5,
    eps: 5.27,
    roe: 89.5
  },
  
  dividendHistory: [
    { year: 2023, dividendPerShare: 0.92 },
    { year: 2022, dividendPerShare: 0.87 }
  ],
  
  technicalIndicators: {
    rsi: 65.2,
    movingAverage50: 148.75,
    movingAverage200: 145.50
  },
  
  majorShareholders: [
    { name: "Vanguard Group", holdingPercent: 7.2 },
    { name: "BlackRock", holdingPercent: 6.1 }
  ],
  
  listedExchanges: ["NASDAQ"],
  
  ipoDetails: {
    issuePrice: 22.00,
    totalShares: 100000000,
    ipoOpenDate: "1980-12-13",
    ipoCloseDate: "1980-12-13",
    listingDate: "1980-12-13",
    status: "listed"          // draft, configured, open, closed, listed
  },
  
  historicalPrices: [
    { date: "2024-01-01", price: 148.50, volume: 500000 },
    { date: "2024-01-02", price: 149.75, volume: 550000 }
  ]
}
```

### ✅ PART 3: COMPANY STOCK MANAGEMENT
**Routes:**
- `POST /api/stocks` - Add new stock
- `GET /api/stocks/my` - List company's stocks
- `PUT /api/stocks/:symbol` - Update stock
- `DELETE /api/stocks/:symbol` - Delete stock
- `GET /api/stocks/analytics` - Get analytics

**Company Dashboard Features:**
- Add multiple stocks with full details
- View stock list with stats
- Edit/Delete stocks
- IPO management panel
- Stock analytics charts (Price, Volume)
- Company profile management
- All with modern fintech UI

### ✅ PART 4: INVESTOR STOCK MARKET VIEW
**Routes:**
- `GET /api/stocks/all` - All active stocks
- `GET /api/stocks/:symbol` - Single stock details
- `GET /api/stocks/filter` - Filter by sector, price, cap
- `GET /api/stocks/sort` - Sort by price, cap, PE ratio
- `GET /api/stocks/history/:symbol` - Historical prices

**Investor Dashboard Features:**
- Browse all listed stocks
- Search by symbol/company name
- Filter by:
  - Sector
  - Price range
  - Market cap
  - P/E ratio
- Sort multiple ways
- View detailed stock info
- Price history with Chart.js
- IPO information display
- Professional fintech UI

### ✅ PART 5: CHARTS & ANALYTICS
**Using Chart.js for:**
- Price trend line charts (real MongoDB data)
- Volume bar charts
- Multi-axis visualizations
- RSI indicators
- Moving averages overlay

All charts pull REAL data from MongoDB collections.

### ✅ PART 6: PREMIUM FINTECH UI
**Design Features:**
- Dark gradient backgrounds
- Glass morphism cards
- Glow buttons with hover effects
- Smooth animations
- Responsive layouts (mobile, tablet, desktop)
- Sidebar navigation (company)
- Modal dialogs
- Toast notifications
- Loading spinners
- Professional color scheme

---

## 🔒 SECURITY FEATURES

✅ JWT Authentication (24h expiry)
✅ bcrypt password hashing (10 salt rounds)
✅ Input validation & sanitization
✅ Protected endpoints (company only)
✅ Email uniqueness checks
✅ Proper HTTP status codes
✅ Try/catch error handling
✅ Debug logging
✅ Role-based access control

---

## 📊 API ENDPOINTS

### Authentication
```
POST   /api/auth/signup/company     - Register company
POST   /api/auth/signup/investor    - Register investor (FIXED)
POST   /api/auth/login              - Login (any role)
```

### Company Profile (Protected)
```
GET    /api/company/profile         - Get profile
PUT    /api/company/profile         - Update profile
```

### Stock Management (Company only)
```
POST   /api/stocks                  - Create stock
GET    /api/stocks/my               - Get company's stocks
GET    /api/stocks/:symbol          - Get stock details
PUT    /api/stocks/:symbol          - Update stock
DELETE /api/stocks/:symbol          - Delete stock
GET    /api/stocks/analytics        - Get analytics
```

### Public Stock Data
```
GET    /api/stocks/all              - All active stocks
GET    /api/stocks/filter           - Filter stocks
GET    /api/stocks/sort             - Sort stocks
GET    /api/stocks/history/:symbol  - Historical data
```

---

## 🧪 TESTING

### Test Company Signup & Stock Management
```bash
# 1. Signup company
curl -X POST http://localhost:5000/api/auth/signup/company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Tech Corp",
    "email": "tech@corp.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "registrationNumber": "REG123456",
    "industry": "Technology",
    "foundedYear": 2015,
    "fundingNeeded": "$500K-$1M",
    "equityOffered": 10
  }'

# Get token from response, then:

# 2. Get company profile
curl -X GET http://localhost:5000/api/company/profile \
  -H "Authorization: Bearer <token>"

# 3. Add a stock
curl -X POST http://localhost:5000/api/stocks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "TECH",
    "companyName": "Tech Corp",
    "sector": "Technology",
    "isActive": true,
    "foundedYear": 2015,
    "currentPrice": 150.50,
    "currentVolume": 1000000,
    "fundamentals": {
      "marketCap": 1500000000,
      "peRatio": 25.5,
      "eps": 5.90
    },
    "ipoDetails": {
      "issuePrice": 15.00,
      "totalShares": 100000000
    }
  }'

# 4. Get company's stocks
curl -X GET http://localhost:5000/api/stocks/my \
  -H "Authorization: Bearer <token>"

# 5. View as investor
curl -X GET http://localhost:5000/api/stocks/all
```

### Test Investor Signup (NEW)
```bash
curl -X POST http://localhost:5000/api/auth/signup/investor \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Investor",
    "email": "john@investor.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "phone": "+1234567890",
    "investorType": "Individual",
    "investmentRange": "$50K-$100K",
    "preferredIndustry": "Technology",
    "experienceLevel": "Intermediate"
  }'
```

---

## 🎯 FEATURES SUMMARY

### Company Dashboard
- 📊 Real-time stock statistics
- ➕ Add multiple stocks with full details
- ✏️ Edit/Delete stocks
- 📈 Analytics with Chart.js
- 🚀 IPO management workflow
- 👤 Profile management
- 📋 Stock table with modern styling
- 🌐 Fully responsive design

### Investor Dashboard
- 📋 Browse all listed stocks
- 🔍 Advanced search & filtering
- 🎯 Sort by multiple criteria
- 📊 Stock detail modal with charts
- 💹 Real historical price data
- 🏆 IPO tracking
- 📱 Mobile-friendly interface
- ✨ Professional fintech UI

---

## 🚨 TROUBLESHOOTING

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Default: `mongodb://127.0.0.1:27017/stockDB`

### Server Won't Start
- Check port 5000 is not in use: `lsof -i :5000`
- Verify all dependencies: `npm install`
- Check console for specific errors

### Investor Signup Not Working
- ✅ FIXED - Investor model properly exported
- ✅ FIXED - Endpoint validation corrected
- ✅ FIXED - Frontend fetch working
- Check browser console for error messages

### Charts Not Rendering
- Ensure Chart.js loaded: check Network tab
- Verify stock has historicalPrices data
- Check browser console for JS errors

---

## 📝 ENVIRONMENT VARIABLES

```env
# .env file (REQUIRED)
MONGO_URI=mongodb://127.0.0.1:27017/stockDB
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

---

## 🎓 NEXT STEPS

1. ✅ Install & run: `npm install && npm start`
2. ✅ Test investor signup at http://localhost:5000/signup
3. ✅ Login and access dashboards
4. ✅ Add stocks as company
5. ✅ Browse as investor
6. ✅ Monitor MongoDB with compass/atlas

---

## 📦 PRODUCTION DEPLOYMENT

Before deploying:
1. Change JWT_SECRET to strong random value
2. Update MONGO_URI to production MongoDB
3. Set NODE_ENV=production
4. Enable CORS for your domain
5. Use HTTPS/SSL
6. Set up proper logging
7. Configure database backups
8. Use PM2/forever for process management

---

**Built with ❤️ - Professional Stock Trading Platform**
**Time to Market: 5 minutes - Zero Configuration Needed**
