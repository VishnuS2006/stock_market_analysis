const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { sessionAuth } = require('../middleware/auth');

// Company stock management
router.post('/', sessionAuth('company'), stockController.createStock);
router.get('/my', sessionAuth('company'), stockController.getMyStocks);
router.put('/:id', sessionAuth('company'), stockController.updateStock);
router.delete('/:id', sessionAuth('company'), stockController.deleteStock);

// Investor/public stock viewing
router.get('/', stockController.getAllStocks);
router.get('/:symbol', stockController.getStockBySymbol);

module.exports = router;
