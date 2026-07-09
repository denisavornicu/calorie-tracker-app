const express = require("express");
const SportEntry = require("../models/SportEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

router.get("/", protect, async (req, res) => {
  try {
    const date = req.query.date || getToday();

    const entries = await SportEntry.find({
      user: req.user._id,
      date,
    }).sort({ createdAt: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sport entries", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const {
      date = getToday(),
      activityName,
      durationMinutes,
      caloriesBurned,
      notes,
    } = req.body;

    if (!activityName || caloriesBurned === undefined) {
      return res.status(400).json({
        message: "Activity name and calories burned are required",
      });
    }

    const entry = await SportEntry.create({
      user: req.user._id,
      date,
      activityName,
      durationMinutes,
      caloriesBurned,
      notes,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Failed to create sport entry", error: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const {
      date = getToday(),
      activityName,
      durationMinutes,
      caloriesBurned,
      notes,
    } = req.body;

    if (!activityName || caloriesBurned === undefined) {
      return res.status(400).json({
        message: "Activity name and calories burned are required",
      });
    }

    const entry = await SportEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        date,
        activityName,
        durationMinutes,
        caloriesBurned,
        notes,
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({
        message: "Sport entry not found",
      });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update sport entry",
      error: error.message,
    });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const entry = await SportEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: "Sport entry not found" });
    }

    res.json({ message: "Sport entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete sport entry", error: error.message });
  }
});

module.exports = router;