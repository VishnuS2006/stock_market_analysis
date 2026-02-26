const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
  marketCap: { type: Number, required: true },
  change: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Stock', StockSchema);
