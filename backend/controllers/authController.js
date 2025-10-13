// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createLog } = require("../controllers/logController");

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
      status: "Active"
    });

    // LOG USER ACTION: User registered an account
    await createLog(
      "User Action",
      user.username || user.email || user._id.toString(),
      user._id.toString(),
      "User registered an account",
      "Success"
    );

    // Create JWT
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
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};

// =======================
// Login User - FIXED
// =======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // FIXED: Find user but don't filter by deletedAt in the query
    // We want to find the user first, then check their status
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // FIXED: Check if user is deleted FIRST
    if (user.deletedAt) {
      console.log(`🚫 Deleted user attempted login: ${user.email} (deleted at: ${user.deletedAt})`);
      return res.status(403).json({
        message: "Your account has been deleted. Please contact support if you believe this is an error.",
        deleted: true
      });
    }

    // FIXED: Check if user is suspended SECOND
    if (user.status === "Suspended") {
      console.log(`🚫 Suspended user attempted login: ${user.email} (status: ${user.status})`);
      return res.status(403).json({
        message: `Your account is suspended. ${user.suspensionReason || "Contact support for more information."}`,
        suspended: true,
        suspensionReason: user.suspensionReason
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // LOG USER ACTION: User logged in
    try {
      await createLog(
        "User Action",
        user.username || user.email || user._id.toString(),
        user._id.toString(),
        "User logged in successfully",
        "Success"
      );
    } catch (logError) {
      console.error("Failed to log user login:", logError);
    }

    // Create JWT
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

    console.log(`✅ User logged in successfully: ${user.email}`);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};

// =======================
// Logout User
// =======================
exports.logoutUser = (req, res) => {
  return res.json({ message: "Logout successful" });
};