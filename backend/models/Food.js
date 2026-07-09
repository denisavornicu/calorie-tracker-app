const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "Other",
    },
    calories: {
      type: Number,
      required: true,
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
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Food", foodSchema);