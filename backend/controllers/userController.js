const User = require("../models/User.js");

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
const getUser = async (req, res) => {
  try {
    // Ensure the requesting user matches the user being requested
    if (req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Update user profile, addresses, or preferences
 * @route   PATCH /api/v1/users/:id
 * @access  Private
 */
const updateUser = async (req, res) => {
  try {
    // Ensure the requesting user matches the user being updated
    if (req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // All updates require password confirmation
    const { password, username, avatar, addresses, preferences } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required to save changes" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Handle username update (with 7-day cooldown)
    if (username && username !== user.username) {
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      if (user.lastUsernameChangeAt && (Date.now() - user.lastUsernameChangeAt.getTime()) / MS_PER_DAY < 7) {
        const daysLeft = Math.ceil(7 - (Date.now() - user.lastUsernameChangeAt.getTime()) / MS_PER_DAY);
        return res.status(400).json({ message: `You can change your username again in ${daysLeft} day(s).` });
      }
      user.username = username;
      user.lastUsernameChangeAt = new Date();
    }

    // Handle other updates
    if (avatar !== undefined) user.avatar = avatar;
    if (addresses !== undefined) user.addresses = addresses;
    if (preferences !== undefined) user.preferences = preferences;

    const updatedUser = await user.save();

    res.json({
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        addresses: updatedUser.addresses,
        preferences: updatedUser.preferences,
        lastUsernameChangeAt: updatedUser.lastUsernameChangeAt,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: "Username is already taken." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUser,
  updateUser,
};