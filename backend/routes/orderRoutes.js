// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  cancelOrderItem,
  cancelOrderProduct,
  confirmCancelledProduct,
} = require("../controllers/orderController");

// Multer setup for proof uploads (memory storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Routes
router.post("/", upload.single("paymentProof"), createOrder);
router.get("/", getAllOrders);
router.get("/myorders", verifyToken, getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);
router.put("/:id/cancel", cancelOrderItem);
router.delete("/:id/product/:productId", cancelOrderProduct);
// Admin confirms a cancelled product and notifies customer
router.post(
  "/:id/product/:productId/confirm-cancel",
  verifyToken,
  requireAdmin,
  confirmCancelledProduct
);

module.exports = router;
