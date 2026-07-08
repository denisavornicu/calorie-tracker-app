const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    res.json({
      username: req.user.username,
      profile: req.user.profile,
      preferences: req.user.preferences,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

router.put("/", protect, async (req, res) => {
  try {
    const { profile, preferences } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (profile) {
      user.profile = {
        ...user.profile.toObject(),
        ...profile,
      };
    }

    if (preferences) {
      user.preferences = {
        ...user.preferences.toObject(),
        ...preferences,
      };
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      profile: user.profile,
      preferences: user.preferences,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

module.exports = router;