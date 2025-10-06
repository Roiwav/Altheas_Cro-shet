const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Google OAuth Routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline',
    session: false
  })
);

// Google OAuth Callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true,
    session: false 
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        throw new Error('Authentication failed');
      }

      const token = generateToken(req.user._id);
      const userData = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.fullName || req.user.email.split('@')[0],
        role: req.user.role || 'customer',
        avatar: req.user.avatar
      };

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = new URL(`${frontendUrl}/auth/success`);
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('user', JSON.stringify(userData));
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
);

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    if (!fullName || !username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (await User.findOne({ username }))
      return res.status(400).json({ message: "Username already exists" });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    let role = "customer";
    if (username === "admin" && email === "admin@gmail.com" && password === "admin123")
      role = "admin";

    const user = await User.create({ fullName, username, email, password, role });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        avatar: user.avatar || "",
        addresses: user.addresses || [],
        preferences: user.preferences || { newsletter: true },
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// LOGIN - Enhanced to return complete user data including addresses
router.post("/login", async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginId = (email || identifier || username || "").trim();
    if (!loginId || !password)
      return res.status(400).json({ message: "Email/Username and password are required" });

    const query = loginId.includes("@") ? { email: loginId.toLowerCase() } : { username: loginId };
    const user = await User.findOne(query);
    if (!user || !(await user.matchPassword(password)))
      return res.status(400).json({ message: "Invalid email/username or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    // Return complete user data including addresses and preferences
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        username: user.username, 
        avatar: user.avatar || "", 
        addresses: user.addresses || [],
        preferences: user.preferences || { newsletter: true },
        role: user.role 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// NEW: GET CURRENT USER DATA - This is the missing endpoint!
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return complete user data including addresses and preferences
    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      avatar: user.avatar || "",
      addresses: user.addresses || [],
      preferences: user.preferences || { newsletter: true },
      role: user.role
    });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// NEW: CHANGE PASSWORD ENDPOINT (if you don't have it elsewhere)
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password is correct
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// GOOGLE OAUTH ROUTES
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true 
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user._id);
      
      // Prepare user data to send to frontend
      const userData = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: req.user.role || 'customer',
        avatar: req.user.avatar
      };
      
      // Redirect to frontend with token and user data
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }
  }
);

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required", success: false });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found", success: false });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.tokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    res.json({ success: true, message: "Reset link generated", token, name: user.fullName });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Failed to generate reset link.", success: false });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, tokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: "Invalid or expired token", success: false });

    user.password = password;
    user.resetToken = undefined;
    user.tokenExpiry = undefined;
    
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, please try again later", success: false });
  }
});

module.exports = router;