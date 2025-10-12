const User = require("../models/User.js");
const { createLog } = require('./logController'); // Add this import

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

    const users = await User.find({ deletedAt: null }).select("-password -resetToken -tokenExpiry");
    
    // Transform data for frontend compatibility
    const transformedUsers = users.map(user => ({
      id: user._id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1), // Capitalize first letter
      status: user.status || 'Active',
      joinedDate: user.createdAt,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=ec4899&color=fff`,
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
 * @desc Delete user (Admin only) - FIXED FOR DATABASE SAVE
 * @route DELETE /api/v1/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Admin role check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    
    // Self-delete check
    if (req.user.id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user is already deleted
    if (user.deletedAt) {
      return res.status(400).json({ message: "User is already deleted" });
    }

    console.log(`🗑️ Attempting to delete user: ${user.email} (ID: ${user._id})`);
    
    // FIXED: Use findByIdAndUpdate to avoid pre-save hook issues
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: req.user.id,
          status: 'Inactive' // Also update status
        }
      },
      { 
        new: true,
        runValidators: false // Skip validators to avoid password hashing
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to delete user" });
    }

    console.log(`✅ User deleted successfully: ${user.email} at ${updatedUser.deletedAt}`);
    
    // Log the deletion
    try {
      await createLog(
        'User Action',
        req.user?.fullName || req.user?.email || 'Admin',
        user._id.toString(),
        `User ${user.fullName || user.email} was deleted by admin`,
        'Success',
        { 
          userId: user._id,
          userEmail: user.email,
          deletedBy: req.user?._id,
          deletedAt: updatedUser.deletedAt
        }
      );
    } catch (logError) {
      console.error("Failed to log user deletion:", logError);
    }
    
    res.json({ 
      message: "User deleted successfully",
      deletedAt: updatedUser.deletedAt
    });
  } catch (err) {
    console.error("Delete User Error:", err);
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

    const oldRole = user.role;

    // FIXED: Use findByIdAndUpdate to avoid pre-save hook issues
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          role: role.toLowerCase()
        }
      },
      { 
        new: true,
        runValidators: false // Skip validators to avoid password hashing
      }
    );

    console.log(`🔄 Role updated for ${user.email}: ${oldRole} → ${role.toLowerCase()}`);

    // Log the role change
    try {
      await createLog(
        'User Action',
        req.user?.fullName || req.user?.email || 'Admin',
        user._id.toString(),
        `User role changed from ${oldRole} to ${role.toLowerCase()} for ${user.fullName || user.email}`,
        'Success',
        { 
          userId: user._id,
          userEmail: user.email,
          oldRole,
          newRole: role.toLowerCase(),
          changedBy: req.user?._id
        }
      );
    } catch (logError) {
      console.error("Failed to log role change:", logError);
    }

    res.json({ 
      message: "User role updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Suspend/Unsuspend user account (Admin only) - FIXED FOR DATABASE SAVE
 * @route PATCH /api/v1/users/:id/suspend
 * @access Private/Admin
 */
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend = true, reason } = req.body;
    
    // Admin role check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    
    // Self-suspend check
    if (req.user.id.toString() === id) {
      return res.status(400).json({ message: "Cannot suspend your own account" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user is deleted
    if (user.deletedAt) {
      return res.status(400).json({ message: "Cannot suspend a deleted user" });
    }
    
    const oldStatus = user.status;
    const newStatus = suspend ? "Suspended" : "Active";
    const suspensionReason = suspend ? (reason || "No reason provided") : null;

    console.log(`🚫 Attempting to ${suspend ? 'suspend' : 'unsuspend'} user: ${user.email}`);
    
    // FIXED: Use findByIdAndUpdate to avoid pre-save hook issues
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          status: newStatus,
          suspensionReason: suspensionReason,
          suspendedAt: suspend ? new Date() : null,
          suspendedBy: suspend ? req.user.id : null
        }
      },
      { 
        new: true,
        runValidators: false // Skip validators to avoid password hashing
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update user status" });
    }

    console.log(`✅ User ${suspend ? 'suspended' : 'unsuspended'} successfully: ${user.email} (Status: ${updatedUser.status})`);
    
    // Log the suspension/unsuspension
    try {
      await createLog(
        'User Action',
        req.user?.fullName || req.user?.email || 'Admin',
        user._id.toString(),
        `User ${suspend ? 'suspended' : 'unsuspended'}: ${user.fullName || user.email}${suspend && reason ? ` - Reason: ${reason}` : ''}`,
        'Success',
        { 
          userId: user._id,
          userEmail: user.email,
          action: suspend ? 'suspend' : 'unsuspend',
          oldStatus,
          newStatus: updatedUser.status,
          reason: suspend ? reason : null,
          actionBy: req.user?._id,
          suspendedAt: updatedUser.suspendedAt
        }
      );
    } catch (logError) {
      console.error("Failed to log user suspension:", logError);
    }
    
    res.json({ 
      message: `User ${suspend ? "suspended" : "unsuspended"} successfully`,
      user: {
        id: updatedUser._id,
        status: updatedUser.status,
        suspendedAt: updatedUser.suspendedAt,
        suspensionReason: updatedUser.suspensionReason
      }
    });
  } catch (err) {
    console.error("Suspend User Error:", err);
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