// controllers/productController.js
const Product = require("../models/Product");
const fs = require('fs');
const path = require('path');

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, category, isFeatured } = req.body;
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

    const newProduct = new Product({
      name,
      description,
      price,
      quantity,
      category,
      isFeatured,
      image,
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ message: "Failed to create product due to a server error." });
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/v1/products
 * @access  Public
 */
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get a single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/v1/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, category, isFeatured } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.quantity = quantity || product.quantity;
      product.category = category || product.category;
      product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

      if (req.file) {
        product.image = `/uploads/products/${req.file.filename}`;
      }

      const updatedProduct = await product.save();
      res.json({ message: "Product updated", product: updatedProduct });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // If the product has an image, delete it from the filesystem
      if (product.image) {
        const imagePath = path.join(__dirname, '..', product.image);

        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Failed to delete image file: ${imagePath}`, err);
          }
        });
      }
      await product.deleteOne();
      res.json({ message: "Product and associated image removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error while deleting product." });
  }
};

/**
 * @desc    Toggle a product's featured status
 * @route   PATCH /api/v1/products/:id/toggle-featured
 * @access  Private/Admin
 */
const toggleFeatured = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            await product.save();
            res.json({ message: 'Featured status updated', product });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Update a category name for all products
 * @route   PATCH /api/v1/products/update-category-name
 * @access  Private/Admin
 */
const updateCategoryName = async (req, res) => {
  try {
    const { oldCategory, newCategory } = req.body;

    if (!oldCategory || !newCategory) {
      return res.status(400).json({ message: 'Old and new category names are required.' });
    }

    if (oldCategory === newCategory) {
      return res.status(400).json({ message: 'New category name cannot be the same as the old one.' });
    }

    const result = await Product.updateMany(
      { category: oldCategory },
      { $set: { category: newCategory } }
    );

    res.json({ message: `${result.modifiedCount} products updated from category "${oldCategory}" to "${newCategory}".`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error updating product category name:", error);
    res.status(500).json({ message: "Server error while updating category name." });
  }
};

/**
 * @desc    Bulk update categories for products
 * @route   PATCH /api/v1/products/bulk-update-category
 * @access  Private/Admin
 */
const bulkUpdateCategory = async (req, res) => {
  try {
    const { productIds, newCategory } = req.body;

    if (!productIds || !Array.isArray(productIds) || !newCategory) {
      return res.status(400).json({ message: 'Product IDs and a new category are required.' });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { category: newCategory } }
    );

    res.json({ message: `${result.modifiedCount} products updated successfully.`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error bulk updating product categories:", error);
    res.status(500).json({ message: "Server error while bulk updating products." });
  }
};

/**
 * @desc    Bulk delete products
 * @route   DELETE /api/v1/products/bulk
 * @access  Private/Admin
 */
const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }

    // Find products to get their image paths for deletion
    const productsToDelete = await Product.find({ _id: { $in: productIds } });

    // Delete associated images from the filesystem
    const imageDeletionPromises = productsToDelete
      .filter(p => p.image)
      .map(p => {
        const imagePath = path.join(__dirname, '..', p.image);
        return fs.promises.unlink(imagePath).catch(err => {
          // Log error if file doesn't exist, but don't stop the process
          console.warn(`Could not delete image (it may not exist): ${imagePath}`, err.code);
        });
      });

    await Promise.all(imageDeletionPromises);

    // Delete products from the database
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.json({ message: `${result.deletedCount} products deleted successfully.` });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    res.status(500).json({ message: "Server error during bulk deletion." });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  bulkUpdateCategory,
  updateCategoryName,
  bulkDeleteProducts,
};