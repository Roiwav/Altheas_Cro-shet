const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware.js");
const emailjs = require('@emailjs/nodejs');

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

    // Determine user role
    let role = 'customer';
    if (username === 'admin' && email === 'admin@gmail.com' && password === 'admin123') {
      role = 'admin';
    }

    // Create new user (password will be hashed by pre("save") in schema)
    const user = await User.create({
      fullName,
      username,
      email,
      password,
      role, // Assign the determined role
    });

    // 🔑 Auto login: generate JWT immediately
    // Add the user's role to the JWT payload
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "fallbackSecret", {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        avatar: user.avatar || "",
        role: user.role, // Include the role in the response
      },
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
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "fallbackSecret", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        avatar: user.avatar || "",
        role: user.role, // Include the role in the response
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// =============================
// CHANGE PASSWORD
// =============================
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = newPassword; // The 'pre-save' hook in User.js will hash it
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password error:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

// =============================
// FORGOT PASSWORD
// =============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // To prevent email enumeration, we send a success response even if the user doesn't exist.
      return res.status(200).json({ message: "If a user with that email exists, a reset link has been sent." });
    }

    // Generate a secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // Token expires in 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // EmailJS parameters
    const templateParams = {
      to_email: email,
      reset_link: resetUrl,
      // Add any other params your template needs, like `to_name: user.fullName`
    };

    // Send email using EmailJS Node.js SDK
    console.log('Attempting to send email with Service ID:', process.env.EMAILJS_SERVICE_ID);
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        // The Node.js SDK uses the private key for authentication.
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    res.status(200).json({ message: "Password reset link sent." });

  } catch (err) {
    console.error("Forgot Password error:", err);
    // In case of an error, we still don't want to reveal if the user exists.
    // But we can send a generic server error.
    res.status(500).json({ message: "Error sending reset email. Please try again later." });
  }
});

// =============================
// RESET PASSWORD
// =============================
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    // Hash the incoming token to match the one in the DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log("Received Token:", token);
    console.log("Hashed Token for DB Search:", hashedToken);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Check if the token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    // Set the new password
    user.password = password;
    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // Optionally, log the user in by sending a new JWT token

    res.status(200).json({ message: "Password has been reset successfully." });

  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

module.exports = router;
