const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middleware/auth");
const stockController = require("../controllers/stockController");

// company management routes
router.post(
  "/",
  verifyToken,
  requireRole("company"),
  stockController.createStock
);
router.get(
  "/my",
  verifyToken,
  requireRole("company"),
  stockController.getMyStocks
);
router.put(
  "/:id",
  verifyToken,
  requireRole("company"),
  stockController.updateStock
);
router.delete(
  "/:id",
  verifyToken,
  requireRole("company"),
  stockController.deleteStock
);
router.get(
  "/analytics",
  verifyToken,
  requireRole("company"),
  stockController.getStockAnalytics
);

// public/user routes
router.get("/all", stockController.getAllStocks);
router.get("/history/:symbol", stockController.getStockHistory);
router.get("/filter", stockController.filterStocks);
router.get("/sort", stockController.sortStocks);
router.get("/:symbol", stockController.getStockBySymbol);

module.exports = router;
