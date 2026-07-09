// backend/routes/statisticsRoutes.js

const express = require("express");
const Meal = require("../models/Meal");
const WaterEntry = require("../models/WaterEntry");
const SportEntry = require("../models/SportEntry");
const WeightEntry = require("../models/WeightEntry");
const FastEntry = require("../models/FastEntry");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getDateString = (date) => date.toISOString().slice(0, 10);

const roundValue = (value) => Math.round(Number(value || 0) * 10) / 10;

const sumValues = (items, selector) => {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
};

const getDateRange = (days) => {
  const dates = [];
  const today = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    dates.push(getDateString(date));
  }

  return dates;
};

router.get("/overview", protect, async (req, res) => {
  try {
    const days = Number(req.query.days || 14);
    const dates = getDateRange(days);

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const startDate = new Date(`${firstDate}T00:00:00.000Z`);
    const endDate = new Date(`${lastDate}T23:59:59.999Z`);

    const meals = await Meal.find({
      user: req.user._id,
      date: { $in: dates },
    });

    const waterEntries = await WaterEntry.find({
      user: req.user._id,
      date: { $in: dates },
    });

    const sportEntries = await SportEntry.find({
      user: req.user._id,
      date: { $in: dates },
    });

    const weightEntries = await WeightEntry.find({
      user: req.user._id,
      date: { $in: dates },
    }).sort({ date: 1, time: 1, createdAt: 1 });

    const completedFasts = await FastEntry.find({
      user: req.user._id,
      status: "completed",
      endTime: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ endTime: 1 });

    const profile = req.user.profile || {};
    const maintenanceCalories = profile.maintenanceCalories || 1360;
    const waterTargetMl = profile.waterTargetMl || 2500;

    const overview = dates.map((date) => {
      const mealsForDate = meals.filter((meal) => meal.date === date);
      const waterForDate = waterEntries.filter((entry) => entry.date === date);
      const sportForDate = sportEntries.filter((entry) => entry.date === date);
      const weightsForDate = weightEntries.filter((entry) => entry.date === date);

      const fastsForDate = completedFasts.filter((fast) => {
        if (!fast.endTime) return false;
        return getDateString(new Date(fast.endTime)) === date;
      });

      const consumedCalories = sumValues(
        mealsForDate,
        (meal) => meal.totals.calories || 0
      );

      const caloriesBurned = sumValues(
        sportForDate,
        (entry) => entry.caloriesBurned || 0
      );

      const sportDurationMinutes = sumValues(
        sportForDate,
        (entry) => entry.durationMinutes || 0
      );

      const waterConsumedMl = sumValues(
        waterForDate,
        (entry) => entry.amountMl || 0
      );

      const latestWeight = weightsForDate[weightsForDate.length - 1];

      const protein = sumValues(mealsForDate, (meal) => meal.totals.protein || 0);
      const fiber = sumValues(mealsForDate, (meal) => meal.totals.fiber || 0);
      const fat = sumValues(mealsForDate, (meal) => meal.totals.fat || 0);
      const saturatedFat = sumValues(
        mealsForDate,
        (meal) => meal.totals.saturatedFat || 0
      );
      const unsaturatedFat = sumValues(
        mealsForDate,
        (meal) => meal.totals.unsaturatedFat || 0
      );
      const carbs = sumValues(mealsForDate, (meal) => meal.totals.carbs || 0);
      const sugar = sumValues(mealsForDate, (meal) => meal.totals.sugar || 0);
      const addedSugar = sumValues(
        mealsForDate,
        (meal) => meal.totals.addedSugar || 0
      );

      const fastDurationMinutes = sumValues(
        fastsForDate,
        (fast) => fast.durationMinutes || 0
      );

      return {
        date,
        consumedCalories: roundValue(consumedCalories),
        caloriesBurned: roundValue(caloriesBurned),
        sportDurationMinutes: roundValue(sportDurationMinutes),
        remainingCalories: roundValue(
          maintenanceCalories + caloriesBurned - consumedCalories
        ),
        protein: roundValue(protein),
        fiber: roundValue(fiber),
        fat: roundValue(fat),
        saturatedFat: roundValue(saturatedFat),
        unsaturatedFat: roundValue(unsaturatedFat),
        carbs: roundValue(carbs),
        sugar: roundValue(sugar),
        addedSugar: roundValue(addedSugar),
        waterConsumedMl: roundValue(waterConsumedMl),
        waterTargetMl,
        weightKg: latestWeight ? latestWeight.weightKg : null,
        fastCount: fastsForDate.length,
        fastDurationMinutes: roundValue(fastDurationMinutes),
        mealsCount: mealsForDate.length,
        sportEntriesCount: sportForDate.length,
      };
    });

    res.json({
      days,
      profile,
      overview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch statistics overview",
      error: error.message,
    });
  }
});

module.exports = router;
