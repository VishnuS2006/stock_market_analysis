const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    eventDate: { type: Date, required: true },
    impact: {
        type: String,
        enum: ["Positive", "Negative", "Neutral"],
        required: true
    },
    priceChangePercentage: { type: Number, required: true },
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stock",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);