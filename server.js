const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config();

const authRouter = require("./routes/auth");
const companyRouter = require("./routes/company");
const stockRouter = require("./routes/stocks");
const Stock = require("./models/Stock");
const Company = require("./models/Company");
const Investor = require("./models/Investor");

const app = express();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stockDB";
const PORT = process.env.PORT || 5000;

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

function normalizeEmailValue(value) {
  return String(value || "").trim().toLowerCase();
}

async function runStockIndexMigration() {
  try {
    const indexes = await Stock.collection.indexes();
    const companyIdIndex = indexes.find((idx) => idx && idx.name === "companyId_1");
    if (companyIdIndex && companyIdIndex.unique) {
      await Stock.collection.dropIndex("companyId_1");
      await Stock.collection.createIndex({ companyId: 1 }, { name: "companyId_1" });
      console.log("[MIGRATION] Replaced legacy unique companyId index with non-unique index");
    }

    const missingStockSymbolDocs = await Stock.find({
      $or: [{ stockSymbol: { $exists: false } }, { stockSymbol: null }, { stockSymbol: "" }],
    })
      .select("_id")
      .lean();

    if (missingStockSymbolDocs.length) {
      const bulkOps = missingStockSymbolDocs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { stockSymbol: String(doc._id).trim().toUpperCase() } },
        },
      }));

      const result = await Stock.bulkWrite(bulkOps);
      console.log(
        `[MIGRATION] Backfilled stockSymbol for ${result.modifiedCount || 0} stock document(s)`
      );
    }

    const refreshedIndexes = await Stock.collection.indexes();
    const stockSymbolIndex = refreshedIndexes.find(
      (idx) => idx && idx.key && idx.key.stockSymbol === 1
    );

    if (!stockSymbolIndex || !stockSymbolIndex.unique) {
      if (stockSymbolIndex) {
        await Stock.collection.dropIndex(stockSymbolIndex.name);
      }
      await Stock.collection.createIndex(
        { stockSymbol: 1 },
        { name: "stockSymbol_1", unique: true }
      );
      console.log("[MIGRATION] Ensured unique stockSymbol index");
    }
  } catch (error) {
    console.error("[MIGRATION] stockSymbol migration failed:", error.message);
  }
}

async function runAuthRecordMigration() {
  try {
    const defaultRecoveredPassword =
      process.env.MANUAL_DATA_DEFAULT_PASSWORD ||
      process.env.DEFAULT_MANUAL_PASSWORD ||
      "12345678";
    const allowUnsupportedHashRecovery = process.env.NODE_ENV !== "production";

    const targets = [
      { label: "companies", Model: Company, role: "company" },
      { label: "investors", Model: Investor, role: "investor" },
    ];

    for (const target of targets) {
      const records = await target.Model.find({}).select("_id email password role");
      let updatedRecords = 0;
      let hashedPasswords = 0;
      let skippedHashRecords = 0;
      let recoveredUnsupportedHashes = 0;

      for (const record of records) {
        const updates = {};
        const normalizedEmail = normalizeEmailValue(record.email);
        if (normalizedEmail && normalizedEmail !== record.email) {
          updates.email = normalizedEmail;
        }

        if (record.role !== target.role) {
          updates.role = target.role;
        }

        const currentPassword = String(record.password || "");
        if (currentPassword && !isBcryptHash(currentPassword)) {
          if (currentPassword.startsWith("$")) {
            if (allowUnsupportedHashRecovery) {
              updates.password = await bcrypt.hash(defaultRecoveredPassword, 10);
              recoveredUnsupportedHashes += 1;
            } else {
              skippedHashRecords += 1;
            }
          } else {
            updates.password = await bcrypt.hash(currentPassword, 10);
            hashedPasswords += 1;
          }
        }

        if (Object.keys(updates).length) {
          await target.Model.updateOne({ _id: record._id }, { $set: updates });
          updatedRecords += 1;
        }
      }

      console.log(
        `[MIGRATION] ${target.label}: updated ${updatedRecords}, hashed ${hashedPasswords}, recovered ${recoveredUnsupportedHashes}, skipped ${skippedHashRecords} unsupported hash record(s)`
      );
    }
  } catch (error) {
    console.error("[MIGRATION] auth record migration failed:", error.message);
  }
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log(`[AUTH] ${req.method} ${req.path}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected:", MONGO_URI);
    await runStockIndexMigration();
    await runAuthRecordMigration();
  })
  .catch((error) => console.error("MongoDB connection error:", error));

mongoose.connection.on("connected", () => console.log("Mongoose connected"));
mongoose.connection.on("error", (error) => console.error("Mongoose error:", error));
mongoose.connection.on("disconnected", () => console.warn("Mongoose disconnected"));

app.use("/api/auth", authRouter);
app.use("/api/company", companyRouter);
app.use("/api/stocks", stockRouter);

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "public", "signup.html")));

// Company dashboard aliases
app.get(
  [
    "/company-dashboard",
    "/company-dashboard/",
    "/company-dashboard.html",
    "/company-dashboard-pro",
    "/company-dashboard-pro/",
    "/company-dashboard-pro.html",
  ],
  (req, res) => res.sendFile(path.join(__dirname, "public", "company-dashboard-pro.html"))
);

// Investor dashboard aliases
app.get(
  [
    "/investor-dashboard",
    "/investor-dashboard/",
    "/investor-dashboard.html",
    "/investor-dashboard-pro",
    "/investor-dashboard-pro/",
    "/investor-dashboard-pro.html",
  ],
  (req, res) => res.sendFile(path.join(__dirname, "public", "investor-dashboard.html"))
);

// Investor analysis aliases
app.get(
  [
    "/investor-analysis",
    "/investor-analysis/",
    "/investor-analysis.html",
  ],
  (req, res) => res.sendFile(path.join(__dirname, "public", "investor-analysis.html"))
);

// Keep API failures as JSON (do not fall back to index.html for API URLs)
app.use("/api", (req, res) => {
  return res.status(404).json({ success: false, message: "API route not found" });
});

// SPA/static fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
