const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser,
} = require("../controllers/userController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

// All routes prefixed with /api/v1/users
router.get("/", verifyToken, requireAdmin, getAllUsers);
router.get("/:id", verifyToken, getUser);
router.patch("/:id", verifyToken, updateUser);

// Delete user (Admin only)
router.delete("/:id", verifyToken, deleteUser);

// Update user role (Admin only)
router.patch("/:id/role", verifyToken, updateUserRole);

// Suspend or unsuspend user (Admin only)
router.patch("/:id/suspend", verifyToken, suspendUser);

module.exports = router;
