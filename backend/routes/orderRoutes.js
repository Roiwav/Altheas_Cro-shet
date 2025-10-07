// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  cancelOrderItem,
  cancelOrderProduct, // ✅ Add this import
} = require("../controllers/orderController");

// Multer setup for proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Routes
router.post("/", upload.single("paymentProof"), createOrder);
router.get("/", getAllOrders);
router.get("/myorders", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);
router.put("/:id/cancel", cancelOrderItem);
router.delete("/:id/product/:productId", cancelOrderProduct); // ✅ Add this route

module.exports = router;
