const express = require("express");
const Meal = require("../models/Meal");
const WaterEntry = require("../models/WaterEntry");
const SportEntry = require("../models/SportEntry");
const WeightEntry = require("../models/WeightEntry");
const FastEntry = require("../models/FastEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

const sumValues = (items, selector) => {
  return items.reduce((total, item) => total + selector(item), 0);
};

router.get("/today", protect, async (req, res) => {
  try {
    const date = req.query.date || getToday();

    const meals = await Meal.find({
      user: req.user._id,
      date,
    }).sort({ time: 1 });

    const waterEntries = await WaterEntry.find({
      user: req.user._id,
      date,
    }).sort({ time: 1 });

    const sportEntries = await SportEntry.find({
      user: req.user._id,
      date,
    });

    const latestWeight = await WeightEntry.findOne({
      user: req.user._id,
    }).sort({ date: -1, createdAt: -1 });

    const activeFast = await FastEntry.findOne({
      user: req.user._id,
      status: "active",
    });

    const consumedCalories = sumValues(meals, (meal) => meal.totals.calories);
    const caloriesBurned = sumValues(sportEntries, (entry) => entry.caloriesBurned);
    const waterConsumedMl = sumValues(waterEntries, (entry) => entry.amountMl);

    const maintenanceCalories = req.user.profile?.maintenanceCalories || 1360;
    const waterTargetMl = req.user.profile?.waterTargetMl || 2500;

    const calorieBudget = maintenanceCalories + caloriesBurned;
    const remainingCalories = calorieBudget - consumedCalories;
    const remainingWaterMl = waterTargetMl - waterConsumedMl;

    res.json({
      date,
      profile: req.user.profile,
      calories: {
        maintenanceCalories,
        consumedCalories,
        caloriesBurned,
        calorieBudget,
        remainingCalories,
      },
      water: {
        waterTargetMl,
        waterConsumedMl,
        remainingWaterMl,
      },
      weight: latestWeight,
      activeFast,
      meals,
      waterEntries,
      sportEntries,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
});

module.exports = router;