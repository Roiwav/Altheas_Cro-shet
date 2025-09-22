// server.js (CommonJS)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);

// API routes
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
