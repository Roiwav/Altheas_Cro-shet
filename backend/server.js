// server.js
const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require('express-session');
const passport = require('passport');

const setupChangeStream = require('./testimonialChangeStream.js');
const cartRoutes = require("./routes/cartRoutes.js");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes.js");
const testimonialRoutes = require("./testimonialRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://altheas-crochet-project.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Enable CORS for all routes
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://altheas-crochet-project.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

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

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Import Passport config
require('./config/passport');

// Middleware
app.use(express.json({ limit: "5mb" }));

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
          role: req.user.role || 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Prepare user data to send to frontend
      const userData = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.fullName,
        role: req.user.role || 'user'
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
app.use("/api/orders", orderRoutes);
app.use("/api/v1/testimonials", testimonialRoutes);
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