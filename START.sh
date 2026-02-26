#!/bin/bash

# StockFund Platform - Quick Start Script
# Run: bash START.sh

clear
echo "======================================"
echo "  🚀 StockFund Platform Startup"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found in PATH"
    echo "   Make sure MongoDB is running separately"
    echo ""
else
    echo "✅ MongoDB found"
fi

# Check npm
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Check .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found, creating with defaults..."
    cat > .env << EOF
MONGO_URI=mongodb://127.0.0.1:27017/stockDB
JWT_SECRET=your_super_secret_key_change_this_in_production_12345
PORT=5000
NODE_ENV=development
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi
echo ""

# Start server
echo "🚀 Starting StockFund server..."
echo ""
echo "========================================="
echo "  Server starting on http://localhost:5000"
echo "  Press Ctrl+C to stop"
echo "========================================="
echo ""
echo "📊 Next steps:"
echo "  1. Open http://localhost:5000/"
echo "  2. Go to /signup to create account"
echo "  3. Company: Add stocks"
echo "  4. Investor: Browse market"
echo ""
echo "🧪 Test API (in another terminal):"
echo "  node test-api.js"
echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - README_UPGRADED.md"
echo "  - COMPLETE_SUMMARY.md"
echo ""

npm start
