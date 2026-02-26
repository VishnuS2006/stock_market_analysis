const mongoose = require("mongoose");

const priceRangeSchema = new mongoose.Schema(
    {
        dayHigh: { type: Number, min: 0, default: 0 },
        dayLow: { type: Number, min: 0, default: 0 },
        fiftyTwoWeekHigh: { type: Number, min: 0, default: 0 },
        fiftyTwoWeekLow: { type: Number, min: 0, default: 0 },
    },
    { _id: false }
);

const fundamentalsSchema = new mongoose.Schema(
    {
        marketCap: { type: Number, min: 0, default: 0 },
        peRatio: { type: Number, min: 0, default: 0 },
        eps: { type: Number, default: 0 },
        roe: { type: Number, default: 0 },
    },
    { _id: false }
);

const dividendHistorySchema = new mongoose.Schema(
    {
        year: { type: Number, required: true, min: 1900 },
        dividendPerShare: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const technicalIndicatorsSchema = new mongoose.Schema(
    {
        rsi: { type: Number, min: 0, max: 100, default: 0 },
        movingAverage50: { type: Number, min: 0, default: 0 },
        movingAverage200: { type: Number, min: 0, default: 0 },
    },
    { _id: false }
);

const majorShareholderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        holdingPercent: { type: Number, required: true, min: 0, max: 100 },
    },
    { _id: false }
);

const ipoDetailsSchema = new mongoose.Schema(
    {
        issuePrice: { type: Number, min: 0, default: 0 },
        totalShares: { type: Number, min: 0, default: 0 },
        ipoOpenDate: { type: Date, default: null },
        ipoCloseDate: { type: Date, default: null },
        listingDate: { type: Date, default: null },
        status: {
            type: String,
            enum: ["draft", "configured", "open", "closed", "listed"],
            default: "draft",
        },
    },
    { _id: false }
);

const historicalPriceSchema = new mongoose.Schema(
    {
        date: { type: Date, required: true, default: Date.now },
        price: { type: Number, required: true, min: 0 },
        volume: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const stockSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        stockSymbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            unique: true,
            index: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },
        companyName: { type: String, required: true, trim: true },
        sector: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: false, index: true },
        foundedYear: { type: Number, required: true, min: 1800 },
        currentPrice: { type: Number, required: true, min: 0 },
        currentVolume: { type: Number, required: true, min: 0, default: 0 },
        currency: { type: String, default: "USD", uppercase: true, trim: true },
        tags: [{ type: String, trim: true }],
        priceRange: { type: priceRangeSchema, default: () => ({}) },
        fundamentals: { type: fundamentalsSchema, default: () => ({}) },
        dividendHistory: { type: [dividendHistorySchema], default: [] },
        technicalIndicators: { type: technicalIndicatorsSchema, default: () => ({}) },
        majorShareholders: { type: [majorShareholderSchema], default: [] },
        listedExchanges: { type: [String], default: [] },
        ipoDetails: { type: ipoDetailsSchema, default: () => ({}) },
        historicalPrices: { type: [historicalPriceSchema], default: [] },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

stockSchema.pre("save", function stockPreSave() {
    this._id = String(this._id || "").trim().toUpperCase();
    this.stockSymbol = this._id;
    this.currency = String(this.currency || "USD").trim().toUpperCase();
    this.listedExchanges = (this.listedExchanges || [])
        .map((exchange) => String(exchange || "").trim().toUpperCase())
        .filter(Boolean);
    this.tags = (this.tags || []).map((tag) => String(tag || "").trim()).filter(Boolean);
    this.lastUpdated = new Date();
});
stockSchema.pre("validate", function stockPreValidate() {
    this._id = String(this._id || "").trim().toUpperCase();
    this.stockSymbol = this._id;
});

module.exports = mongoose.model("Stock", stockSchema);
