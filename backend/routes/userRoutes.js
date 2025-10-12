const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware.js");
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser,
} = require("../controllers/userController.js");

// All routes prefixed with /api/v1/users

// Get all users (Admin only)
router.get("/", verifyToken, requireAdmin, getAllUsers);

// Get specific user
router.get("/:id", verifyToken, getUser);

// Update user profile
router.patch("/:id", verifyToken, updateUser);

// Delete user (Admin only)
router.delete("/:id", verifyToken, requireAdmin, deleteUser);

// Update user role (Admin only)
router.patch("/:id/role", verifyToken, requireAdmin, updateUserRole);

// Suspend or unsuspend user (Admin only)
router.patch("/:id/suspend", verifyToken, requireAdmin, suspendUser);

module.exports = router;