const Cart = require("../models/Cart.js");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

// GET cart by userId or guestId
const getCart = async (req, res) => {
    try {
        const { userId, guestId } = req.query;

        let cart;
        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            cart = await Cart.findOne({ userId });
        } else if (guestId) {
            cart = await Cart.findOne({ guestId });
        }

        if (!cart) {
            // Return a default empty cart structure, but don't save it yet.
            // A new cart is only created when an item is added.
            const emptyCart = {
                items: [],
                shippingAddress: null,
                shippingFee: 0,
            };
            return res.status(200).json(emptyCart);
        }

        res.status(200).json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST/PUT cart for user or guest
const saveCart = async (req, res) => {
    try {
        const { userId, guestId } = req.query;
        const { username, items, shippingAddress, shippingFee } = req.body;

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid input" });
        }

        let query;
        let newGuestId = null;

        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            query = { userId };
        } else if (guestId) {
            query = { guestId };
        } else {
            // This is a new guest cart
            newGuestId = uuidv4();
            query = { guestId: newGuestId };
        }

        // Upsert: update if exists, otherwise create
        const updatedCart = await Cart.findOneAndUpdate(
            query,
            { ...query, username, items, shippingAddress, shippingFee },
            { new: true, upsert: true } // create if not exists
        );

        res.status(200).json(updatedCart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST merge guest cart into user cart on login
const mergeCart = async (req, res) => {
    try {
        const { userId, guestId } = req.body;

        if (!userId || !guestId) {
            return res.status(400).json({ message: "User ID and Guest ID are required for merging." });
        }

        const userCart = await Cart.findOne({ userId });
        const guestCart = await Cart.findOne({ guestId });

        if (!guestCart) {
            // No guest cart to merge, just return the user's cart or nothing
            return res.status(200).json(userCart || { items: [] });
        }

        if (!userCart) {
            // No existing user cart, so we just assign the guest cart to the user.
            guestCart.userId = userId;
            guestCart.guestId = undefined; // Clear the guestId
            await guestCart.save();
            return res.status(200).json(guestCart);
        }

        // Both carts exist, merge them.
        const mergedItems = new Map();
        [...(userCart.items || []), ...(guestCart.items || [])].forEach(item => {
            // Use a composite key to correctly handle variations
            const key = item.variation ? `${item.productId}-${item.variation}` : item.productId;
            if (mergedItems.has(key)) {
                mergedItems.get(key).quantity += item.quantity;
            } else {
                mergedItems.set(key, { ...item.toObject() });
            }
        });

        userCart.items = Array.from(mergedItems.values());
        await userCart.save();
        await Cart.deleteOne({ _id: guestCart._id }); // Remove the old guest cart

        res.status(200).json(userCart);
    } catch (err) {
        console.error("Cart merge error:", err);
        res.status(500).json({ message: "Server error during cart merge" });
    }
};

module.exports = {
    getCart,
    saveCart,
    mergeCart,
};