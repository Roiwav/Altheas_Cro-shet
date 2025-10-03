const mongoose = require('mongoose');
const { Schema } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);

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

     color: { // ✅ Add this field to capture the AR flower color
        type: String
     },
     
    image: {
        type: String
    }
}, { _id: true }); // Let Mongoose manage the _id for subdocuments

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
    orderNumber: {
        type: Number,
        unique: true
        // This will be auto-populated by the plugin
    },
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
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'GCash'],
        default: 'COD'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true // This adds `createdAt` and `updatedAt` fields automatically
});

// Add the auto-increment plugin to the schema
orderSchema.plugin(AutoIncrement, { inc_field: 'orderNumber' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;