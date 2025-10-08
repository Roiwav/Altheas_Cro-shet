const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String },
  orderNumber: { 
    type: String, 
    unique: true
  },
  products: [
    {
      productId: { type: String, required: true },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      color: String,
      variation: String,
      cancelled: { type: Boolean, default: false },
      cancellationReason: String,
      cancelledAt: Date,
    }
  ],
  shippingAddress: {
    line1: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  shippingFee: Number,
  total: Number,
  paymentMethod: String,
  paymentProofUrl: String,
  paymentStatus: { type: String, default: 'Pending Verification' },
  status: { type: String, default: 'Pending' },
  
  // ✅ NEW: Status message and refund info
  statusMessage: { type: String }, // Message to show to customer
  rejectionReason: { type: String }, // Reason for rejection
  refundStatus: { 
    type: String, 
    enum: ['Not Required', 'Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Not Required'
  },
  refundAmount: { type: Number },
  refundProcessedAt: { type: Date },
  refundEstimatedDays: { type: Number, default: 7 }, // Default 7 days for refund processing
  statusUpdatedAt: { type: Date, default: Date.now },
  statusUpdatedBy: { type: String }, // Admin who updated the status
  
  createdAt: { type: Date, default: Date.now }
});

// Generate sequential order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const lastOrder = await this.constructor.findOne(
        { orderNumber: { $regex: /^ORD-\d+$/ } }, 
        { orderNumber: 1 }, 
        { sort: { orderNumber: -1 } }
      );
      
      let nextNumber = 1;
      
      if (lastOrder && lastOrder.orderNumber) {
        const match = lastOrder.orderNumber.match(/^ORD-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.orderNumber = `ORD-${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
