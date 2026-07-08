const express = require("express");
const FastEntry = require("../models/FastEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const entries = await FastEntry.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fast entries", error: error.message });
  }
});

router.get("/active", protect, async (req, res) => {
  try {
    const activeFast = await FastEntry.findOne({
      user: req.user._id,
      status: "active",
    });

    res.json(activeFast);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active fast", error: error.message });
  }
});

router.post("/start", protect, async (req, res) => {
  try {
    const existingActiveFast = await FastEntry.findOne({
      user: req.user._id,
      status: "active",
    });

    if (existingActiveFast) {
      return res.status(400).json({
        message: "You already have an active fast",
      });
    }

    const { startTime } = req.body;

    const fast = await FastEntry.create({
      user: req.user._id,
      startTime: startTime ? new Date(startTime) : new Date(),
      status: "active",
    });

    res.status(201).json(fast);
  } catch (error) {
    res.status(500).json({ message: "Failed to start fast", error: error.message });
  }
});

router.put("/stop/:id", protect, async (req, res) => {
  try {
    const fast = await FastEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "active",
    });

    if (!fast) {
      return res.status(404).json({
        message: "Active fast not found",
      });
    }

    const endTime = new Date();
    const durationMinutes = Math.round((endTime - fast.startTime) / 60000);

    fast.endTime = endTime;
    fast.durationMinutes = durationMinutes;
    fast.status = "completed";

    await fast.save();

    res.json(fast);
  } catch (error) {
    res.status(500).json({ message: "Failed to stop fast", error: error.message });
  }
});

module.exports = router;