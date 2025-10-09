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
  markCancelledProductDone,
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
// Create order (authenticated users)
router.post("/", verifyToken, upload.single("paymentProof"), createOrder);
// Admin: list all orders
router.get("/", verifyToken, requireAdmin, getAllOrders);
// User: my orders
router.get("/myorders", verifyToken, getMyOrders);
// Admin: get order by id
router.get("/:id", verifyToken, requireAdmin, getOrderById);
// Admin: update status
router.put("/:id/status", verifyToken, requireAdmin, updateOrderStatus);
// Admin: delete order
router.delete("/:id", verifyToken, requireAdmin, deleteOrder);
// User: cancel whole order (if implemented)
router.put("/:id/cancel", verifyToken, cancelOrderItem);
// User: cancel a specific product in the order
router.delete("/:id/product/:productId", verifyToken, cancelOrderProduct);
// Admin confirms a cancelled product and notifies customer
router.post(
  "/:id/product/:productId/confirm-cancel",
  verifyToken,
  requireAdmin,
  confirmCancelledProduct
);

// Admin marks a cancelled product as done (refund completed)
router.post(
  "/:id/product/:productId/mark-done",
  verifyToken,
  requireAdmin,
  markCancelledProductDone
);

module.exports = router;
