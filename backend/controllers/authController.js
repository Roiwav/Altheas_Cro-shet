// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =======================
// Register User
// =======================
exports.registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const user = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      role: "customer",
    });

    // Create JWT with role and user info
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};

// =======================
// Login User
// =======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create JWT with role and user info
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};

// =======================
// (Other auth functions...)
// =======================

// Example function, adjust as needed.
exports.logoutUser = (req, res) => {
  // Invalidate token on frontend by removing it from storage/cookies
  return res.json({ message: "Logout successful" });
};
