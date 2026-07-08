const express = require("express");
const WeightEntry = require("../models/WeightEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

router.get("/", protect, async (req, res) => {
  try {
    const entries = await WeightEntry.find({
      user: req.user._id,
    }).sort({ date: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch weight entries", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { date = getToday(), weightKg, notes } = req.body;

    if (!weightKg) {
      return res.status(400).json({
        message: "Weight is required",
      });
    }

    const entry = await WeightEntry.create({
      user: req.user._id,
      date,
      weightKg,
      notes,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Failed to create weight entry", error: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const entry = await WeightEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: "Weight entry not found" });
    }

    res.json({ message: "Weight entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete weight entry", error: error.message });
  }
});

module.exports = router;