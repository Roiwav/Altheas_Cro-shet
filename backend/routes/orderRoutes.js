const express = require("express");
const Order = require("../models/Order.js");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, message: "✅ Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ success: false, message: "❌ Failed to place order", error: err.message });
  }
});

// 📌 Get all orders (for admin later)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
