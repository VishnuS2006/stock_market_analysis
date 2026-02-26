const mongoose = require("mongoose");

const investorSchema = new mongoose.Schema({
    role: {
        type: String,
        default: "investor",
        enum: ["investor"],
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    investorType: { type: String, enum: ["Angel", "VC", "Individual"], required: true },
    preferredIndustry: { type: String, required: true },
    experienceLevel: { type: String, enum: ["Beginner", "Intermediate", "Expert"], required: true },
}, { timestamps: true });

module.exports = mongoose.model("Investor", investorSchema);
