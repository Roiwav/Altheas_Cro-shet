const mongoose = require('mongoose');
const { Schema } = mongoose;

// This defines the structure for each product within an order
const orderProductSchema = new Schema({
    productId: {
        type: String, // Using String to be flexible with product IDs from different sources
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    variation: String,
    image: {
        type: String
    }
}, { _id: false }); // _id: false because this is a subdocument

// This is the main schema for the 'orders' collection
const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    products: [orderProductSchema],
    shippingAddress: {
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
}, {
    timestamps: true // This adds `createdAt` and `updatedAt` fields automatically
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;