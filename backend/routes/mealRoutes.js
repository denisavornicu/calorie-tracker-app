const express = require("express");
const Meal = require("../models/Meal");
const Food = require("../models/Food");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

const roundValue = (value) => Math.round(value * 10) / 10;

const addFourHours = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  date.setHours(date.getHours() + 4);

  return date.toTimeString().slice(0, 5);
};

const calculateNutrition = (food, quantityGrams) => {
  const factor = quantityGrams / 100;

  return {
    calories: roundValue(food.calories * factor),
    protein: roundValue(food.protein * factor),
    fiber: roundValue(food.fiber * factor),
    fat: roundValue(food.fat * factor),
    saturatedFat: roundValue((food.saturatedFat || 0) * factor),
    unsaturatedFat: roundValue((food.unsaturatedFat || 0) * factor),
    carbs: roundValue(food.carbs * factor),
    sugar: roundValue(food.sugar * factor),
    addedSugar: roundValue(food.addedSugar * factor),
  };
};

const calculateTotals = (items) => {
  return items.reduce(
    (totals, item) => {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.fiber += item.fiber;
      totals.fat += item.fat;
      totals.saturatedFat += item.saturatedFat || 0;
      totals.unsaturatedFat += item.unsaturatedFat || 0;
      totals.carbs += item.carbs;
      totals.sugar += item.sugar;
      totals.addedSugar += item.addedSugar;

      return totals;
    },
    {
      calories: 0,
      protein: 0,
      fiber: 0,
      fat: 0,
      saturatedFat: 0,
      unsaturatedFat: 0,
      carbs: 0,
      sugar: 0,
      addedSugar: 0,
    }
  );
};

router.get("/", protect, async (req, res) => {
  try {
    const date = req.query.date || getToday();

    const meals = await Meal.find({
      user: req.user._id,
      date,
    }).sort({ time: 1 });

    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch meals", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { date = getToday(), time, mealType, items } = req.body;

    if (!time || !mealType || !items || items.length === 0) {
      return res.status(400).json({
        message: "Time, meal type and items are required",
      });
    }

    const calculatedItems = [];

    for (const item of items) {
      const food = await Food.findOne({
        _id: item.foodId,
        user: req.user._id,
      });

      if (!food) {
        return res.status(404).json({
          message: `Food not found: ${item.foodId}`,
        });
      }

      const nutrition = calculateNutrition(food, item.quantityGrams);

      calculatedItems.push({
        food: food._id,
        foodName: food.name,
        quantityGrams: item.quantityGrams,
        ...nutrition,
      });
    }

    const rawTotals = calculateTotals(calculatedItems);

    const totals = Object.fromEntries(
      Object.entries(rawTotals).map(([key, value]) => [key, roundValue(value)])
    );

    const meal = await Meal.create({
      user: req.user._id,
      date,
      time,
      nextMealTime: addFourHours(time),
      mealType,
      items: calculatedItems,
      totals,
    });

    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: "Failed to create meal", error: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res.json({ message: "Meal deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete meal", error: error.message });
  }
});

module.exports = router;