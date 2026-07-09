// backend/routes/mealRoutes.js

const express = require("express");
const Meal = require("../models/Meal");
const Food = require("../models/Food");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getToday = () => new Date().toISOString().slice(0, 10);

const roundValue = (value) => Math.round(Number(value || 0) * 10) / 10;

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
  const factor = Number(quantityGrams || 0) / 100;

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
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.fiber += item.fiber || 0;
      totals.fat += item.fat || 0;
      totals.saturatedFat += item.saturatedFat || 0;
      totals.unsaturatedFat += item.unsaturatedFat || 0;
      totals.carbs += item.carbs || 0;
      totals.sugar += item.sugar || 0;
      totals.addedSugar += item.addedSugar || 0;

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

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildCalculatedItems = async (items, userId) => {
  const calculatedItems = [];

  for (const item of items) {
    if (item.foodId) {
      const food = await Food.findOne({
        _id: item.foodId,
        user: userId,
      });

      if (!food) {
        throw createHttpError(`Food not found: ${item.foodId}`, 404);
      }

      const quantityGrams = Number(item.quantityGrams || 0);

      if (quantityGrams <= 0) {
        throw createHttpError("Quantity must be greater than 0");
      }

      const nutrition = calculateNutrition(food, quantityGrams);

      calculatedItems.push({
        food: food._id,
        source: "food",
        foodName: food.name,
        quantityGrams,
        ...nutrition,
      });
    } else {
      const manualName = item.foodName?.trim() || "Estimare manuală";

      calculatedItems.push({
        food: null,
        source: "manual",
        foodName: manualName,
        quantityGrams: Number(item.quantityGrams || 0),
        calories: roundValue(item.calories),
        protein: roundValue(item.protein),
        fiber: roundValue(item.fiber),
        fat: roundValue(item.fat),
        saturatedFat: roundValue(item.saturatedFat),
        unsaturatedFat: roundValue(item.unsaturatedFat),
        carbs: roundValue(item.carbs),
        sugar: roundValue(item.sugar),
        addedSugar: roundValue(item.addedSugar),
      });
    }
  }

  return calculatedItems;
};

const buildTotals = (calculatedItems) => {
  const rawTotals = calculateTotals(calculatedItems);

  return Object.fromEntries(
    Object.entries(rawTotals).map(([key, value]) => [key, roundValue(value)])
  );
};

router.get("/history", protect, async (req, res) => {
  try {
    const { search = "", mealType = "", date = "", limit = 60 } = req.query;

    const query = { user: req.user._id };

    if (date) {
      query.date = date;
    }

    if (mealType) {
      query.mealType = mealType;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { mealType: regex },
        { "items.foodName": regex },
      ];
    }

    const meals = await Meal.find(query)
      .sort({ date: -1, time: -1, createdAt: -1 })
      .limit(Number(limit || 60));

    res.json(meals);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch meal history",
      error: error.message,
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const date = req.query.date || getToday();

    const meals = await Meal.find({
      user: req.user._id,
      date,
    }).sort({ time: 1 });

    res.json(meals);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch meals",
      error: error.message,
    });
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

    const calculatedItems = await buildCalculatedItems(items, req.user._id);
    const totals = buildTotals(calculatedItems);

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
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Failed to create meal",
      error: error.message,
    });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { date = getToday(), time, mealType, items } = req.body;

    if (!time || !mealType || !items || items.length === 0) {
      return res.status(400).json({
        message: "Time, meal type and items are required",
      });
    }

    const calculatedItems = await buildCalculatedItems(items, req.user._id);
    const totals = buildTotals(calculatedItems);

    const updatedMeal = await Meal.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        date,
        time,
        nextMealTime: addFourHours(time),
        mealType,
        items: calculatedItems,
        totals,
      },
      { new: true }
    );

    if (!updatedMeal) {
      return res.status(404).json({
        message: "Meal not found",
      });
    }

    res.json(updatedMeal);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Failed to update meal",
      error: error.message,
    });
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
    res.status(500).json({
      message: "Failed to delete meal",
      error: error.message,
    });
  }
});

module.exports = router;
