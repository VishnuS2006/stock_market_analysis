
const bcrypt = require('bcrypt');
const Investor = require('../models/Investor');
const Company = require('../models/Company');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

exports.signupCompany = async (req, res) => {
  try {
    const { companyName, email, password, registrationNumber, industry, foundedYear, fundingNeeded, equityOffered } = req.body;
    if (!companyName || !email || !password || !registrationNumber || !industry || !foundedYear || !fundingNeeded || !equityOffered) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const normalizedEmail = normalizeEmail(email);
    const existing = await Company.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const company = await Company.create({ companyName, email: normalizedEmail, password: hashed, registrationNumber, industry, foundedYear, fundingNeeded, equityOffered });
    return res.status(201).json({ success: true, message: 'Company registered', companyId: company._id });
  } catch (err) {
    console.error('signupCompany error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.signupInvestor = async (req, res) => {
  try {
    const { fullName, email, password, phone, investorType, investmentRange, preferredIndustry, experienceLevel } = req.body;
    if (!fullName || !email || !password || !phone || !investorType || !investmentRange || !preferredIndustry || !experienceLevel) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const normalizedEmail = normalizeEmail(email);
    const existing = await Investor.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const investor = await Investor.create({ fullName, email: normalizedEmail, password: hashed, phone, investorType, investmentRange, preferredIndustry, experienceLevel });
    return res.status(201).json({ success: true, message: 'Investor registered', investorId: investor._id });
  } catch (err) {
    console.error('signupInvestor error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    let user = await Company.findOne({ email: normalizeEmail(email) });
    let role = 'company';
    if (!user) {
      user = await Investor.findOne({ email: normalizeEmail(email) });
      role = 'investor';
    }
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    req.session.userId = user._id;
    req.session.role = role;
    return res.status(200).json({ success: true, role });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
