// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import cartRoutes from "./routes/cartRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // your existing auth routes
import userRoutes from "./routes/userRoutes.js"; // your existing user routes

dotenv.config();
const app = express();

// Middleware
app.use(express.json({ limit: "5mb" }));

const allowedOrigins = [
  'http://localhost:5173', // Frontend dev server
  process.env.FRONTEND_URL // Deployed frontend URL from environment variables
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// API routes
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.error(" MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));