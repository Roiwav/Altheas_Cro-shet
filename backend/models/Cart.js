// models/Cart.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  // ✅ Change to String to avoid ObjectId casting errors
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  qty: { type: Number, required: true, min: [1, "Quantity can not be less than 1."] },
});

const cartSchema = new Schema({
  userId: { type: String, required: true },
  items: [cartItemSchema],
  region: { type: String, default: "" },
  city: { type: String, default: "" },
  shippingFee: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);