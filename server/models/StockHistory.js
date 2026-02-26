const mongoose = require('mongoose');

const StockHistorySchema = new mongoose.Schema({
  stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
  marketCap: { type: Number, required: true },
  change: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StockHistory', StockHistorySchema);
