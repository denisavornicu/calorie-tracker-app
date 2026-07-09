const express = require("express");
const Meal = require("../models/Meal");
const WaterEntry = require("../models/WaterEntry");
const SportEntry = require("../models/SportEntry");
const WeightEntry = require("../models/WeightEntry");
const FastEntry = require("../models/FastEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

const roundValue = (value) => Math.round(value * 10) / 10;

const sumValues = (items, selector) => {
  return items.reduce((total, item) => total + selector(item), 0);
};

const buildNutrientSummary = (consumed, target) => {
  const safeConsumed = roundValue(consumed || 0);
  const safeTarget = roundValue(target || 0);

  return {
    consumed: safeConsumed,
    target: safeTarget,
    remaining: roundValue(safeTarget - safeConsumed),
  };
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
    }).sort({ createdAt: 1 });

    const latestWeight = await WeightEntry.findOne({
      user: req.user._id,
    }).sort({ date: -1, createdAt: -1 });

    const activeFast = await FastEntry.findOne({
      user: req.user._id,
      status: "active",
    });

    const profile = req.user.profile || {};

    const consumedCalories = sumValues(meals, (meal) => meal.totals.calories || 0);
    const consumedProtein = sumValues(meals, (meal) => meal.totals.protein || 0);
    const consumedFiber = sumValues(meals, (meal) => meal.totals.fiber || 0);
    const consumedFat = sumValues(meals, (meal) => meal.totals.fat || 0);
    const consumedSaturatedFat = sumValues(
      meals,
      (meal) => meal.totals.saturatedFat || 0
    );

    const consumedUnsaturatedFat = sumValues(
      meals,
      (meal) => meal.totals.unsaturatedFat || 0
    );
    const consumedCarbs = sumValues(meals, (meal) => meal.totals.carbs || 0);
    const consumedSugar = sumValues(meals, (meal) => meal.totals.sugar || 0);
    const consumedAddedSugar = sumValues(meals, (meal) => meal.totals.addedSugar || 0);

    const caloriesBurned = sumValues(
      sportEntries,
      (entry) => entry.caloriesBurned || 0
    );

    const waterConsumedMl = sumValues(
      waterEntries,
      (entry) => entry.amountMl || 0
    );

    const maintenanceCalories = profile.maintenanceCalories || 1360;
    const waterTargetMl = profile.waterTargetMl || 2500;

    const calorieBudget = maintenanceCalories + caloriesBurned;
    const remainingCalories = calorieBudget - consumedCalories;

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayFast = await FastEntry.findOne({
    user: req.user._id,
    status: "completed",
    endTime: {
    $gte: yesterdayStart,
    $lte: yesterdayEnd,
  },
}).sort({ endTime: -1 });

    res.json({
      date,

      profile,

      preferences: req.user.preferences,

      calories: {
        maintenanceCalories: roundValue(maintenanceCalories),
        consumedCalories: roundValue(consumedCalories),
        caloriesBurned: roundValue(caloriesBurned),
        calorieBudget: roundValue(calorieBudget),
        remainingCalories: roundValue(remainingCalories),
      },

      nutrients: {
        protein: buildNutrientSummary(
          consumedProtein,
          profile.proteinTarget || 80
        ),
        fiber: buildNutrientSummary(
          consumedFiber,
          profile.fiberTarget || 25
        ),
        fat: buildNutrientSummary(
          consumedFat,
          profile.fatTarget || 45
        ),
        saturatedFat: buildNutrientSummary(
          consumedSaturatedFat,
          profile.saturatedFatLimit || 15
        ),
        unsaturatedFat: buildNutrientSummary(
          consumedUnsaturatedFat,
          profile.unsaturatedFatTarget || 30
        ),
        carbs: buildNutrientSummary(
          consumedCarbs,
          profile.carbsTarget || 170
        ),
        sugar: buildNutrientSummary(
          consumedSugar,
          profile.sugarLimit || 50
        ),
        addedSugar: buildNutrientSummary(
          consumedAddedSugar,
          profile.addedSugarLimit || 25
        ),
      },

      water: {
        waterTargetMl,
        waterConsumedMl,
        remainingWaterMl: waterTargetMl - waterConsumedMl,
      },

      weight: latestWeight,
      activeFast,
      yesterdayFast,
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