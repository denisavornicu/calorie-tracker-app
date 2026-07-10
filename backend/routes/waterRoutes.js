// backend/routes/waterRoutes.js

const express = require("express");
const WaterEntry = require("../models/WaterEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

router.get("/", protect, async (req, res) => {
  try {
    const date = req.query.date || getToday();

    const entries = await WaterEntry.find({
      user: req.user._id,
      date,
    }).sort({ time: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch water entries",
      error: error.message,
    });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { date = getToday(), time = getCurrentTime(), amountMl, type = "Water" } = req.body;

    if (!amountMl || Number(amountMl) <= 0) {
      return res.status(400).json({
        message: "Amount is required and must be greater than 0",
      });
    }

    const entry = await WaterEntry.create({
      user: req.user._id,
      date,
      time,
      amountMl: Number(amountMl),
      type,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create water entry",
      error: error.message,
    });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const entry = await WaterEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: "Water entry not found" });
    }

    res.json({ message: "Water entry deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete water entry",
      error: error.message,
    });
  }
});

module.exports = router;
