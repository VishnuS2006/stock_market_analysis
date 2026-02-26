const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    role: {
        type: String,
        default: "company",
        enum: ["company"],
    },
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    industry: { type: String, required: true },
    foundedYear: { type: Number, required: true },
    fundingNeeded: { type: String, required: true },
    equityOffered: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);