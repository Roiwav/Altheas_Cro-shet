const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: false, // ← CHANGED FROM true TO false
      default: 0       // ← ADDED DEFAULT VALUE
    },
    image: {
      type: String,
      required: true, // store image URL or filename
    },
    imagePublicId: {
      type: String, // optional Cloudinary public ID for product image
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Admin-controlled badges for highlighting products on the frontend
    // Allowed values: bestSeller, bestChoice, new
    badges: {
      type: String,
      enum: ["bestSeller", "bestChoice", "new", ""],
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
