const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const {
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

// Additional imports and helpers for route-level handlers
const productCloudinary = require("../config/productCloudinary");
const ALLOWED_BADGES = ["bestSeller", "bestChoice", "new"];
const parseBoolean = (v) => v === true || v === 'true' || v === '1' || v === 1 || v === 'on';
const sanitizeBadges = (input) => {
  const list = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',').map(s => s.trim()).filter(Boolean)
      : [];
  return [...new Set(list.filter(b => ALLOWED_BADGES.includes(b)))];
};

// Create product with badges + featured limit enforcement
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;
    const isFeaturedReq = parseBoolean(req.body.isFeatured);
    const badges = sanitizeBadges(req.body.badges);

    if (!name || !description || !price || typeof category === 'undefined') {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Enforce 3 featured max when creating
    if (isFeaturedReq) {
      const featuredCount = await Product.countDocuments({ isFeatured: true, deletedAt: null });
      if (featuredCount >= 3) {
        return res.status(400).json({ message: 'You can only feature up to 3 products.' });
      }
    }

    // Image required
    if (!(req.file && req.file.buffer)) {
      return res.status(400).json({ message: 'Product image is required' });
    }

    let imageUrl = null;
    let imagePublicId = null;
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        productCloudinary.uploader
          .upload_stream(
            { folder: 'products', resource_type: 'image' },
            (error, result) => error ? reject(error) : resolve(result)
          )
          .end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    } catch (err) {
      console.error('Cloudinary product upload error:', err);
      return res.status(500).json({ message: 'Failed to upload product image' });
    }

    const product = new Product({
      name,
      description,
      price,
      quantity: typeof quantity !== 'undefined' ? quantity : 0,
      category,
      isFeatured: !!isFeaturedReq,
      badges,
      image: imageUrl,
      imagePublicId,
    });
    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product (route-level):', error);
    res.status(500).json({ message: 'Failed to create product due to a server error.' });
  }
});

// ✅ Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { isFeatured, badge, badges } = req.query;
    const filter = { deletedAt: null };
    if (typeof isFeatured !== 'undefined') {
      filter.isFeatured = parseBoolean(isFeatured);
    }
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

// ✅ Update product with badges and featured limit enforcement
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Prepare pending changes
    const isFeaturedPresent = Object.prototype.hasOwnProperty.call(req.body, 'isFeatured');
    const isFeaturedReq = isFeaturedPresent ? parseBoolean(req.body.isFeatured) : product.isFeatured;
    const badgesPresent = Object.prototype.hasOwnProperty.call(req.body, 'badges');
    const badges = badgesPresent ? sanitizeBadges(req.body.badges) : product.badges;

    // Enforce max featured if turning on
    if (isFeaturedPresent && isFeaturedReq && !product.isFeatured) {
      const featuredCount = await Product.countDocuments({ isFeatured: true, deletedAt: null, _id: { $ne: product._id } });
      if (featuredCount >= 3) {
        return res.status(400).json({ message: 'You can only feature up to 3 products.' });
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.quantity = typeof quantity !== 'undefined' ? quantity : product.quantity;
    product.category = category || product.category;
    if (isFeaturedPresent) product.isFeatured = !!isFeaturedReq;
    if (badgesPresent) product.badges = badges;

    if (req.file && req.file.buffer) {
      if (product.imagePublicId) {
        try { await productCloudinary.uploader.destroy(product.imagePublicId); } catch (e) {}
      }
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          productCloudinary.uploader
            .upload_stream(
              { folder: 'products', resource_type: 'image' },
              (error, result) => error ? reject(error) : resolve(result)
            )
            .end(req.file.buffer);
        });
        product.image = uploadResult.secure_url;
        product.imagePublicId = uploadResult.public_id;
      } catch (err) {
        console.error('Cloudinary product upload error (update):', err);
        return res.status(500).json({ message: 'Failed to upload product image' });
      }
    }

    await product.save();
    res.json({ message: 'Product updated', product });
  } catch (error) {
    console.error('Error updating product (route-level):', error);
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
