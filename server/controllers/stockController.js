const Stock = require('../models/Stock');
const StockHistory = require('../models/StockHistory');

exports.createStock = async (req, res) => {
  try {
    const { symbol, name, sector, price, volume, marketCap, change } = req.body;
    if (!symbol || !name || !sector || price == null || volume == null || marketCap == null || change == null) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const stock = await Stock.create({ ...req.body, company: req.user.id });
    await StockHistory.create({ stock: stock._id, price, volume, marketCap, change });
    res.status(201).json({ success: true, stock });
  } catch (err) {
    console.error('createStock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({ company: req.user.id });
    res.json({ success: true, stocks });
  } catch (err) {
    console.error('getMyStocks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await Stock.findOneAndUpdate({ _id: req.params.id, company: req.user.id }, req.body, { new: true, runValidators: true });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });
    await StockHistory.create({ stock: stock._id, price: stock.price, volume: stock.volume, marketCap: stock.marketCap, change: stock.change });
    res.json({ success: true, stock });
  } catch (err) {
    console.error('updateStock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({ _id: req.params.id, company: req.user.id });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteStock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllStocks = async (req, res) => {
  try {
    let query = {};
    if (req.query.sector) query.sector = req.query.sector;
    let stocks = await Stock.find(query);
    if (req.query.symbol) stocks = stocks.filter(s => s.symbol.toLowerCase().includes(req.query.symbol.toLowerCase()));
    if (req.query.sort) stocks = stocks.sort((a, b) => b[req.query.sort] - a[req.query.sort]);
    res.json({ success: true, stocks });
  } catch (err) {
    console.error('getAllStocks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getStockBySymbol = async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });
    const history = await StockHistory.find({ stock: stock._id }).sort({ date: 1 });
    res.json({ success: true, stock, history });
  } catch (err) {
    console.error('getStockBySymbol error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
