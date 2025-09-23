// routes/cartRoutes.js
const express = require("express");
const { getCart, saveCart } = require("../controllers/cartController");

const router = express.Router();

router.get("/:userId", getCart);
router.post("/:userId", saveCart);

module.exports = router;
