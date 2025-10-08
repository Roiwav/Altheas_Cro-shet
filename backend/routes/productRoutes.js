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
} = require("../controllers/productController");
 
const router = express.Router();

// 🖼️ Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/products"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});
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

// ✅ Delete product - now uses controller
router.delete("/:id", deleteProduct);

module.exports = router;
