const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup/company', authController.signupCompany);
router.post('/signup/investor', authController.signupInvestor);
router.post('/login', authController.login);

module.exports = router;
