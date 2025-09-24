// server.js
const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const setupChangeStream = require('./testimonialChangeStream.js');
const cartRoutes = require("./routes/cartRoutes.js");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes.js");
const testimonialRoutes = require("./testimonialRoutes");

dotenv.config();

const app = express();

// Enable CORS for all routes before any other middleware or routes
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Create HTTP server and wrap the Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://altheas-crochet-project.vercel.app"],// Your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json({ limit: "5mb" }));

// API routes
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/v1/testimonials", testimonialRoutes);
app.use('/', (req,res)=> {return res.json(`Welcome to Althea's Croshetb API`)})
// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    // Once connected, set up the change stream
    setupChangeStream(io);
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));