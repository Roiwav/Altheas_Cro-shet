const mongoose = require('mongoose');
const { Schema } = mongoose;
const { customAlphabet } = require('nanoid');

// Define a function to generate a unique, 8-character alphanumeric ID
const generateOrderID = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

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
    orderId: {
        type: String,
        unique: true,
        // We will generate this before saving
    },
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

// This is the pre-save middleware. Before a new order is saved,
// this function will run.
orderSchema.pre('save', function (next) {
  // We only want to generate an orderId if it's a new order.
  if (this.isNew && !this.orderId) {
    // Generate a unique ID and assign it to the orderId field.
    this.orderId = `AL-${generateOrderID()}`;
  }
  next(); // Continue with the save operation
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;