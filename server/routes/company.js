const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/profile', verifyToken, requireRole('company'), companyController.getProfile);
router.put('/profile', verifyToken, requireRole('company'), companyController.updateProfile);

module.exports = router;
