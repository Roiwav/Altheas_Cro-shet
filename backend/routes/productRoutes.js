const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  bulkUpdateCategory,
  bulkDeleteProducts,
  // soft delete / trash
  softDeleteProduct,
  bulkSoftDelete,
  getDeletedProducts,
  bulkRestoreProducts,
  bulkPermanentDelete,
} = require("../controllers/productController");


const router = express.Router();

// 🖼️ Multer setup for image upload (memory storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Create new product - now uses controller
router.post("/", upload.single("image"), createProduct);

// ✅ Get all products - now uses controller
router.get('/', getAllProducts);

// ✅ Update product - now uses controller
router.put("/:id", upload.single("image"), updateProduct);

// ✅ Toggle featured status - now uses controller
router.patch("/:id/toggle-featured", toggleFeatured);

// ✅ Update category name
router.patch("/update-category-name", require("../controllers/productController").updateCategoryName);

// ✅ Bulk update product category
router.patch("/bulk-update-category", bulkUpdateCategory);

// ✅ Bulk delete products
router.delete("/bulk", bulkDeleteProducts);

// ✅ Soft delete (move to trash)
router.patch("/:id/soft-delete", softDeleteProduct);
router.post("/bulk-soft-delete", bulkSoftDelete);

// ✅ Trash management
router.get("/deleted", getDeletedProducts);
router.post("/bulk-restore", bulkRestoreProducts);
router.post("/bulk-permanent-delete", bulkPermanentDelete);

// ✅ Delete product - now uses controller
router.delete("/:id", deleteProduct);

module.exports = router;
