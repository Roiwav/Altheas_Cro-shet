// models/Cart.js
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, // ✅ UPDATED: Use ObjectId for referencing
            required: true, 
            unique: true 
        },
        username: { // ✅ ADDED: Field for the user's username
            type: String, 
            required: true 
        },
        items: [
            {
                productId: { type: String, required: true },
                name: String,
                price: Number,
                qty: { type: Number, default: 1 },
            },
        ],
        // ✅ ADDED: Fields for shipping information
        region: { type: String, default: "" },
        city: { type: String, default: "" },
        shippingFee: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema, "carts");