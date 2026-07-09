const mongoose = require("mongoose");

const mealItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
    },
    foodName: {
      type: String,
      required: true,
    },
    quantityGrams: {
      type: Number,
      required: true,
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    saturatedFat: {
      type: Number,
      default: 0,
    },
    unsaturatedFat: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    sugar: {
      type: Number,
      default: 0,
    },
    addedSugar: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    nextMealTime: {
      type: String,
      default: "",
    },
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Snack", "Dinner", "Drink"],
      required: true,
    },
    items: [mealItemSchema],
    totals: {
      calories: {
        type: Number,
        default: 0,
      },
      protein: {
        type: Number,
        default: 0,
      },
      fiber: {
        type: Number,
        default: 0,
      },
      fat: {
        type: Number,
        default: 0,
      },
      saturatedFat: {
        type: Number,
        default: 0,
      },
      unsaturatedFat: {
        type: Number,
        default: 0,
      },
      carbs: {
        type: Number,
        default: 0,
      },
      sugar: {
        type: Number,
        default: 0,
      },
      addedSugar: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Meal", mealSchema);