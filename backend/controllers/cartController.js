import Cart from "../models/Cart.js";
import mongoose from "mongoose";

// GET cart by userId
export const getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        // ✅ UPDATED: Validate userId to be a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        
        let cart = await Cart.findOne({ userId });
        if (!cart) cart = { userId, items: [], region: "", city: "", shippingFee: 0 }; // return empty cart with default shipping info
        res.status(200).json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST/PUT cart for user
export const saveCart = async (req, res) => {
    try {
        const { userId } = req.params;
        // ✅ UPDATED: Get username and shipping info from body
        const { username, items, region, city, shippingFee } = req.body; 

        if (!userId || !Array.isArray(items) || !username) {
            return res.status(400).json({ message: "Invalid input" });
        }
        
        // ✅ UPDATED: Validate userId to be a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Upsert: update if exists, otherwise create
        const updatedCart = await Cart.findOneAndUpdate(
            { userId },
            // ✅ UPDATED: Pass all fields to be updated/created
            { username, items, region, city, shippingFee }, 
            { new: true, upsert: true } // create if not exists
        );

        res.status(200).json(updatedCart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};