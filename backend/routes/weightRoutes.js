// backend/routes/weightRoutes.js

const express = require("express");
const WeightEntry = require("../models/WeightEntry");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

router.get("/", protect, async (req, res) => {
  try {
    const entries = await WeightEntry.find({
      user: req.user._id,
    }).sort({ date: 1, time: 1, createdAt: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch weight entries",
      error: error.message,
    });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const {
      date = getToday(),
      time = getCurrentTime(),
      weightKg,
      notes,
    } = req.body;

    if (weightKg === undefined || weightKg === "") {
      return res.status(400).json({
        message: "Weight is required",
      });
    }

    const entry = await WeightEntry.create({
      user: req.user._id,
      date,
      time,
      weightKg: Number(weightKg),
      notes,
    });

    await User.findByIdAndUpdate(req.user._id, {
      "profile.weightKg": Number(weightKg),
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create weight entry",
      error: error.message,
    });
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
    res.status(500).json({
      message: "Failed to delete weight entry",
      error: error.message,
    });
  }
});

module.exports = router;
