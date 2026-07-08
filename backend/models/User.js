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
      waterTargetMl: {
        type: Number,
        default: 2500,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);