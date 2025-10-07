const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");

const router = express.Router();

// 🖼️ Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/products"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// ✅ Create new product
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const newProduct = new Product({
      name,
      description,
      price,
      quantity,
      image: `/uploads/products/${req.file.filename}`,
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// ✅ Update product
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;
    const updateData = { name, description, price, quantity };
    if (req.file) updateData.image = `/uploads/products/${req.file.filename}`;

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: "Product updated successfully", product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

// ✅ Delete product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
