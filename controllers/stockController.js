const mongoose = require("mongoose");

const Stock = require("../models/Stock");
const Company = require("../models/Company");

const SORT_FIELD_MAP = {
  price: "currentPrice",
  marketCap: "fundamentals.marketCap",
  volume: "currentVolume",
  peRatio: "fundamentals.peRatio",
};

function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase();
}

function isValidSymbol(value) {
  return /^[A-Z0-9.-]{1,15}$/.test(value);
}

function parseNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseNumberIfProvided(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  return parseNumber(value, fallback);
}

function parseDateIfProvided(value, fallback = null) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function parseStringArray(input, uppercase = false) {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  return raw
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => (uppercase ? item.toUpperCase() : item));
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }
    if (["true", "1", "yes", "y", "active", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n", "inactive", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function withPublicVisibility(baseQuery = {}) {
  const visibility = {
    $or: [
      { isActive: true },
      { isActive: "true" },
      { isActive: 1 },
      { isActive: "1" },
      { isActive: { $exists: false } },
      { isActive: null },
    ],
  };

  if (!baseQuery || !Object.keys(baseQuery).length) {
    return visibility;
  }

  return { $and: [baseQuery, visibility] };
}

function buildSymbolQuery(symbolValue) {
  const raw = String(symbolValue || "").trim();
  if (!raw) {
    return null;
  }

  const normalized = normalizeSymbol(raw);
  const rawPattern = new RegExp(`^\\s*${escapeRegex(raw)}\\s*$`, "i");
  const normalizedPattern = new RegExp(`^\\s*${escapeRegex(normalized)}\\s*$`, "i");

  return {
    $or: [
      { _id: normalized },
      { stockSymbol: normalized },
      { _id: raw },
      { stockSymbol: raw },
      { _id: rawPattern },
      { stockSymbol: rawPattern },
      { _id: normalizedPattern },
      { stockSymbol: normalizedPattern },
    ],
  };
}

function buildCompanyStockQuery(company) {
  const clauses = [];
  const companyId = String((company && (company._id || company.id)) || "").trim();
  if (companyId) {
    clauses.push({ companyId });
    if (mongoose.Types.ObjectId.isValid(companyId)) {
      clauses.push({ companyId: new mongoose.Types.ObjectId(companyId) });
    }
  }

  const companyName = String((company && company.companyName) || "").trim();
  if (companyName) {
    clauses.push({ companyName: new RegExp(`^\\s*${escapeRegex(companyName)}\\s*$`, "i") });
  }

  const companyEmail = String((company && company.email) || "").trim().toLowerCase();
  if (companyEmail) {
    const emailRegex = new RegExp(`^\\s*${escapeRegex(companyEmail)}\\s*$`, "i");
    clauses.push({ companyEmail: emailRegex });
    clauses.push({ email: emailRegex });
  }

  if (!clauses.length) {
    return { companyId: companyId || "" };
  }
  if (clauses.length === 1) {
    return clauses[0];
  }
  return { $or: clauses };
}

function isStockOwnedByCompany(stock, company) {
  const companyId = String((company && (company._id || company.id)) || "").trim();
  const stockCompanyId = String((stock && stock.companyId) || "").trim();
  if (companyId && stockCompanyId && companyId === stockCompanyId) {
    return true;
  }

  const companyName = String((company && company.companyName) || "").trim().toLowerCase();
  const stockCompanyName = String((stock && stock.companyName) || "").trim().toLowerCase();
  if (companyName && stockCompanyName && companyName === stockCompanyName) {
    return true;
  }

  const companyEmail = String((company && company.email) || "").trim().toLowerCase();
  const stockCompanyEmail = String((stock && (stock.companyEmail || stock.email)) || "")
    .trim()
    .toLowerCase();
  if (companyEmail && stockCompanyEmail && companyEmail === stockCompanyEmail) {
    return true;
  }

  return false;
}

function normalizeStockForResponse(stock) {
  const source = stock && typeof stock.toObject === "function" ? stock.toObject() : stock || {};
  const symbol = normalizeSymbol(source.stockSymbol || source._id);

  const normalized = {
    ...source,
    _id: symbol || String(source._id || ""),
    stockSymbol: symbol || String(source.stockSymbol || source._id || ""),
    currentPrice: parseNumber(source.currentPrice, 0),
    currentVolume: parseNumber(source.currentVolume, 0),
    currency: String(source.currency || "USD").trim().toUpperCase() || "USD",
    tags: parseStringArray(source.tags, false),
    listedExchanges: parseStringArray(source.listedExchanges, true),
    isActive: normalizeBoolean(source.isActive, true),
    lastUpdated: parseDateIfProvided(source.lastUpdated, source.updatedAt || source.createdAt || new Date()),
  };

  normalized.priceRange = {
    dayHigh: parseNumber(source.priceRange && source.priceRange.dayHigh, normalized.currentPrice),
    dayLow: parseNumber(source.priceRange && source.priceRange.dayLow, normalized.currentPrice),
    fiftyTwoWeekHigh: parseNumber(
      source.priceRange && source.priceRange.fiftyTwoWeekHigh,
      normalized.currentPrice
    ),
    fiftyTwoWeekLow: parseNumber(
      source.priceRange && source.priceRange.fiftyTwoWeekLow,
      normalized.currentPrice
    ),
  };

  normalized.fundamentals = {
    marketCap: parseNumber(source.fundamentals && source.fundamentals.marketCap, 0),
    peRatio: parseNumber(source.fundamentals && source.fundamentals.peRatio, 0),
    eps: parseNumber(source.fundamentals && source.fundamentals.eps, 0),
    roe: parseNumber(source.fundamentals && source.fundamentals.roe, 0),
  };

  normalized.technicalIndicators = {
    rsi: parseNumber(source.technicalIndicators && source.technicalIndicators.rsi, 0),
    movingAverage50: parseNumber(
      source.technicalIndicators && source.technicalIndicators.movingAverage50,
      normalized.currentPrice
    ),
    movingAverage200: parseNumber(
      source.technicalIndicators && source.technicalIndicators.movingAverage200,
      normalized.currentPrice
    ),
  };

  normalized.dividendHistory = sanitizeDividendHistory(source.dividendHistory);
  normalized.majorShareholders = sanitizeMajorShareholders(source.majorShareholders);
  normalized.historicalPrices = sanitizeHistoricalPrices(source.historicalPrices);

  const ipoDetails = source.ipoDetails || {};
  normalized.ipoDetails = {
    issuePrice: parseNumber(ipoDetails.issuePrice, 0),
    totalShares: parseNumber(ipoDetails.totalShares, 0),
    ipoOpenDate: parseDateIfProvided(ipoDetails.ipoOpenDate, null),
    ipoCloseDate: parseDateIfProvided(ipoDetails.ipoCloseDate, null),
    listingDate: parseDateIfProvided(ipoDetails.listingDate, null),
    status: deriveIpoStatus(ipoDetails),
  };

  return normalized;
}

function sanitizeDividendHistory(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => ({
      year: parseNumber(item && item.year, 0),
      dividendPerShare: parseNumber(item && item.dividendPerShare, 0),
    }))
    .filter((item) => item.year >= 1900 && item.dividendPerShare >= 0);
}

function sanitizeMajorShareholders(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => ({
      name: String((item && item.name) || "").trim(),
      holdingPercent: parseNumber(item && item.holdingPercent, -1),
    }))
    .filter((item) => item.name && item.holdingPercent >= 0 && item.holdingPercent <= 100);
}

function sanitizeHistoricalPrices(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized = input
    .map((entry) => {
      const date = parseDateIfProvided(entry && entry.date, null);
      const price = parseNumber(entry && entry.price, -1);
      const volume = parseNumber(entry && entry.volume, -1);
      return { date, price, volume };
    })
    .filter((entry) => entry.date && entry.price >= 0 && entry.volume >= 0)
    .sort((a, b) => a.date - b.date);

  const dedupedByTimestamp = [];
  const seen = new Set();

  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const entry = normalized[index];
    const key = entry.date.toISOString();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    dedupedByTimestamp.push(entry);
  }

  dedupedByTimestamp.reverse();
  if (dedupedByTimestamp.length > 2000) {
    return dedupedByTimestamp.slice(-2000);
  }
  return dedupedByTimestamp;
}

function deriveIpoStatus(ipoDetails) {
  const issuePrice = parseNumber(ipoDetails && ipoDetails.issuePrice, 0);
  const totalShares = parseNumber(ipoDetails && ipoDetails.totalShares, 0);
  const hasConfiguration = issuePrice > 0 && totalShares > 0;

  const listingDate = parseDateIfProvided(ipoDetails && ipoDetails.listingDate, null);
  const closeDate = parseDateIfProvided(ipoDetails && ipoDetails.ipoCloseDate, null);
  const openDate = parseDateIfProvided(ipoDetails && ipoDetails.ipoOpenDate, null);

  if (listingDate) return "listed";
  if (closeDate) return "closed";
  if (openDate) return "open";
  if (hasConfiguration) return "configured";
  return "draft";
}

function sanitizeStockPayload(payload, existingStock = null) {
  const body = payload || {};
  const errors = [];

  const sector =
    body.sector !== undefined
      ? String(body.sector || "").trim()
      : existingStock
      ? existingStock.sector
      : "";

  if (!sector) {
    errors.push("Sector is required");
  }

  const incomingCurrentPrice =
    body.currentPrice !== undefined ? body.currentPrice : body.price;
  const currentPrice = parseNumberIfProvided(
    incomingCurrentPrice,
    existingStock ? existingStock.currentPrice : NaN
  );
  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    errors.push("currentPrice must be a valid non-negative number");
  }

  const incomingCurrentVolume =
    body.currentVolume !== undefined ? body.currentVolume : body.volume;
  const currentVolume = parseNumberIfProvided(
    incomingCurrentVolume,
    existingStock ? existingStock.currentVolume : 0
  );
  if (!Number.isFinite(currentVolume) || currentVolume < 0) {
    errors.push("currentVolume must be a valid non-negative number");
  }

  const currency =
    body.currency !== undefined
      ? String(body.currency || "").trim().toUpperCase()
      : existingStock
      ? existingStock.currency
      : "USD";

  const mergedPriceRange = {
    dayHigh: parseNumberIfProvided(
      body.priceRange && body.priceRange.dayHigh,
      existingStock ? existingStock.priceRange && existingStock.priceRange.dayHigh : currentPrice
    ),
    dayLow: parseNumberIfProvided(
      body.priceRange && body.priceRange.dayLow,
      existingStock ? existingStock.priceRange && existingStock.priceRange.dayLow : currentPrice
    ),
    fiftyTwoWeekHigh: parseNumberIfProvided(
      body.priceRange && body.priceRange.fiftyTwoWeekHigh,
      existingStock
        ? existingStock.priceRange && existingStock.priceRange.fiftyTwoWeekHigh
        : currentPrice
    ),
    fiftyTwoWeekLow: parseNumberIfProvided(
      body.priceRange && body.priceRange.fiftyTwoWeekLow,
      existingStock ? existingStock.priceRange && existingStock.priceRange.fiftyTwoWeekLow : currentPrice
    ),
  };

  const mergedFundamentals = {
    marketCap: parseNumberIfProvided(
      body.fundamentals && body.fundamentals.marketCap !== undefined
        ? body.fundamentals.marketCap
        : body.marketCap,
      existingStock ? existingStock.fundamentals && existingStock.fundamentals.marketCap : 0
    ),
    peRatio: parseNumberIfProvided(
      body.fundamentals && body.fundamentals.peRatio,
      existingStock ? existingStock.fundamentals && existingStock.fundamentals.peRatio : 0
    ),
    eps: parseNumberIfProvided(
      body.fundamentals && body.fundamentals.eps,
      existingStock ? existingStock.fundamentals && existingStock.fundamentals.eps : 0
    ),
    roe: parseNumberIfProvided(
      body.fundamentals && body.fundamentals.roe,
      existingStock ? existingStock.fundamentals && existingStock.fundamentals.roe : 0
    ),
  };

  if (mergedFundamentals.marketCap < 0) {
    errors.push("Market cap must be non-negative");
  }
  if (mergedFundamentals.peRatio < 0) {
    errors.push("P/E ratio must be non-negative");
  }

  const mergedTechnicalIndicators = {
    rsi: parseNumberIfProvided(
      body.technicalIndicators && body.technicalIndicators.rsi,
      existingStock
        ? existingStock.technicalIndicators && existingStock.technicalIndicators.rsi
        : 0
    ),
    movingAverage50: parseNumberIfProvided(
      body.technicalIndicators && body.technicalIndicators.movingAverage50,
      existingStock
        ? existingStock.technicalIndicators && existingStock.technicalIndicators.movingAverage50
        : currentPrice
    ),
    movingAverage200: parseNumberIfProvided(
      body.technicalIndicators && body.technicalIndicators.movingAverage200,
      existingStock
        ? existingStock.technicalIndicators && existingStock.technicalIndicators.movingAverage200
        : currentPrice
    ),
  };
  if (mergedTechnicalIndicators.rsi < 0 || mergedTechnicalIndicators.rsi > 100) {
    errors.push("RSI must be between 0 and 100");
  }

  const baseIpoDetails = existingStock && existingStock.ipoDetails
    ? existingStock.ipoDetails
    : {
        issuePrice: 0,
        totalShares: 0,
        ipoOpenDate: null,
        ipoCloseDate: null,
        listingDate: null,
        status: "draft",
      };
  const incomingIpoDetails = body.ipoDetails || {};
  const mergedIpoDetails = {
    issuePrice: parseNumberIfProvided(incomingIpoDetails.issuePrice, baseIpoDetails.issuePrice),
    totalShares: parseNumberIfProvided(incomingIpoDetails.totalShares, baseIpoDetails.totalShares),
    ipoOpenDate: parseDateIfProvided(incomingIpoDetails.ipoOpenDate, baseIpoDetails.ipoOpenDate),
    ipoCloseDate: parseDateIfProvided(incomingIpoDetails.ipoCloseDate, baseIpoDetails.ipoCloseDate),
    listingDate: parseDateIfProvided(incomingIpoDetails.listingDate, baseIpoDetails.listingDate),
    status: "draft",
  };
  mergedIpoDetails.status = deriveIpoStatus(mergedIpoDetails);

  if (mergedIpoDetails.issuePrice < 0 || mergedIpoDetails.totalShares < 0) {
    errors.push("IPO issuePrice and totalShares must be non-negative");
  }
  if (
    mergedIpoDetails.ipoOpenDate &&
    mergedIpoDetails.ipoCloseDate &&
    mergedIpoDetails.ipoOpenDate > mergedIpoDetails.ipoCloseDate
  ) {
    errors.push("IPO open date cannot be after close date");
  }

  const tags =
    body.tags !== undefined
      ? parseStringArray(body.tags, false)
      : existingStock
      ? existingStock.tags
      : [];

  const listedExchanges =
    body.listedExchanges !== undefined
      ? parseStringArray(body.listedExchanges, true)
      : existingStock
      ? existingStock.listedExchanges
      : [];

  const dividendHistory =
    body.dividendHistory !== undefined
      ? sanitizeDividendHistory(body.dividendHistory)
      : existingStock
      ? existingStock.dividendHistory
      : [];

  const majorShareholders =
    body.majorShareholders !== undefined
      ? sanitizeMajorShareholders(body.majorShareholders)
      : existingStock
      ? existingStock.majorShareholders
      : [];

  const historicalPrices =
    body.historicalPrices !== undefined
      ? sanitizeHistoricalPrices(body.historicalPrices)
      : existingStock
      ? existingStock.historicalPrices
      : [];

  const shouldActivate =
    mergedIpoDetails.status === "listed"
      ? true
      : body.isActive !== undefined
      ? Boolean(body.isActive)
      : existingStock
      ? existingStock.isActive
      : true;

  const normalized = {
    sector,
    currentPrice,
    currentVolume,
    currency: currency || "USD",
    tags,
    priceRange: mergedPriceRange,
    fundamentals: mergedFundamentals,
    dividendHistory,
    technicalIndicators: mergedTechnicalIndicators,
    majorShareholders,
    listedExchanges,
    ipoDetails: mergedIpoDetails,
    historicalPrices,
    isActive: shouldActivate,
  };

  if (normalized.priceRange.dayLow > normalized.priceRange.dayHigh) {
    errors.push("dayLow cannot be greater than dayHigh");
  }
  if (normalized.priceRange.fiftyTwoWeekLow > normalized.priceRange.fiftyTwoWeekHigh) {
    errors.push("fiftyTwoWeekLow cannot be greater than fiftyTwoWeekHigh");
  }

  return { normalized, errors };
}

function appendHistoryPoint(stockDoc, date = new Date()) {
  stockDoc.historicalPrices.push({
    date,
    price: stockDoc.currentPrice,
    volume: stockDoc.currentVolume,
  });

  if (stockDoc.historicalPrices.length > 2000) {
    stockDoc.historicalPrices = stockDoc.historicalPrices.slice(-2000);
  }
}

async function getCompanyContext(req) {
  if (req.userInfo && req.userInfo.companyName) {
    return req.userInfo;
  }

  return Company.findById(req.user.id).select("companyName foundedYear email");
}

exports.createStock = async (req, res) => {
  console.log("createStock payload keys:", Object.keys(req.body || {}));
  let stockSymbol = "";
  try {
    stockSymbol = normalizeSymbol(
      req.body && (req.body.stockSymbol || req.body.symbol || req.body._id)
    );
    if (!stockSymbol || !isValidSymbol(stockSymbol)) {
      return res.status(400).json({
        success: false,
        message: "Valid stockSymbol is required (A-Z, 0-9, . or -)",
      });
    }

    const company = await getCompanyContext(req);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company profile not found" });
    }

    const { normalized, errors } = sanitizeStockPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(", ") });
    }

    const existing = await Stock.findOne(buildSymbolQuery(stockSymbol)).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: "Stock symbol already exists" });
    }

    const foundedYear = Number.isInteger(Number(company.foundedYear))
      ? Number(company.foundedYear)
      : new Date().getFullYear();

    const stock = new Stock({
      _id: stockSymbol,
      stockSymbol,
      companyId: req.user.id,
      companyName: company.companyName,
      foundedYear,
      ...normalized,
      historicalPrices: normalized.historicalPrices,
    });

    if (!stock.historicalPrices.length) {
      appendHistoryPoint(stock);
    }

    await stock.save();
    console.log("createStock success:", stock._id);
    return res.status(201).json({
      success: true,
      message: "Stock created successfully",
      stock: normalizeStockForResponse(stock),
    });
  } catch (error) {
    console.error("createStock error:", error);
    if (error && error.code === 11000) {
      const duplicateField = Object.keys((error && error.keyPattern) || {})[0];
      if (duplicateField === "companyId") {
        return res.status(409).json({
          success: false,
          message: "This company is blocked by a legacy DB index. Restart server to run migration.",
        });
      }
      return res.status(409).json({
        success: false,
        message: `Stock symbol ${stockSymbol || ""} already exists`,
      });
    }
    return res.status(500).json({ success: false, message: "Failed to create stock" });
  }
};

exports.getMyStocks = async (req, res) => {
  try {
    const company = await getCompanyContext(req);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company profile not found" });
    }

    const query = buildCompanyStockQuery(company);
    const stocks = await Stock.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      stocks: stocks.map((item) => normalizeStockForResponse(item)),
    });
  } catch (error) {
    console.error("getMyStocks error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stocks" });
  }
};

exports.updateStock = async (req, res) => {
  console.log("updateStock target:", req.params.id, "payload keys:", Object.keys(req.body || {}));
  try {
    const stockSymbol = String(req.params.id || "").trim();
    if (!stockSymbol) {
      return res.status(400).json({ success: false, message: "Invalid stock id/symbol" });
    }

    const symbolQuery = buildSymbolQuery(stockSymbol);
    if (!symbolQuery) {
      return res.status(400).json({ success: false, message: "Invalid stock id/symbol" });
    }

    const company = await getCompanyContext(req);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company profile not found" });
    }

    const stock = await Stock.findOne(symbolQuery);
    if (!stock) {
      return res.status(404).json({ success: false, message: "Stock not found" });
    }

    if (!isStockOwnedByCompany(stock, company)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { normalized, errors } = sanitizeStockPayload(req.body, stock);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(", ") });
    }

    stock.sector = normalized.sector;
    stock.currentPrice = normalized.currentPrice;
    stock.currentVolume = normalized.currentVolume;
    stock.currency = normalized.currency;
    stock.tags = normalized.tags;
    stock.priceRange = normalized.priceRange;
    stock.fundamentals = normalized.fundamentals;
    stock.dividendHistory = normalized.dividendHistory;
    stock.technicalIndicators = normalized.technicalIndicators;
    stock.majorShareholders = normalized.majorShareholders;
    stock.listedExchanges = normalized.listedExchanges;
    stock.ipoDetails = normalized.ipoDetails;
    stock.isActive = normalized.isActive;

    if (req.body && req.body.historicalPrices !== undefined) {
      stock.historicalPrices = normalized.historicalPrices;
    }
    appendHistoryPoint(stock);
    stock.lastUpdated = new Date();

    await stock.save();
    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      stock: normalizeStockForResponse(stock),
    });
  } catch (error) {
    console.error("updateStock error:", error);
    return res.status(500).json({ success: false, message: "Failed to update stock" });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    const stockSymbol = String(req.params.id || "").trim();
    if (!stockSymbol) {
      return res.status(400).json({ success: false, message: "Invalid stock id/symbol" });
    }

    const symbolQuery = buildSymbolQuery(stockSymbol);
    if (!symbolQuery) {
      return res.status(400).json({ success: false, message: "Invalid stock id/symbol" });
    }

    const company = await getCompanyContext(req);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company profile not found" });
    }

    const stock = await Stock.findOne(symbolQuery);
    if (!stock) {
      return res.status(404).json({ success: false, message: "Stock not found" });
    }

    if (!isStockOwnedByCompany(stock, company)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await stock.deleteOne();
    return res.status(200).json({ success: true, message: "Stock deleted" });
  } catch (error) {
    console.error("deleteStock error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete stock" });
  }
};

exports.getStockAnalytics = async (req, res) => {
  try {
    const company = await getCompanyContext(req);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company profile not found" });
    }

    const stocks = await Stock.find(buildCompanyStockQuery(company));
    const normalizedStocks = stocks.map((item) => normalizeStockForResponse(item));
    const totalStocks = normalizedStocks.length;
    const activeStocks = normalizedStocks.filter((stock) => stock.isActive).length;
    const totalPrice = normalizedStocks.reduce((sum, stock) => sum + parseNumber(stock.currentPrice, 0), 0);
    const totalMarketCap = normalizedStocks.reduce(
      (sum, stock) => sum + parseNumber(stock.fundamentals && stock.fundamentals.marketCap, 0),
      0
    );
    const totalPeRatio = normalizedStocks.reduce(
      (sum, stock) => sum + parseNumber(stock.fundamentals && stock.fundamentals.peRatio, 0),
      0
    );
    const totalVolume = normalizedStocks.reduce(
      (sum, stock) => sum + parseNumber(stock.currentVolume, 0),
      0
    );
    const divisor = totalStocks || 1;

    return res.status(200).json({
      success: true,
      stats: {
        totalStocks,
        activeStocks,
        averagePrice: Number((totalPrice / divisor).toFixed(2)),
        totalMarketCap: Number(totalMarketCap.toFixed(2)),
        averagePeRatio: Number((totalPeRatio / divisor).toFixed(2)),
        totalVolume: Number(totalVolume.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("getStockAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

exports.getAllStocks = async (req, res) => {
  try {
    const query = {};
    const search = String(req.query.search || "").trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ _id: regex }, { stockSymbol: regex }, { companyName: regex }];
    }

    const stocks = await Stock.find(query).sort({ createdAt: -1 });
    const normalizedStocks = stocks
      .map((item) => normalizeStockForResponse(item))
      .filter((item) => item.isActive)
      .sort((a, b) => String(a._id).localeCompare(String(b._id)));
    return res.status(200).json({ success: true, stocks: normalizedStocks });
  } catch (error) {
    console.error("getAllStocks error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stocks" });
  }
};

exports.getStockBySymbol = async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim();
    const symbolQuery = buildSymbolQuery(symbol);
    if (!symbolQuery) {
      return res.status(400).json({ success: false, message: "Invalid stock symbol" });
    }

    const stock = await Stock.findOne(symbolQuery);
    if (!stock) {
      return res.status(404).json({ success: false, message: "Stock not found" });
    }

    const normalizedStock = normalizeStockForResponse(stock);
    if (!normalizedStock.isActive) {
      return res.status(404).json({ success: false, message: "Stock not found" });
    }

    return res.status(200).json({ success: true, stock: normalizedStock });
  } catch (error) {
    console.error("getStockBySymbol error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stock" });
  }
};

exports.getStockHistory = async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim();
    const symbolQuery = buildSymbolQuery(symbol);
    if (!symbolQuery) {
      return res.status(400).json({ success: false, message: "Invalid stock symbol" });
    }

    const stock = await Stock.findOne(symbolQuery).select(
      "_id stockSymbol historicalPrices technicalIndicators"
    );
    if (!stock) {
      return res.status(404).json({ success: false, message: "Stock not found" });
    }

    const normalizedStock = normalizeStockForResponse(stock);
    if (!normalizedStock.isActive) {
      return res.status(404).json({ success: false, message: "Stock not found" });
    }
    return res.status(200).json({
      success: true,
      symbol: normalizedStock.stockSymbol || normalizedStock._id,
      history: normalizedStock.historicalPrices,
      technicalIndicators: normalizedStock.technicalIndicators,
    });
  } catch (error) {
    console.error("getStockHistory error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
};

exports.filterStocks = async (req, res) => {
  try {
    const query = {};
    const search = String(req.query.search || "").trim();
    const sector = String(req.query.sector || "").trim();
    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
    const minMarketCap =
      req.query.minMarketCap !== undefined ? Number(req.query.minMarketCap) : undefined;
    const maxMarketCap =
      req.query.maxMarketCap !== undefined ? Number(req.query.maxMarketCap) : undefined;
    const tags = parseStringArray(req.query.tags, false);

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ _id: regex }, { stockSymbol: regex }, { companyName: regex }];
    }

    if (sector) {
      query.sector = new RegExp(`^${sector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const stocks = await Stock.find(query).sort({ createdAt: -1 });
    const normalizedStocks = stocks.map((item) => normalizeStockForResponse(item));
    const normalizedTags = tags.map((tag) => tag.toLowerCase());

    const filteredStocks = normalizedStocks.filter((stock) => {
      if (!stock.isActive) return false;

      const price = parseNumber(stock.currentPrice, 0);
      const marketCap = parseNumber(stock.fundamentals && stock.fundamentals.marketCap, 0);

      if (Number.isFinite(minPrice) && price < minPrice) return false;
      if (Number.isFinite(maxPrice) && price > maxPrice) return false;
      if (Number.isFinite(minMarketCap) && marketCap < minMarketCap) return false;
      if (Number.isFinite(maxMarketCap) && marketCap > maxMarketCap) return false;

      if (normalizedTags.length) {
        const stockTags = parseStringArray(stock.tags || [], false).map((tag) => tag.toLowerCase());
        if (!normalizedTags.some((tag) => stockTags.includes(tag))) {
          return false;
        }
      }

      return true;
    });

    return res.status(200).json({
      success: true,
      stocks: filteredStocks.sort((a, b) => String(a._id).localeCompare(String(b._id))),
    });
  } catch (error) {
    console.error("filterStocks error:", error);
    return res.status(500).json({ success: false, message: "Failed to filter stocks" });
  }
};

exports.sortStocks = async (req, res) => {
  try {
    const field = String(req.query.field || "").trim();
    const order = String(req.query.order || "asc").toLowerCase() === "desc" ? -1 : 1;

    if (!SORT_FIELD_MAP[field]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field. Use price, marketCap, volume, peRatio",
      });
    }

    const stocks = await Stock.find({});
    const normalizedStocks = stocks
      .map((item) => normalizeStockForResponse(item))
      .filter((item) => item.isActive);

    const sortedStocks = normalizedStocks.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      if (field === "price") {
        aValue = parseNumber(a.currentPrice, 0);
        bValue = parseNumber(b.currentPrice, 0);
      } else if (field === "marketCap") {
        aValue = parseNumber(a.fundamentals && a.fundamentals.marketCap, 0);
        bValue = parseNumber(b.fundamentals && b.fundamentals.marketCap, 0);
      } else if (field === "volume") {
        aValue = parseNumber(a.currentVolume, 0);
        bValue = parseNumber(b.currentVolume, 0);
      } else if (field === "peRatio") {
        aValue = parseNumber(a.fundamentals && a.fundamentals.peRatio, 0);
        bValue = parseNumber(b.fundamentals && b.fundamentals.peRatio, 0);
      }

      if (aValue === bValue) {
        return String(a._id).localeCompare(String(b._id));
      }
      return order === 1 ? aValue - bValue : bValue - aValue;
    });

    return res.status(200).json({ success: true, stocks: sortedStocks });
  } catch (error) {
    console.error("sortStocks error:", error);
    return res.status(500).json({ success: false, message: "Failed to sort stocks" });
  }
};
