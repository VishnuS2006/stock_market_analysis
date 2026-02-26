const express = require("express");
const router = express.Router();

const { signupCompany, signupInvestor, login } = require("../controllers/authController");

// Company signup
router.post("/signup/company", signupCompany);
// Investor signup
router.post("/signup/investor", signupInvestor);
// Login
router.post("/login", login);

module.exports = router;