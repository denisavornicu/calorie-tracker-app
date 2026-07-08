const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profile: {
      gender: {
        type: String,
        enum: ["female", "male", "other"],
        default: "female",
      },

      age: {
        type: Number,
        default: 22,
      },

      heightCm: {
        type: Number,
        default: 150,
      },

      weightKg: {
        type: Number,
        default: 44,
      },

      maintenanceCalories: {
        type: Number,
        default: 1360,
      },

      proteinTarget: {
        type: Number,
        default: 80,
      },

      fiberTarget: {
        type: Number,
        default: 25,
      },

      fatTarget: {
        type: Number,
        default: 45,
      },

      carbsTarget: {
        type: Number,
        default: 170,
      },

      sugarLimit: {
        type: Number,
        default: 50,
      },

      addedSugarLimit: {
        type: Number,
        default: 25,
      },

      waterTargetMl: {
        type: Number,
        default: 2500,
      },
    },

    preferences: {
      language: {
        type: String,
        enum: ["ro", "en"],
        default: "ro",
      },

      colorMode: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },

      themeStyle: {
        type: String,
        enum: ["pink-purple", "green"],
        default: "pink-purple",
      },

      sidebarCollapsed: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);