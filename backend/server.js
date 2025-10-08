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
const session = require('express-session');
const passport = require('passport');

// 🟢 Import routes
const setupChangeStream = require("./testimonialChangeStream.js");
const cartRoutes = require("./routes/cartRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const testimonialRoutes = require("./testimonialRoutes.js");
const productRoutes = require("./routes/productRoutes.js");

const app = express();

// 🟢 Create HTTP server
const server = http.createServer(app);

// 🟢 Setup Socket.IO (for testimonials or live updates) with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://altheas-crochet-project.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 🟢 Middleware to parse JSON payloads
app.use(express.json({ limit: "10mb" }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Import Passport config
require('./config/passport');

// 🟢 Enable CORS for all routes
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://altheas-crochet-project.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
    session: true
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          id: req.user._id, 
          email: req.user.email,
          name: req.user.fullName,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Prepare user data to send to frontend
      const userData = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.fullName,
        role: req.user.role || 'user',
        googleId: req.user.googleId,
        hasPassword: Boolean(req.user.password)
      };
      
      // Redirect to frontend OAuth callback with token and user data
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?` +
        `token=${encodeURIComponent(token)}&` +
        `user=${encodeURIComponent(JSON.stringify(userData))}`
      );
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_error`);
    }
  }
);

// Logout route
app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
});

// Simple route to check if user is authenticated
app.get('/auth/check', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// API routes
  app.use("/api/v1/cart", cartRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/orders", orderRoutes); // includes Multer upload for payment proof

  // 🟢 Serve uploaded images (proof of payment, etc.)
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use("/uploads/products", express.static(path.join(__dirname, "uploads", "products")));
  app.use("/uploads/proofs", express.static(path.join(__dirname, "uploads", "proofs")));

  app.use("/api/v1/products", productRoutes);
  // Testimonials routes (CommonJS)
  app.use("/api/v1/testimonials", testimonialRoutes);


// 🟢 Check for MongoDB URI
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in .env file");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { // This should be your Atlas connection string
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
