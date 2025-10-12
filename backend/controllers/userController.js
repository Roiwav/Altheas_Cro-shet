const User = require("../models/User.js");

/**
 * @desc Get all users (Admin only)
 * @route GET /api/v1/users
 * @access Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    // Only admins can fetch all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find({}).select("-password -resetToken -tokenExpiry");
    const now = new Date();
    // Transform data for frontend compatibility
    const transformedUsers = users.map(user => ({
      id: user._id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1), // Capitalize first letter
      status: user.suspendedUntil && user.suspendedUntil > now ? 'Suspended' : 'Active',
      joinedDate: user.createdAt,
      avatar: user.avatar,
      addresses: user.addresses,
      preferences: user.preferences,
      lastUsernameChangeAt: user.lastUsernameChangeAt,
      hasPassword: Boolean(user.password),
      googleId: user.googleId,
      // You can add these fields to your User schema later for order tracking
      itemsBought: 0, // Placeholder - calculate from orders
      totalOrders: 0   // Placeholder - calculate from orders
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Suspend or unsuspend a user for a given number of days (Admin only)
 * @route PATCH /api/v1/users/:id/suspend
 * @access Private/Admin
 */
const suspendUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const { days } = req.body;

    // Prevent admin from suspending themselves
    if (req.user.id.toString() === id) {
      return res.status(400).json({ message: "Cannot suspend your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parsed = parseInt(days, 10);
    if (Number.isNaN(parsed)) {
      return res.status(400).json({ message: "Invalid days value" });
    }

    if (parsed > 0) {
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      user.suspendedUntil = new Date(Date.now() + parsed * MS_PER_DAY);
    } else {
      user.suspendedUntil = null; // clear suspension
    }

    await user.save();

    return res.json({
      message: parsed > 0 ? `User suspended for ${parsed} day(s)` : 'User suspension cleared',
      suspendedUntil: user.suspendedUntil,
    });
  } catch (error) {
    console.error("Suspend User Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Get user profile
 * @route GET /api/v1/users/:id
 * @access Private
 */
const getUser = async (req, res) => {
  try {
    // Ensure the requesting user matches the user being requested or is admin
    if (req.user.id.toString() !== req.params.id && req.user.role !== 'admin') {
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
 * @desc Update user profile, addresses, or preferences
 * @route PATCH /api/v1/users/:id
 * @access Private
 */
const updateUser = async (req, res) => {
  try {
    // Ensure the requesting user matches the user being updated or is admin
    if (req.user.id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // All updates require password confirmation (except for admin updates)
    const { password, username, avatar, addresses, preferences, role } = req.body;
    
    // If admin is updating another user, password confirmation not required
    const isAdminUpdate = req.user.role === 'admin' && req.user.id.toString() !== req.params.id;
    
    if (!isAdminUpdate) {
      if (!password) {
        return res.status(400).json({ message: "Password is required to save changes" });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    // Handle username update (with 7-day cooldown)
    if (username && username !== user.username) {
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      if (
        user.lastUsernameChangeAt &&
        (Date.now() - user.lastUsernameChangeAt.getTime()) / MS_PER_DAY < 7
      ) {
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

    // Only admin can change roles
    if (role !== undefined && req.user.role === 'admin') {
      user.role = role.toLowerCase();
    }

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
        hasPassword: Boolean(updatedUser.password),
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: "Username is already taken." });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Delete user (Admin only)
 * @route DELETE /api/v1/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Prevent admin from deleting themselves
    if (req.user.id.toString() === req.params.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Update user role (Admin only)
 * @route PATCH /api/v1/users/:id/role
 * @access Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    // Only admins can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { role } = req.body;
    const validRoles = ['customer', 'admin', 'moderator'];
    
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent admin from removing their own admin role
    if (req.user.id.toString() === req.params.id && role.toLowerCase() !== 'admin') {
      return res.status(400).json({ message: "Cannot remove your own admin privileges" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role.toLowerCase();
    await user.save();

    res.json({ 
      message: "User role updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser,
};
