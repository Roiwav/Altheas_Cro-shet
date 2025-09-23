const mongoose = require('mongoose');
const { Schema } = mongoose;

// This defines the structure for each product within a cart
const cartItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variation: String,
    image: String
}, { _id: false });

// This defines the structure for the shipping address
const shippingAddressSchema = new Schema({
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    label: { type: String }
}, { _id: false });

// This is the main schema for the 'carts' collection
const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    shippingAddress: shippingAddressSchema,
    shippingFee: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;