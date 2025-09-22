import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // link to logged-in user
  products: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      variation: String,
    },
  ],
  region: String,
  city: String,
  shippingFee: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", OrderSchema);
