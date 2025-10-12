const User = require("../models/User.js");
const bcrypt = require("bcryptjs");

// ✅ Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get single user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update user info
const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["user", "admin", "superadmin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Suspend or unsuspend user (final version)
const suspendUser = async (req, res) => {
  try {
    const { days } = req.body; // optional field

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();

    if (user.suspendedUntil && user.suspendedUntil > now) {
      // Already suspended → unsuspend
      user.suspendedUntil = null;
      user.status = "Active";
      await user.save();
      return res.json({ message: "User unsuspended successfully", user });
    } else {
      // Suspend the user
      const suspensionDays = Number(days) || 7;
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + suspensionDays);

      user.suspendedUntil = suspendUntil;
      user.status = "Suspended";
      await user.save();

      return res.json({
        message: `User suspended for ${suspensionDays} days`,
        user,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Export all functions
module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser,
};