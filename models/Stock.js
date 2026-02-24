const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    sector: { type: String, required: true },
    currentPrice: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Stock", stockSchema);