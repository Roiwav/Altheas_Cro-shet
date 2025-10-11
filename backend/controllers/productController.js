// controllers/productController.js
const Product = require("../models/Product");
const fs = require('fs');
const path = require('path');
const productCloudinary = require('../config/productCloudinary');
const { createLog } = require('../controllers/logController');

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {

  console.log("PRODUCT ROUTE CALLED");

  try {
    const { name, description, price, quantity, category, isFeatured } = req.body;

    // Upload product image to Cloudinary (product account)
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          productCloudinary.uploader
            .upload_stream(
              {
                folder: 'products',
                resource_type: 'image',
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            )
            .end(req.file.buffer);
        });
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (err) {
        console.error('Cloudinary product upload error:', err);
        return res.status(500).json({ message: 'Failed to upload product image' });
      }
    } else {
      return res.status(400).json({ message: 'Product image is required' });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      quantity,
      category,
      isFeatured,
      image: imageUrl,
      imagePublicId,
    });

    await newProduct.save();

    console.log('🔍 About to log product creation...');
    console.log('🔍 req.user:', req.user);
    console.log('🔍 newProduct._id:', newProduct._id.toString());
    console.log('🔍 product name:', name);

    // LOG PRODUCT CREATION
    await createLog(
      'Product Edit',
      req.user?.username || req.user?.email || 'Admin',
      newProduct._id.toString(),
      `Created product "${name}" - ₱${price}`,
      'Success',
      { action: 'create', productName: name, price, category }
    );

    console.log('✅ Product logged successfully');

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'unknown',
        `Failed to create product: ${error.message}`,
        'Failure',
        { action: 'create', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log product creation failure:", logError);
    }
    
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
    const products = await Product.find({ deletedAt: null }).sort({ createdAt: -1 });
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

  console.log("UPDATE PRODUCT ROUTE CALLED");
  
  try {
    const { name, description, price, quantity, category, isFeatured } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const originalName = product.name;
      const changes = [];

      if (name && name !== product.name) changes.push('name');
      if (description && description !== product.description) changes.push('description');
      if (price && price !== product.price) changes.push('price');
      if (quantity !== undefined && quantity !== product.quantity) changes.push('quantity');
      if (category && category !== product.category) changes.push('category');
      if (isFeatured !== undefined && isFeatured !== product.isFeatured) changes.push('featured status');

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.quantity = quantity || product.quantity;
      product.category = category || product.category;
      product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

      if (req.file && req.file.buffer) {
        changes.push('image');
        // Delete old Cloudinary image if it exists
        if (product.imagePublicId) {
          try {
            await productCloudinary.uploader.destroy(product.imagePublicId);
          } catch (err) {
            console.warn('Failed to delete old Cloudinary product image:', err?.message || err);
          }
        }

        try {
          const uploadResult = await new Promise((resolve, reject) => {
            productCloudinary.uploader
              .upload_stream(
                {
                  folder: 'products',
                  resource_type: 'image',
                },
                (error, result) => {
                  if (error) return reject(error);
                  resolve(result);
                }
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

      const updatedProduct = await product.save();

      // LOG PRODUCT UPDATE
      try {
        await createLog(
          'Product Edit',
          req.user?.username || req.user?.email || 'Admin',
          updatedProduct._id.toString(),
          `Updated product "${originalName}"${changes.length > 0 ? ` - Changed: ${changes.join(', ')}` : ''}`,
          'Success',
          { action: 'update', productName: originalName, changedFields: changes }
        );
      } catch (logError) {
        console.error("Failed to log product update:", logError);
      }

      res.json({ message: "Product updated", product: updatedProduct });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        req.params.id,
        `Failed to update product: ${error.message}`,
        'Failure',
        { action: 'update', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log product update failure:", logError);
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Delete a product (hard delete)
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const productName = product.name;

      // If the product has an image, delete it from Cloudinary or filesystem (legacy)
      if (product.imagePublicId) {
        try {
          await productCloudinary.uploader.destroy(product.imagePublicId);
        } catch (err) {
          console.warn('Failed to delete Cloudinary product image:', err?.message || err);
        }
      } else if (product.image && typeof product.image === 'string' && product.image.startsWith('/uploads')) {
        const imagePath = path.join(__dirname, '..', product.image);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Failed to delete image file: ${imagePath}`, err);
          }
        });
      }

      await product.deleteOne();

      // LOG PRODUCT DELETION
      try {
        await createLog(
          'Product Edit',
          req.user?.username || req.user?.email || 'Admin',
          req.params.id,
          `Permanently deleted product "${productName}"`,
          'Success',
          { action: 'delete', productName }
        );
      } catch (logError) {
        console.error("Failed to log product deletion:", logError);
      }

      res.json({ message: "Product and associated image removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        req.params.id,
        `Failed to delete product: ${error.message}`,
        'Failure',
        { action: 'delete', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log product deletion failure:", logError);
    }
    
    res.status(500).json({ message: "Server error while deleting product." });
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

    // LOG CATEGORY UPDATE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'Admin',
        'bulk',
        `Updated category from "${oldCategory}" to "${newCategory}" for ${result.modifiedCount} products`,
        'Success',
        { action: 'category_update', oldCategory, newCategory, count: result.modifiedCount }
      );
    } catch (logError) {
      console.error("Failed to log category update:", logError);
    }

    res.json({ message: `${result.modifiedCount} products updated from category "${oldCategory}" to "${newCategory}".`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error updating product category name:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'bulk',
        `Failed to update category: ${error.message}`,
        'Failure',
        { action: 'category_update', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log category update failure:", logError);
    }
    
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

    // LOG BULK CATEGORY UPDATE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'Admin',
        'bulk',
        `Bulk updated ${result.modifiedCount} products to category "${newCategory}"`,
        'Success',
        { action: 'bulk_category_update', newCategory, count: result.modifiedCount, productIds }
      );
    } catch (logError) {
      console.error("Failed to log bulk category update:", logError);
    }

    res.json({ message: `${result.modifiedCount} products updated successfully.`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error bulk updating product categories:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'bulk',
        `Failed bulk category update: ${error.message}`,
        'Failure',
        { action: 'bulk_category_update', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log bulk category update failure:", logError);
    }
    
    res.status(500).json({ message: "Server error while bulk updating products." });
  }
};

/**
 * @desc    Bulk delete products (hard delete)
 * @route   DELETE /api/v1/products/bulk
 * @access  Private/Admin
 */
const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }

    // Find products to get their image IDs/paths for deletion
    const productsToDelete = await Product.find({ _id: { $in: productIds } });
    const productNames = productsToDelete.map(p => p.name);

    // Delete associated images from Cloudinary or filesystem (legacy)
    const imageDeletionPromises = productsToDelete.map(p => {
      if (p.imagePublicId) {
        return productCloudinary.uploader.destroy(p.imagePublicId).catch(err => {
          console.warn('Could not delete Cloudinary image:', p.imagePublicId, err?.message || err);
        });
      }
      if (p.image && typeof p.image === 'string' && p.image.startsWith('/uploads')) {
        const imagePath = path.join(__dirname, '..', p.image);
        return fs.promises.unlink(imagePath).catch(err => {
          console.warn(`Could not delete image (it may not exist): ${imagePath}`, err?.code || err);
        });
      }
      return Promise.resolve();
    });

    await Promise.all(imageDeletionPromises);

    // Delete products from the database
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    // LOG BULK DELETION
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'Admin',
        'bulk',
        `Bulk deleted ${result.deletedCount} products: ${productNames.join(', ')}`,
        'Success',
        { action: 'bulk_delete', count: result.deletedCount, productNames }
      );
    } catch (logError) {
      console.error("Failed to log bulk deletion:", logError);
    }

    res.json({ message: `${result.deletedCount} products deleted successfully.` });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'bulk',
        `Failed bulk deletion: ${error.message}`,
        'Failure',
        { action: 'bulk_delete', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log bulk deletion failure:", logError);
    }
    
    res.status(500).json({ message: "Server error during bulk deletion." });
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
      const originalStatus = product.isFeatured;
      product.isFeatured = !product.isFeatured;
      await product.save();

      // LOG FEATURED TOGGLE
      try {
        await createLog(
          'Product Edit',
          req.user?.username || req.user?.email || 'Admin',
          product._id.toString(),
          `${product.isFeatured ? 'Featured' : 'Unfeatured'} product "${product.name}"`,
          'Success',
          { action: 'toggle_featured', productName: product.name, newStatus: product.isFeatured }
        );
      } catch (logError) {
        console.error("Failed to log featured toggle:", logError);
      }

      res.json({ message: "Product featured status updated", product });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error toggling product featured status:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        req.params.id,
        `Failed to toggle featured status: ${error.message}`,
        'Failure',
        { action: 'toggle_featured', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log featured toggle failure:", logError);
    }
    
    res.status(500).json({ message: "Server error while toggling product featured status." });
  }
};

/**
 * @desc    Soft delete a product (move to trash)
 * @route   PATCH /api/v1/products/:id/soft-delete
 * @access  Private/Admin
 */
const softDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    if (!product.deletedAt) {
      product.deletedAt = new Date();
      await product.save();

      // LOG SOFT DELETE
      try {
        await createLog(
          'Product Edit',
          req.user?.username || req.user?.email || 'Admin',
          product._id.toString(),
          `Moved product "${product.name}" to trash`,
          'Success',
          { action: 'soft_delete', productName: product.name }
        );
      } catch (logError) {
        console.error("Failed to log soft delete:", logError);
      }
    }
    res.json({ message: 'Product moved to trash', product });
  } catch (error) {
    console.error('Error soft deleting product:', error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        req.params.id,
        `Failed to move product to trash: ${error.message}`,
        'Failure',
        { action: 'soft_delete', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log soft delete failure:", logError);
    }
    
    res.status(500).json({ message: 'Server error while soft deleting product.' });
  }
};

/**
 * @desc    Bulk soft delete products (move to trash)
 * @route   POST /api/v1/products/bulk-soft-delete
 * @access  Private/Admin
 */
const bulkSoftDelete = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }

    const productsToDelete = await Product.find({ _id: { $in: productIds } });
    const productNames = productsToDelete.map(p => p.name);

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { deletedAt: new Date() } }
    );

    // LOG BULK SOFT DELETE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'Admin',
        'bulk',
        `Moved ${result.modifiedCount} products to trash: ${productNames.join(', ')}`,
        'Success',
        { action: 'bulk_soft_delete', count: result.modifiedCount, productNames }
      );
    } catch (logError) {
      console.error("Failed to log bulk soft delete:", logError);
    }

    res.json({ message: `${result.modifiedCount} products moved to trash.`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error bulk soft deleting products:', error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'bulk',
        `Failed bulk soft delete: ${error.message}`,
        'Failure',
        { action: 'bulk_soft_delete', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log bulk soft delete failure:", logError);
    }
    
    res.status(500).json({ message: 'Server error during bulk soft delete.' });
  }
};

/**
 * @desc    Get soft-deleted products (trash)
 * @route   GET /api/v1/products/deleted
 * @access  Private/Admin
 */
const getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching deleted products:', error);
    res.status(500).json({ message: 'Server error while fetching deleted products.' });
  }
};

/**
 * @desc    Bulk restore soft-deleted products
 * @route   POST /api/v1/products/bulk-restore
 * @access  Private/Admin
 */
const bulkRestoreProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }

    const productsToRestore = await Product.find({ _id: { $in: productIds } });
    const productNames = productsToRestore.map(p => p.name);

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { deletedAt: null } }
    );

    // LOG BULK RESTORE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'Admin',
        'bulk',
        `Restored ${result.modifiedCount} products from trash: ${productNames.join(', ')}`,
        'Success',
        { action: 'bulk_restore', count: result.modifiedCount, productNames }
      );
    } catch (logError) {
      console.error("Failed to log bulk restore:", logError);
    }

    res.json({ message: `${result.modifiedCount} products restored.`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error bulk restoring products:', error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'bulk',
        `Failed bulk restore: ${error.message}`,
        'Failure',
        { action: 'bulk_restore', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log bulk restore failure:", logError);
    }
    
    res.status(500).json({ message: 'Server error during bulk restore.' });
  }
};

/**
 * @desc    Bulk permanent delete products (from trash)
 * @route   POST /api/v1/products/bulk-permanent-delete
 * @access  Private/Admin
 */
const bulkPermanentDelete = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }

    // Find products to get their image IDs/paths for deletion
    const productsToDelete = await Product.find({ _id: { $in: productIds } });
    const productNames = productsToDelete.map(p => p.name);

    // Delete associated images from Cloudinary or filesystem (legacy)
    const imageDeletionPromises = productsToDelete.map(p => {
      if (p.imagePublicId) {
        return productCloudinary.uploader.destroy(p.imagePublicId).catch(err => {
          console.warn('Could not delete Cloudinary image:', p.imagePublicId, err?.message || err);
        });
      }
      if (p.image && typeof p.image === 'string' && p.image.startsWith('/uploads')) {
        const imagePath = path.join(__dirname, '..', p.image);
        return fs.promises.unlink(imagePath).catch(err => {
          console.warn(`Could not delete image (it may not exist): ${imagePath}`, err?.code || err);
        });
      }
      return Promise.resolve();
    });

    await Promise.all(imageDeletionPromises);

    // Delete products from the database
    const result = await Product.deleteMany({ _id: { $in: productIds } });

    // LOG BULK PERMANENT DELETE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'Admin',
        'bulk',
        `Permanently deleted ${result.deletedCount} products from trash: ${productNames.join(', ')}`,
        'Success',
        { action: 'bulk_permanent_delete', count: result.deletedCount, productNames }
      );
    } catch (logError) {
      console.error("Failed to log bulk permanent delete:", logError);
    }

    res.json({ message: `${result.deletedCount} products permanently deleted.` });
  } catch (error) {
    console.error('Error bulk permanently deleting products:', error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Product Edit',
        req.user?.username || req.user?.email || 'System',
        'bulk',
        `Failed bulk permanent delete: ${error.message}`,
        'Failure',
        { action: 'bulk_permanent_delete', error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log bulk permanent delete failure:", logError);
    }
    
    res.status(500).json({ message: 'Server error during bulk permanent deletion.' });
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
  softDeleteProduct,
  bulkSoftDelete,
  getDeletedProducts,
  bulkRestoreProducts,
  bulkPermanentDelete,
};
