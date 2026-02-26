# 📈 StockFund - Professional IPO & Stock Listing Platform

A full-featured, professional-grade stock trading platform with real-time data visualization, IPO management, and advanced analytics. Built with modern fintech UI design.

## ✨ Features

### 🏢 Company Dashboard
- **Stock Management**: Add, edit, delete multiple stocks
- **IPO Workflow**: Track stocks from draft → configured → open → closed → listed
- **Real-time Analytics**: Chart.js visualizations for price trends and volume
- **Company Profile**: Manage company information and branding
- **Advanced Stock Data**: Full fundamentals, technical indicators, dividend history, shareholders

### 👨‍💼 Investor Dashboard
- **Stock Browsing**: Search, filter, and sort from all listed stocks
- **Advanced Filtering**:
  - By sector, price range, market cap
  - By P/E ratio, fundamental metrics
  - By tags and exchanges
- **Detailed Stock Views**: Modal with full company data and charts
- **Historical Charts**: Price trends with real MongoDB data
- **IPO Tracking**: Monitor initial public offerings

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based auth (24h expiry)
- **Role-Based Access**: Company vs Investor roles
- **Password Security**: bcrypt hashing (10 salt rounds)
- **Input Validation**: Comprehensive sanitization
- **Protected Routes**: Company endpoints require authentication

### 🎨 Professional Fintech UI
- **Dark Theme**: Modern dark gradient backgrounds
- **Glass Morphism**: Frosted glass card effects
- **Glow Effects**: Interactive button animations
- **Responsive**: Mobile, tablet, desktop optimized
- **Smooth Animations**: CSS animations with Animate.css
- **Chart Integration**: Chart.js for data visualization

## 🚀 Quick Start (5 minutes)

### Requirements
- Node.js 16+
- MongoDB 4.0+
- npm v7+

### Installation

```bash
# Navigate to project
cd stock_analysis

# Install dependencies
npm install

# Start the server
npm start

# Open browser
# http://localhost:5000
```

### Default Credentials
```
MongoDB: mongodb://127.0.0.1:27017/stockDB
Server: http://localhost:5000
JWT_SECRET: Configured in .env (auto-generated)
```

## 📁 Project Structure

```
stock_analysis/
├── .env                              # Configuration (auto-created)
├── package.json                      # Dependencies
├── server.js                         # Express server
├── DEPLOYMENT_GUIDE.md              # Complete setup guide
├── test-api.js                      # API test script
│
├── models/
│   ├── Company.js                   # Company accounts
│   ├── Investor.js                  # Investor accounts (FIXED)
│   ├── Stock.js                     # Advanced stock schema
│   └── StockHistory.js              # Historical tracking
│
├── controllers/
│   ├── authController.js            # Auth logic (signup/login)
│   ├── companyController.js         # Company profile
│   └── stockController.js           # Stock operations
│
├── routes/
│   ├── auth.js                      # Auth endpoints
│   ├── company.js                   # Company endpoints
│   └── stocks.js                    # Stock endpoints
│
├── middleware/
│   └── auth.js                      # JWT verification
│
└── public/                           # Frontend
    ├── index.html                   # Landing page
    ├── signup.html                  # Signup form
    ├── login.html                   # Login form
    ├── company-dashboard-pro.html   # Company portal
    ├── company-dashboard-pro.js
    ├── investor-dashboard-pro.html  # Investor portal
    ├── investor-dashboard-pro.js
    ├── auth.js                      # Auth logic (FIXED)
    └── style.css                    # Styles
```

## 🔧 What's Been Fixed & Upgraded

### ✅ CRITICAL FIXES
- **Investor Signup**: Now fully functional with all validations
- **MongoDB Integration**: Proper connection and data persistence
- **Frontend-Backend Sync**: Corrected API endpoint calls

### ✅ ADVANCED FEATURES
- **Stock Schema**: Full IPO details, fundamentals, technical indicators
- **Multi-stock Management**: Companies can add unlimited stocks
- **IPO Workflow**: Complete tracking from draft to listing
- **Analytics**: Real-time charts with MongoDB data
- **Professional UI**: Modern fintech design throughout

## 🎯 Core Endpoints

### Authentication
```
POST   /api/auth/signup/company      Company registration
POST   /api/auth/signup/investor     Investor registration (FIXED)
POST   /api/auth/login               Login for both roles
```

### Company (Protected)
```
GET    /api/company/profile          Get company profile
PUT    /api/company/profile          Update company profile
```

### Stock Management (Company Protected)
```
POST   /api/stocks                   Create new stock
GET    /api/stocks/my                List company's stocks
GET    /api/stocks/:symbol           Get specific stock
PUT    /api/stocks/:symbol           Update stock
DELETE /api/stocks/:symbol           Delete stock
GET    /api/stocks/analytics         Get company analytics
```

### Stock Data (Public)
```
GET    /api/stocks/all               All listed stocks
GET    /api/stocks/filter            Filter by criteria
GET    /api/stocks/sort              Sort stocks
GET    /api/stocks/history/:symbol   Historical prices
GET    /api/stocks/:symbol           Stock details
```

## 📊 Advanced Stock Schema

Each stock contains:
```javascript
{
  _id: "AAPL",                        // Symbol
  companyId: ObjectId,
  companyName: "Apple Inc.",
  sector: "Technology",
  isActive: true,
  currentPrice: 150.25,
  currentVolume: 1000000,
  
  priceRange: {
    dayHigh, dayLow,
    fiftyTwoWeekHigh, fiftyTwoWeekLow
  },
  
  fundamentals: {
    marketCap, peRatio, eps, roe
  },
  
  dividendHistory: [
    { year, dividendPerShare }
  ],
  
  technicalIndicators: {
    rsi, movingAverage50, movingAverage200
  },
  
  majorShareholders: [
    { name, holdingPercent }
  ],
  
  listedExchanges: ["NASDAQ"],
  
  ipoDetails: {
    issuePrice: 22.00,
    totalShares: 100000000,
    ipoOpenDate, ipoCloseDate, listingDate,
    status: "draft|configured|open|closed|listed"
  },
  
  historicalPrices: [
    { date, price, volume }
  ]
}
```

## 🧪 Testing

### Test Investor Signup (FIXED)
```bash
curl -X POST http://localhost:5000/api/auth/signup/investor \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "phone": "+1234567890",
    "investorType": "Individual",
    "investmentRange": "$50K-$100K",
    "preferredIndustry": "Technology",
    "experienceLevel": "Intermediate"
  }'
```

### Run Full Test Suite
```bash
node test-api.js
```

## 📈 Dashboard Features

### Company Dashboard
- 📊 Stock statistics (count, market cap, avg price)
- ➕ Add new stocks with full details
- 📋 Stock table with quick actions
- ✏️ Edit/Delete stocks
- 📈 Price and volume charts
- 🚀 IPO management interface
- 👤 Company profile editor

### Investor Dashboard
- 🔍 Advanced search and filtering
- 🎯 Multi-criteria sorting
- 📋 Professional stock table
- 📊 Detailed stock modals with charts
- 💹 Historical price visualizations
- 🏆 IPO status tracking
- 📱 Fully responsive design

## 🔒 Security Implementation

- JWT tokens with 24h expiration
- bcrypt password hashing (10 rounds)
- Email uniqueness enforcement
- Role-based access control
- Input validation & sanitization
- Protected API endpoints
- Error handling with logging
- CORS enabled

## 🚀 Deployment

### Production Checklist
- [ ] Change JWT_SECRET to strong random value
- [ ] Update MONGO_URI to production database
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure domain CORS
- [ ] Set up database backups
- [ ] Use PM2 or similar for process management
- [ ] Configure logging service
- [ ] Set up monitoring

### Deploy to Heroku
```bash
heroku create stockfund-app
heroku config:set MONGO_URI=<your_mongodb_uri>
heroku config:set JWT_SECRET=<strong_random_key>
git push heroku main
```

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md**: Complete setup and API documentation
- **API_DOCUMENTATION.md**: Detailed endpoint specs
- **IMPLEMENTATION_GUIDE.md**: Feature implementation details
- **test-api.js**: Automated API testing

## 🐛 Troubleshooting

### Server Won't Start
1. Check MongoDB is running
2. Verify port 5000 is available
3. Run `npm install` again
4. Check .env file exists and is valid

### Investor Signup Not Working
✅ **FIXED** - Check:
1. All required fields filled
2. Password is 6+ characters
3. Passwords match
4. Email not already registered
5. Browser console for specific errors

### Charts Not Rendering
1. Ensure Chart.js is loaded
2. Verify stock has historicalPrices data
3. Check browser console for errors
4. Clear browser cache

## 📞 Support

For issues or questions:
1. Check DEPLOYMENT_GUIDE.md
2. Review browser console for errors
3. Check server logs
4. Verify MongoDB connection
5. Run test-api.js for diagnostics

## 📄 License

MIT - Feel free to use and modify!

## 🎯 Future Enhancements

- WebSocket for real-time updates
- Advanced charting library
- Trading simulator
- Portfolio tracking
- News integration
- Technical analysis tools
- Mobile native apps
- API rate limiting
- Email notifications
- User watchlists

---

**Built with ❤️ for modern fintech platforms**

Professional • Scalable • Secure • Fast
