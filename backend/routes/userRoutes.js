const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  getUser,
  deleteUser,
  updateUserRole,
} = require("../controllers/userController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

// All routes in this file are automatically prefixed with /api/v1/users

// Get all users (Admin only)
router.get("/", verifyToken, getAllUsers);

// Get specific user
router.get("/:id", verifyToken, getUser);

// Update user profile
router.patch("/:id", verifyToken, updateUser);

// Delete user (Admin only)
router.delete("/:id", verifyToken, deleteUser);

// Update user role (Admin only)
router.patch("/:id/role", verifyToken, updateUserRole);

module.exports = router;
