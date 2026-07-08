const express = require("express");
const Food = require("../models/Food");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const foods = await Food.find({ user: req.user._id }).sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch foods", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const food = await Food.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json(food);
  } catch (error) {
    res.status(500).json({ message: "Failed to create food", error: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json(food);
  } catch (error) {
    res.status(500).json({ message: "Failed to update food", error: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const food = await Food.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json({ message: "Food deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete food", error: error.message });
  }
});

module.exports = router;