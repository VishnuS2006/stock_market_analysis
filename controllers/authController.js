const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const Company = require("../models/Company");
const Investor = require("../models/Investor");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const INVESTOR_TYPES = new Set(["Angel", "VC", "Individual"]);
const EXPERIENCE_LEVELS = new Set(["Beginner", "Intermediate", "Expert"]);

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isBcryptHash(value) {
    return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

function normalizePhone(phone) {
    const raw = String(phone || "").trim();
    const hasLeadingPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "");
    return `${hasLeadingPlus ? "+" : ""}${digits}`;
}

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function findUserInModelByEmail(Model, email) {
    const emailPattern = new RegExp(`^\\s*${escapeRegex(email)}\\s*$`, "i");
    const lookupQueries = [
        { email },
        { email: emailPattern },
        { emailAddress: email },
        { emailAddress: emailPattern },
        { mail: email },
        { mail: emailPattern },
    ];

    for (const query of lookupQueries) {
        const user = await Model.findOne(query);
        if (user) {
            return user;
        }
    }

    return null;
}

async function findUserByEmail(email) {
    let user = await findUserInModelByEmail(Company, email);
    let role = "company";

    if (!user) {
        user = await findUserInModelByEmail(Investor, email);
        role = "investor";
    }

    return { user, role };
}

async function verifyPassword(user, password) {
    const storedPassword = String(user && user.password ? user.password : "");
    if (!storedPassword) {
        return false;
    }

    if (isBcryptHash(storedPassword)) {
        return bcrypt.compare(password, storedPassword);
    }

    const plainMatch = password === storedPassword;
    if (!plainMatch) {
        return false;
    }

    try {
        const hashed = await hashPassword(password);
        await user.constructor.updateOne({ _id: user._id }, { $set: { password: hashed } });
    } catch (error) {
        console.error("password migration error:", error.message);
    }

    return true;
}

exports.signupCompany = async (req, res) => {
    console.log("signupCompany payload keys:", Object.keys(req.body || {}));

    try {
        const {
            companyName,
            email,
            password,
            confirmPassword,
            registrationNumber,
            industry,
            foundedYear,
            fundingNeeded,
            equityOffered,
        } = req.body || {};

        const normalizedEmail = normalizeEmail(email);
        const trimmedName = String(companyName || "").trim();
        const trimmedRegistration = String(registrationNumber || "").trim();
        const trimmedIndustry = String(industry || "").trim();
        const trimmedFundingNeeded = String(fundingNeeded || "").trim();
        const parsedFoundedYear = Number(foundedYear);
        const parsedEquity = Number(equityOffered);

        if (
            !trimmedName ||
            !normalizedEmail ||
            !password ||
            !confirmPassword ||
            !trimmedRegistration ||
            !trimmedIndustry ||
            !trimmedFundingNeeded
        ) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (!validator.isEmail(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        if (!Number.isInteger(parsedFoundedYear) || parsedFoundedYear < 1800) {
            return res.status(400).json({ success: false, message: "Invalid founded year" });
        }

        if (Number.isNaN(parsedEquity) || parsedEquity < 0 || parsedEquity > 100) {
            return res.status(400).json({ success: false, message: "Equity must be between 0 and 100" });
        }

        const [existingEmail, existingInvestorEmail, existingRegistration] = await Promise.all([
            Company.findOne({ email: normalizedEmail }).lean(),
            Investor.findOne({ email: normalizedEmail }).lean(),
            Company.findOne({ registrationNumber: trimmedRegistration }).lean(),
        ]);

        if (existingEmail || existingInvestorEmail) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        if (existingRegistration) {
            return res.status(409).json({ success: false, message: "Registration number already exists" });
        }

        const hashed = await hashPassword(password);
        const company = await Company.create({
            companyName: trimmedName,
            email: normalizedEmail,
            password: hashed,
            registrationNumber: trimmedRegistration,
            industry: trimmedIndustry,
            foundedYear: parsedFoundedYear,
            fundingNeeded: trimmedFundingNeeded,
            equityOffered: parsedEquity,
        });


        console.log("signupCompany success:", company._id.toString());
        return res.status(201).json({
            success: true,
            message: "Company registered successfully",
            companyId: company._id,
        });
    } catch (error) {
        console.error("signupCompany error:", error);
        if (error && error.code === 11000) {
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(409).json({ success: false, message: "Email already registered" });
            }
            if (error.keyPattern && error.keyPattern.registrationNumber) {
                return res.status(409).json({ success: false, message: "Registration number already exists" });
            }
            return res.status(409).json({ success: false, message: "Duplicate company record" });
        }
        return res.status(500).json({ success: false, message: "Server error during company registration" });
    }
};

exports.signupInvestor = async (req, res) => {
    console.log("signupInvestor payload keys:", Object.keys(req.body || {}));

    try {
        const {
            fullName,
            email,
            password,
            confirmPassword,
            phone,
            investorType,
            preferredIndustry,
            experienceLevel,
        } = req.body || {};

        const trimmedName = String(fullName || "").trim();
        const normalizedEmail = normalizeEmail(email);
        const trimmedPhone = normalizePhone(phone);
        const trimmedIndustry = String(preferredIndustry || "").trim();
        const trimmedType = String(investorType || "").trim();
        const trimmedExperience = String(experienceLevel || "").trim();

        if (
            !trimmedName ||
            !normalizedEmail ||
            !password ||
            !confirmPassword ||
            !trimmedPhone ||
            !trimmedType ||
            !trimmedIndustry ||
            !trimmedExperience
        ) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (!validator.isEmail(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        if (trimmedPhone.length < 7 || trimmedPhone.length > 18) {
            return res.status(400).json({ success: false, message: "Invalid phone number" });
        }

        if (!INVESTOR_TYPES.has(trimmedType)) {
            return res.status(400).json({ success: false, message: "Invalid investor type" });
        }

        if (!EXPERIENCE_LEVELS.has(trimmedExperience)) {
            return res.status(400).json({ success: false, message: "Invalid experience level" });
        }

        const [existingInvestor, existingCompany] = await Promise.all([
            Investor.findOne({ email: normalizedEmail }).lean(),
            Company.findOne({ email: normalizedEmail }).lean(),
        ]);
        if (existingInvestor || existingCompany) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const hashed = await hashPassword(password);
        const investor = await Investor.create({
            fullName: trimmedName,
            email: normalizedEmail,
            password: hashed,
            phone: trimmedPhone,
            investorType: trimmedType,
            preferredIndustry: trimmedIndustry,
            experienceLevel: trimmedExperience,
        });

        console.log("signupInvestor success:", investor._id.toString());
        return res.status(201).json({
            success: true,
            message: "Investor registered successfully",
            investorId: investor._id,
        });
    } catch (error) {
        console.error("signupInvestor error:", error);
        if (error && error.code === 11000) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }
        return res.status(500).json({ success: false, message: "Server error during investor registration" });
    }
};

exports.login = async (req, res) => {
    console.log("login attempt:", req.body && req.body.email);

    try {
        const email = normalizeEmail(req.body && req.body.email);
        const password = String((req.body && req.body.password) || "");

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password required" });
        }

        const { user, role } = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const validPassword = await verifyPassword(user, password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, role }, JWT_SECRET, { expiresIn: "24h" });
        return res.status(200).json({ success: true, token, role });
    } catch (error) {
        console.error("login error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
