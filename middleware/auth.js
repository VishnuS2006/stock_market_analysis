const jwt = require("jsonwebtoken");
const Investor = require("../models/Investor");
const Company = require("../models/Company");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

exports.verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        if (decoded.role === "company") {
            req.userInfo = await Company.findById(decoded.id).select("-password");
        } else if (decoded.role === "investor") {
            req.userInfo = await Investor.findById(decoded.id).select("-password");
        } else {
            return res.status(401).json({ success: false, message: "Invalid token role" });
        }

        if (!req.userInfo) {
            return res.status(401).json({ success: false, message: "Invalid token user" });
        }

        return next();
    } catch (error) {
        console.error("verifyToken error:", error.message);
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

exports.requireRole = (role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
};

// Backward-compatible alias for older route files.
exports.sessionAuth = (role) => [exports.verifyToken, exports.requireRole(role)];
