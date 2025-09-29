// routes/cartRoutes.js
const express = require("express");
const { getCart, saveCart, mergeCart } = require("../controllers/cartController");

const router = express.Router();

router.get("/", getCart); // Will use userId or guestId
router.post("/", saveCart); // Will use userId or guestId

router.post("/merge", mergeCart);

module.exports = router;
