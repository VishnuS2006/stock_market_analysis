const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Stock = require("./models/stock");
const Event = require("./models/Event");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // For frontend later

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected Successfully"))
.catch((err) => console.log("MongoDB Error:", err));

// Test Route
app.get("/", (req, res) => {
    res.send("Stock Market Event Correlator API Running");
});

app.post("/api/stocks", async (req, res) => {
    try {
        const newStock = new Stock(req.body);
        const savedStock = await newStock.save();
        res.status(201).json(savedStock);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/stocks", async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json(stocks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/api/stocks/:id", async (req, res) => {
    try {
        const updatedStock = await Stock.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedStock);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete("/api/stocks/:id", async (req, res) => {
    try {
        await Stock.findByIdAndDelete(req.params.id);
        res.json({ message: "Stock deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post("/api/events", async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/events", async (req, res) => {
    try {
        const events = await Event.find().populate("stockId");
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/api/events/:id", async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});