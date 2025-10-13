// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); 
const path = require("path");
const logRoutes = require("./routes/logRoutes");
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db'); // Import the DB connection function

// 🟢 Load environment variables
dotenv.config();

// 🟢 Check for all required environment variables on startup
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'SESSION_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FRONTEND_URL'];
const missingEnv = requiredEnv.filter(envVar => !process.env[envVar]);
if (missingEnv.length > 0) {
  console.error(`❌ FATAL ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// 🟢 Connect to Database right away
connectDB().then(async () => {
  console.log("✅ MongoDB Connected");
  await ensureAdmin();
});

// 🟢 Import routes
const cartRoutes = require("./routes/cartRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");
const testimonialRoutes = require("./testimonialRoutes.js");
const productRoutes = require("./routes/productRoutes.js");
const User = require("./models/User");
const app = express();

// Seeder: ensure a default admin account exists
async function ensureAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'altheascroshet@gmail.com';
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';

    let user = await User.findOne({ email });
    if (!user) {
      await User.create({
        fullName: 'Admin',
        username,
        email,
        password, // will be hashed by pre-save hook
        role: 'admin',
      });
      console.log(`👤 Seeded default admin: ${email}`);
    } else {
      let updated = false;
      if (user.role !== 'admin') {
        user.role = 'admin';
        updated = true;
      }
      if (!user.password && password) {
        user.password = password; // will be hashed by pre-save hook
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log(`🔐 Ensured admin privileges for: ${email}`);
      }
    }
  } catch (e) {
    console.error('Admin seeding error:', e);
  }
}

// ✅ Proper middleware order:

// 1️⃣ Enable CORS for all routes
app.use(cors({
  origin: [
    "https://altheas-cro-shet.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 2️⃣ Middleware to parse JSON payloads
app.use(express.json({ limit: "10mb" }));

// 3️⃣ Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET, // Use a dedicated session secret
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI 
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 4️⃣ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Import Passport config
require('./config/passport');

// 5️⃣ Routes start here

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
    failureRedirect: `${process.env.FRONTEND_URL || 'https://altheas-cro-shet.vercel.app'}/login?error=google_auth_failed`,
    session: true
  }),
  (req, res) => {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://altheas-cro-shet.vercel.app';
      const now = new Date();
      if (req.user && req.user.suspendedUntil && req.user.suspendedUntil > now) {
        return res.redirect(`${frontendUrl}/login?error=oauth_error&message=${encodeURIComponent('Your account is suspended. Please try again later.')}`);
      }
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
      const userData = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.fullName,
        role: req.user.role || 'user',
        googleId: req.user.googleId,
        hasPassword: Boolean(req.user.password)
      };
      res.redirect(
        `${frontendUrl}/auth/success?` +
        `token=${encodeURIComponent(token)}&` +
        `user=${encodeURIComponent(JSON.stringify(userData))}`
      );
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'https://altheas-cro-shet.vercel.app'}/login?error=auth_error`);
    }
  }
);

// Logout route
app.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect(process.env.FRONTEND_URL || 'https://altheas-cro-shet.vercel.app');
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
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/testimonials", testimonialRoutes);

// 🟢 Serve all uploaded images from a single static path
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🟢 Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 🟢 Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Export the app for Vercel
module.exports = app;