// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// 🟢 Load environment variables
dotenv.config();

// 🟢 Import routes
const setupChangeStream = require("./testimonialChangeStream.js");
const cartRoutes = require("./routes/cartRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const testimonialRoutes = require("./testimonialRoutes.js");

const app = express();

// 🟢 Enable CORS for your frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://altheas-crochet-project.vercel.app",
    ],
    credentials: true,
  })
);

// 🟢 Middleware to parse JSON payloads
app.use(express.json({ limit: "10mb" }));

// 🟢 Serve uploaded images (proof of payment, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🟢 Create HTTP server
const server = http.createServer(app);

// 🟢 Setup Socket.IO (for testimonials or live updates)
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://altheas-crochet-project.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

// 🟢 Mount API routes
app.use("/api/cart", cartRoutes); // ✅ Changed from /api/v1/cart to /api/cart
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/orders", orderRoutes); // includes Multer upload for payment proof
app.use("/api/v1/testimonials", testimonialRoutes);

// 🟢 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    // Setup testimonial change stream after DB connection
    setupChangeStream(io);
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🟢 Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
