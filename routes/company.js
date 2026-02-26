const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const { getCompanyProfile, updateCompanyProfile } = require("../controllers/companyController");


const router = express.Router();
router.use(verifyToken, requireRole("company"));

router.get("/profile", getCompanyProfile);
router.put("/profile", updateCompanyProfile);

module.exports = router;
