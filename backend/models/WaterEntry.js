const mongoose = require("mongoose");

const waterEntrySchema = new mongoose.Schema(
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
    amountMl: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["Water", "Tea", "Coffee", "Juice", "Vitamin water", "Other"],
      default: "Water",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WaterEntry", waterEntrySchema);