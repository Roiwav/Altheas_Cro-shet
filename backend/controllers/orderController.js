// controllers/orderController.js
const Order = require('../models/Order.js');

const createOrder = async (req, res) => {
    try {
        const { userId, username, products, region, city, shippingFee, total } = req.body;

        if (!userId || !products || !products.length || !total) {
            return res.status(400).json({ success: false, message: 'Invalid order data' });
        }

        const newOrder = new Order({
            userId,
            username,
            products,
            region,
            city,
            shippingFee,
            total
        });

        await newOrder.save();

        res.status(201).json({ success: true, message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { createOrder };