const express = require("express");
const router = express.Router();
const {
  updateUser,
  getUser,
} = require("../controllers/userController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

// All routes in this file are automatically prefixed with /api/v1/users

router.get("/:id", verifyToken, getUser);
router.patch("/:id", verifyToken, updateUser);

module.exports = router;