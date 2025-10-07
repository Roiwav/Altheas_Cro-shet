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

// NEW: SET PASSWORD (for OAuth users without local password)
router.post("/set-password", verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password) {
      return res.status(400).json({ message: "Password already set. Use change-password instead." });
    }

    user.password = newPassword; // will be hashed by pre-save middleware
    await user.save();

    res.json({
      success: true,
      message: "Password set successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        avatar: user.avatar || "",
        addresses: user.addresses || [],
        preferences: user.preferences || { newsletter: true, darkMode: true },
        role: user.role,
        hasPassword: true
      }
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

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
        preferences: user.preferences || { newsletter: true, darkMode: true },
        role: user.role,
        hasPassword: Boolean(user.password)
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
        preferences: user.preferences || { newsletter: true, darkMode: true },
        role: user.role,
        googleId: user.googleId,
        hasPassword: Boolean(user.password)
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// NEW: GET CURRENT USER DATA
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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
      preferences: user.preferences || { newsletter: true, darkMode: true },
      role: user.role,
      googleId: user.googleId,
      hasPassword: Boolean(user.password)
    });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});
// CHANGE PASSWORD
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

    res.json({ success: true, message: "Password changed successfully", hasPassword: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

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