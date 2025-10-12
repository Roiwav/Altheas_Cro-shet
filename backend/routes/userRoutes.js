const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  suspendUser
} = require("../controllers/userController");

// All routes prefixed with /api/v1/users
router.get("/", verifyToken, requireAdmin, getAllUsers);
router.get("/:id", verifyToken, getUser);
router.patch("/:id", verifyToken, updateUser);
router.patch("/:id/role", verifyToken, requireAdmin, updateUserRole);
router.patch("/:id/suspend", verifyToken, requireAdmin, suspendUser);
router.delete("/:id", verifyToken, requireAdmin, deleteUser);

module.exports = router;
