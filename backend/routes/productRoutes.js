const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const {
  createProduct,        // ← ADD THIS
  updateProduct,        // ← ADD THIS  
  getAllProducts,
  deleteProduct,
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

// ✅ USE CONTROLLER FUNCTIONS WITH LOGGING
router.post("/", upload.single("image"), createProduct);
router.put("/:id", upload.single("image"), updateProduct);

// ✅ Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { isFeatured, badge, badges } = req.query;
    const filter = { deletedAt: null };
    if (typeof isFeatured !== 'undefined') {
      const parseBoolean = (v) => v === true || v === 'true' || v === '1' || v === 1 || v === 'on';
      filter.isFeatured = parseBoolean(isFeatured);
    }
    const ALLOWED_BADGES = ["bestSeller", "bestChoice", "new"];
    const badgeList = typeof badge === 'string'
      ? [badge]
      : typeof badges === 'string'
        ? badges.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const validBadgeList = badgeList.filter(b => ALLOWED_BADGES.includes(b));
    if (validBadgeList.length) {
      filter.badges = { $in: validBadgeList };
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get featured products (top 3)
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: null, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(3);
    res.json({ products });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Toggle featured status - now uses controller
router.patch("/:id/toggle-featured", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.isFeatured) {
      const featuredCount = await Product.countDocuments({ isFeatured: true, deletedAt: null, _id: { $ne: product._id } });
      if (featuredCount >= 3) {
        return res.status(400).json({ message: 'You can only feature up to 3 products.' });
      }
    }
    product.isFeatured = !product.isFeatured;
    await product.save();
    res.json({ message: 'Product featured status updated', product });
  } catch (error) {
    console.error('Error toggling product featured status:', error);
    res.status(500).json({ message: 'Server error while toggling product featured status.' });
  }
});

// ✅ Update badges
router.patch('/:id/badges', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const ALLOWED_BADGES = ["bestSeller", "bestChoice", "new"];
    const sanitizeBadges = (input) => {
      const list = Array.isArray(input)
        ? input
        : typeof input === 'string'
          ? input.split(',').map(s => s.trim()).filter(Boolean)
          : [];
      return [...new Set(list.filter(b => ALLOWED_BADGES.includes(b)))];
    };
    product.badges = sanitizeBadges(req.body.badges);
    await product.save();
    res.json({ message: 'Product badges updated', product });
  } catch (error) {
    console.error('Error updating product badges:', error);
    res.status(500).json({ message: 'Server error while updating product badges.' });
  }
});

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