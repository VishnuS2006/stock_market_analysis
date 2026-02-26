#!/usr/bin/env node

/**
 * Quick Test Script for StockFund Platform
 * Run: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
let TOKEN = null;

async function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (TOKEN) {
            options.headers.Authorization = `Bearer ${TOKEN}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('StockFund Platform - API Test Suite\n');

    try {
        const runId = Date.now();
        const investorEmail = `investor${runId}@test.com`;
        const companyEmail = `company${runId}@test.com`;
        const registrationNumber = `REG${runId}`;
        const stockSymbol = `T${String(runId).slice(-6)}`;

        console.log('1) Testing Investor Signup...');
        const investorSignupRes = await makeRequest('POST', '/auth/signup/investor', {
            fullName: 'Test Investor',
            email: investorEmail,
            password: 'Test123!@#',
            confirmPassword: 'Test123!@#',
            phone: '+1234567890',
            investorType: 'Individual',
            investmentRange: '$50K-$100K',
            preferredIndustry: 'Technology',
            experienceLevel: 'Intermediate',
        });

        if (investorSignupRes.status === 201) {
            console.log('PASS Investor signup successful\n');
        } else {
            console.log('FAIL Investor signup failed:', investorSignupRes.data, '\n');
        }

        console.log('2) Testing Company Signup...');
        const companySignupRes = await makeRequest('POST', '/auth/signup/company', {
            companyName: 'Test Corp',
            email: companyEmail,
            password: 'Test123!@#',
            confirmPassword: 'Test123!@#',
            registrationNumber,
            industry: 'Technology',
            foundedYear: 2020,
            fundingNeeded: '$500K-$1M',
            equityOffered: 10,
        });

        if (companySignupRes.status === 201) {
            console.log('PASS Company signup successful\n');
        } else {
            console.log('FAIL Company signup failed:', companySignupRes.data, '\n');
        }

        console.log('3) Testing Login...');
        const loginRes = await makeRequest('POST', '/auth/login', {
            email: companyEmail,
            password: 'Test123!@#',
        });

        if (loginRes.status === 200 && loginRes.data.token) {
            TOKEN = loginRes.data.token;
            console.log('PASS Login successful, token acquired\n');
        } else {
            console.log('FAIL Login failed:', loginRes.data, '\n');
        }

        console.log('4) Testing Get Company Profile...');
        const profileRes = await makeRequest('GET', '/company/profile');

        if (profileRes.status === 200) {
            console.log('PASS Profile retrieved:', profileRes.data.profile.companyName, '\n');
        } else {
            console.log('FAIL Profile retrieval failed:', profileRes.data, '\n');
        }

        console.log('5) Testing Create Stock...');
        const stockRes = await makeRequest('POST', '/stocks', {
            stockSymbol,
            companyName: 'Test Corp',
            sector: 'Technology',
            isActive: true,
            foundedYear: 2020,
            currentPrice: 150.5,
            currentVolume: 1000000,
            fundamentals: {
                marketCap: 1500000000,
                peRatio: 25.5,
                eps: 5.9,
            },
            tags: ['tech', 'growth'],
            historicalPrices: [
                { date: '2025-01-01', price: 145.2, volume: 900000 },
                { date: '2025-01-02', price: 148.1, volume: 950000 },
            ],
        });

        if (stockRes.status === 201) {
            console.log('PASS Stock created successfully\n');
        } else {
            console.log('FAIL Stock creation failed:', stockRes.data, '\n');
        }

        console.log('6) Testing Get Company Stocks...');
        const myStocksRes = await makeRequest('GET', '/stocks/my');

        if (myStocksRes.status === 200) {
            console.log('PASS Retrieved', myStocksRes.data.stocks?.length || 0, 'stocks\n');
        } else {
            console.log('FAIL Failed to get stocks:', myStocksRes.data, '\n');
        }

        console.log('7) Testing Public Get All Stocks...');
        TOKEN = null;
        const allStocksRes = await makeRequest('GET', '/stocks/all');

        if (allStocksRes.status === 200) {
            console.log('PASS Retrieved', allStocksRes.data.stocks?.length || 0, 'public stocks\n');
        } else {
            console.log('FAIL Failed to get stocks:', allStocksRes.data, '\n');
        }

        console.log('All tests completed.');
        console.log('\nNext steps:');
        console.log('1. Open http://localhost:5000/ in browser');
        console.log('2. Go to signup page and create accounts');
        console.log('3. Test dashboards with your data');
        console.log('4. Check MongoDB for stored documents');
    } catch (error) {
        console.error('FAIL Test error:', error.message);
        console.log('\nMake sure:');
        console.log('1. Server is running: npm start');
        console.log('2. MongoDB is running locally');
        console.log('3. Port 5000 is available');
    }
}

test();
