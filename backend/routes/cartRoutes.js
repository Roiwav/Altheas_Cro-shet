// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// Use an auth middleware here to protect the routes.
// Example: const { protect } = require('../middleware/authMiddleware');
// router.use(protect); // Uncomment this line and import your middleware

router.get("/:userId", cartController.getCart);
router.post("/:userId", cartController.updateCart);

module.exports = router;