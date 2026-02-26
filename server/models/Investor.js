const mongoose = require('mongoose');

const InvestorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  investorType: { type: String, required: true },
  investmentRange: { type: String, required: true },
  preferredIndustry: { type: String, required: true },
  experienceLevel: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Investor', InvestorSchema);
