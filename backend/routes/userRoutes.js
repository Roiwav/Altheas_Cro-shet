// src/routes/userRoutes.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
  
function parseDataUrl(dataUrl) {
  // data:[<mediatype>][;base64],<data>
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const base64 = match[3];
  return { mime, ext, base64 };
}

// PATCH /api/v1/users/me/profile
// Updates a user's profile information.
router.patch("/me/profile", auth, async (req, res) => {
  try {
    const { username, avatar, password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: "Password is required to update profile" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await user.matchPassword(password);
    if (!valid) return res.status(400).json({ message: "Invalid account password" });

    // Handle username update with uniqueness + cooldown (7 days)
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      if (user.lastUsernameChangeAt) {
        const daysSince = (Date.now() - new Date(user.lastUsernameChangeAt).getTime()) / MS_PER_DAY;
        if (daysSince < 7) {
          const daysLeft = Math.ceil(7 - daysSince);
          return res.status(400).json({ message: `You can change your username again in ${daysLeft} day(s).` });
        }
      }
      user.username = username;
      user.lastUsernameChangeAt = new Date();
    }

    // Handle avatar upload if provided as data URL
    if (typeof avatar === "string" && avatar.startsWith("data:image/")) {
      const parsed = parseDataUrl(avatar);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid avatar image format" });
      }
      const { ext, base64 } = parsed;

      // Basic size guard (rough): base64 length * 3/4 bytes
      const approxBytes = Math.floor((base64.length * 3) / 4);
      const MAX_BYTES = 2 * 1024 * 1024; // 2MB
      if (approxBytes > MAX_BYTES) {
        return res.status(400).json({ message: "Avatar must be at most 2MB" });
      }

      const uploadsRoot = path.join(process.cwd(), "uploads");
      const avatarsDir = path.join(uploadsRoot, "avatars");
      ensureDir(avatarsDir);

      const fileName = `${user._id}_${Date.now()}.${ext}`;
      const filePath = path.join(avatarsDir, fileName);
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filePath, buffer);

      // Optional: delete previous local avatar file if it's in our uploads dir
      if (user.avatar && user.avatar.includes("/uploads/avatars/")) {
        const oldPath = path.join(uploadsRoot, user.avatar.split("/uploads/")[1]);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      user.avatar = `${baseUrl}/uploads/avatars/${fileName}`;
    }

    await user.save();

    return res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatar: user.avatar || "",
        addresses: user.addresses, // Added addresses to the response
        preferences: user.preferences, // Added preferences to the response
        lastUsernameChangeAt: user.lastUsernameChangeAt,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
});

// PUT /api/v1/users/me/addresses
// Updates a user's address list.
router.put("/me/addresses", auth, async (req, res) => {
  try {
    const { addresses, password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: "Password is required to update addresses" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await user.matchPassword(password);
    if (!valid) return res.status(400).json({ message: "Invalid account password" });

    if (!Array.isArray(addresses)) {
      return res.status(400).json({ message: "Addresses must be an array" });
    }

    // This is the key change: update the entire array at once.
    // This is a more atomic and reliable way to handle nested array updates.
    await User.updateOne(
      { _id: user._id },
      { $set: { addresses: addresses } }
    );

    // Re-fetch the user to get the latest state from the database
    const updatedUser = await User.findById(user._id).select("-password -__v");

    return res.json({
      message: "Addresses updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Address update error:", err);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
});

// PATCH /api/v1/users/me/preferences
// Updates user preferences
router.patch('/me/preferences', auth, async (req, res) => {
  try {
    const { preferences, password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: "Password is required to update preferences" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await user.matchPassword(password);
    if (!valid) return res.status(400).json({ message: "Invalid account password" });

    // Merge the new preferences with existing ones
    user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password -__v");
    res.json({ message: "Preferences updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Preferences update error:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
});


module.exports = router;