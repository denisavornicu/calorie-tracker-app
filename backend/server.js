const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Calorie Tracker API is running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/foods", require("./routes/foodRoutes"));
app.use("/api/meals", require("./routes/mealRoutes"));
app.use("/api/water", require("./routes/waterRoutes"));
app.use("/api/weight", require("./routes/weightRoutes"));
app.use("/api/sport", require("./routes/sportRoutes"));
app.use("/api/fasts", require("./routes/fastRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});