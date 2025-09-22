const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// =============================
// REGISTER (Auto Login)
// =============================
router.post("/register", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user (password will be hashed by pre("save") in schema)
    const user = await User.create({
      fullName,
      username,
      email,
      password,
    });

    // 🔑 Auto login: generate JWT immediately
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallbackSecret", {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, username: user.username, avatar: user.avatar || "" },
    });
  } catch (err) {
    console.error("Register error:", err);

    // Handle duplicate key error from MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }

    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// =============================
// LOGIN
// =============================
router.post("/login", async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    // Determine login identifier
    let loginId = (email || identifier || username || "").trim();
    if (!loginId) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    // Normalize email to lowercase when it looks like an email
    const looksLikeEmail = loginId.includes("@");
    if (looksLikeEmail) loginId = loginId.toLowerCase();

    // Find by email or username depending on the identifier
    const query = looksLikeEmail
      ? { email: loginId }
      : { username: loginId };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ message: "Invalid email/username or password" });
    }

    // Compare password using schema method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email/username or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallbackSecret", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, username: user.username, avatar: user.avatar || "" },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

module.exports = router;