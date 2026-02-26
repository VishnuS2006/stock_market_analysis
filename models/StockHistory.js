const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  stockSymbol: { type: String, required: true, uppercase: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  volume: { type: Number, required: true, min: 0 },
  marketCap: { type: Number, required: true, min: 0 },
  changePercent: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("StockHistory", historySchema);
