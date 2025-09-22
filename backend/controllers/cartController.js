// controllers/cartController.js
const Cart = require("../models/Cart");

// Get a user's cart
exports.getCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });
    
    // ... (rest of the code is the same)
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Update or create a user's cart
exports.updateCart = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { items, region, city, shippingFee } = req.body;

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { items, region, city, shippingFee },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            message: "Cart updated successfully.",
            cart,
        });
    } catch (error) {
        // ✅ The fix: Log the error in a way that will always show up.
        console.log("Error details:", error);
        
        // This part is what sends the 500 status to the frontend.
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};