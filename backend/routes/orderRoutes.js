const express = require("express");
const router = express.Router();
const { createOrder, getMyOrders, deleteOrder, cancelOrderItem, getAllOrders, updateOrderStatus} = require("../controllers/orderController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

// All routes in this file are automatically prefixed with /api/orders

router.post("/", verifyToken, createOrder);
router.get("/myorders", verifyToken, getMyOrders);
router.delete("/:id", verifyToken, deleteOrder);
router.delete("/:orderId/product/:productId", verifyToken, cancelOrderItem);
router.get("/", getAllOrders);
router.patch("/:id/status", verifyToken, updateOrderStatus);
module.exports = router;