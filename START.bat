@echo off
REM StockFund Platform - Quick Start Script (Windows)
REM Run: START.bat

cls
echo.
echo ======================================
echo   StockFund Platform Startup
echo ======================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [X] Node.js is not installed
    echo.
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%

REM Check npm
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo [X] npm install failed
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Check .env
if not exist ".env" (
    echo Creating .env file with defaults...
    (
        echo MONGO_URI=mongodb://127.0.0.1:27017/stockDB
        echo JWT_SECRET=your_super_secret_key_change_this_in_production_12345
        echo PORT=5000
        echo NODE_ENV=development
    ) > .env
    echo [OK] .env file created
) else (
    echo [OK] .env file exists
)
echo.

REM Start server
echo.
echo =========================================
echo   Server starting on http://localhost:5000
echo   Press Ctrl+C to stop
echo =========================================
echo.
echo Next steps:
echo   1. Open http://localhost:5000/
echo   2. Go to /signup to create account
echo   3. Company: Add stocks
echo   4. Investor: Browse market
echo.
echo Test API (in another terminal^):
echo   node test-api.js
echo.
echo Documentation:
echo   - DEPLOYMENT_GUIDE.md
echo   - README_UPGRADED.md
echo   - COMPLETE_SUMMARY.md
echo.

call npm start
pause
