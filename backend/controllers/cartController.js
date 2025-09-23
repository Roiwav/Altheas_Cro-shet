const Cart = require("../models/Cart.js");
const mongoose = require("mongoose");

// GET cart by userId
const getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        // ✅ UPDATED: Validate userId to be a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = { userId, items: [], shippingAddress: null, shippingFee: 0 };
        }
        res.status(200).json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST/PUT cart for user
const saveCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, items, shippingAddress, shippingFee } = req.body; 

        if (!userId || !Array.isArray(items) || !username) {
            return res.status(400).json({ message: "Invalid input" });
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) { // ✅ UPDATED: Validate userId to be a valid ObjectId
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Upsert: update if exists, otherwise create
        const updatedCart = await Cart.findOneAndUpdate(
            { userId },
            { username, items, shippingAddress, shippingFee }, // ✅ UPDATED: Pass all fields to be updated/created
            { new: true, upsert: true } // create if not exists
        );

        res.status(200).json(updatedCart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getCart,
    saveCart,
};