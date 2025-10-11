const Order = require("../models/Order");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary');
const Notification = require('../models/Notification');
const { getIo } = require('../socket');

// ✅ Create new order
const createOrder = async (req, res) => {
  try {
    // Parse the orderData JSON string from FormData
    const orderData = JSON.parse(req.body.orderData);
    
    const { 
      userId, 
      username, 
      products, 
      shippingAddress, 
      shippingFee, 
      total, 
      paymentMethod 
    } = orderData;

    if (!userId || !products || products.length === 0) {
      return res.status(400).json({ message: "Missing order data." });
    }

    // Upload payment proof to Cloudinary
    let paymentProofUrl = null;

    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'payment_proofs',
                resource_type: 'image',
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            )
            .end(req.file.buffer);
        });
        paymentProofUrl = uploadResult.secure_url;
      } catch (err) {
        console.error('❌ Cloudinary upload error:', err);
        return res.status(500).json({ message: 'Failed to upload payment proof' });
      }
    } else {
      return res.status(400).json({ message: 'Payment proof image is required' });
    }

    const newOrder = new Order({
      userId,
      username,
      products,
      shippingAddress,
      shippingFee,
      total,
      paymentMethod,
      paymentProofUrl,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ✅ Admin: mark a cancelled product as DONE (refund completed)
const markCancelledProductDone = async (req, res) => {
  try {
    const { id: orderId, productId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const p = order.products.find(
      (product) => (product.productId === productId || product._id?.toString() === productId)
    );
    if (!p) return res.status(404).json({ message: 'Product not found in order' });
    if (!p.cancelled) return res.status(400).json({ message: 'Product is not marked as cancelled' });

    p.refundStatus = 'Completed';
    p.refundConfirmedAt = new Date();

    // Optional: if all cancelled items are completed, set order-level refund status
    const cancelledItems = order.products.filter((pr) => pr.cancelled);
    const allCompleted = cancelledItems.length > 0 && cancelledItems.every((pr) => pr.refundStatus === 'Completed');
    if (allCompleted) {
      order.refundStatus = 'Completed';
      order.refundProcessedAt = new Date();
    }

    await order.save();

    return res.json({
      message: 'Cancelled item marked as done',
      order,
      success: true,
    });
  } catch (error) {
    console.error('❌ Error marking cancelled product as done:', error);
    res.status(500).json({ message: 'Failed to mark cancelled product as done' });
  }
};

// ✅ Fetch orders for logged-in user
const getMyOrders = async (req, res) => {
  try {
    // Extract user ID from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ orders }); // ✅ Wrap in an object
  } catch (error) {
    console.error("❌ Error fetching my orders:", error);
    res.status(500).json({ message: "Failed to fetch my orders" });
  }
};

// ✅ Fetch all orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email");
    res.json(orders); 
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ✅ Fetch single order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("❌ Error fetching order by ID:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ✅ Update order status (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, rejectionReason, adminName } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    order.status = status || order.status;
    order.statusUpdatedAt = new Date();
    order.statusUpdatedBy = adminName || 'Admin';

    // ✅ Handle different status changes
    switch (status?.toLowerCase()) {
      case 'cancelled':
        order.statusMessage = "Your order has been cancelled. A full refund will be processed within 5-7 business days.";
        order.refundStatus = 'Processing';
        order.refundAmount = order.total;
        order.refundEstimatedDays = 7;
        break;
        
      case 'rejected':
        order.statusMessage = rejectionReason 
          ? `Your order has been rejected. Reason: ${rejectionReason}. A full refund will be processed within 5-7 business days.`
          : "Your order has been rejected due to product availability or payment issues. A full refund will be processed within 5-7 business days.";
        order.rejectionReason = rejectionReason;
        order.refundStatus = 'Processing';
        order.refundAmount = order.total;
        order.refundEstimatedDays = 7;
        break;
        
      case 'processing':
        order.statusMessage = "Your order is now being prepared. We'll notify you once it's ready for shipping.";
        break;
        
      case 'shipped':
        order.statusMessage = "Great news! Your order has been shipped and is on its way to you.";
        break;
        
      case 'delivered':
        order.statusMessage = "Your order has been successfully delivered. Thank you for your purchase!";
        break;
        
      case 'pending':
        order.statusMessage = "Your order is pending review. We'll update you soon.";
        break;
        
      default:
        order.statusMessage = `Your order status has been updated to ${status}.`;
    }

    await order.save();

    res.json({ 
      message: "Order status updated successfully", 
      order,
      success: true 
    });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
};

// ✅ Cancel an order item (User)
const cancelOrderItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = "Cancelled";
    await order.save();

    res.json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

const cancelOrderProduct = async (req, res) => {
  try {
    const { id: orderId, productId } = req.params;
    const { cancellationReason } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the product in the order
    const productIndex = order.products.findIndex(
      product => (product.productId === productId || product._id?.toString() === productId)
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in order" });
    }

    // Mark the product as cancelled instead of removing it
    order.products[productIndex].cancelled = true;
    order.products[productIndex].cancellationReason = cancellationReason || 'No reason provided';
    order.products[productIndex].cancelledAt = new Date();
    order.products[productIndex].refundStatus = 'Pending';

    // Add a status message about the cancellation
    order.statusMessage = `Item "${order.products[productIndex].name}" cancelled: ${cancellationReason || 'No reason provided'}`;
    order.statusUpdatedAt = new Date();

    // Check if all products are cancelled
    const allCancelled = order.products.every(product => product.cancelled);
    
    if (allCancelled) {
      order.status = 'Cancelled';
      order.statusMessage = 'All items in this order have been cancelled';
      order.statusUpdatedAt = new Date();
      
      await order.save();
      
      return res.status(200).json({ 
        message: "All items cancelled and order closed", 
        order,
        orderDeleted: false
      });
    }

    // Recalculate total only for non-cancelled items
    const newSubtotal = order.products
      .filter(product => !product.cancelled)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
    order.total = newSubtotal + (order.shippingFee || 0);

    await order.save();

    // TODO: Notify admin about the cancellation
    // You can implement email or notification system here

    res.status(200).json({ 
      message: "Item cancelled successfully", 
      order,
      orderDeleted: false 
    });
  } catch (error) {
    console.error("❌ Error cancelling product:", error);
    res.status(500).json({ message: "Failed to cancel product" });
  }
};

// ✅ Admin: confirm a cancelled product and notify customer
const confirmCancelledProduct = async (req, res) => {
  try {
    const { id: orderId, productId } = req.params;
    const { etaHours = 24, amount, message } = req.body || {};

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const p = order.products.find(
      (product) => (product.productId === productId || product._id?.toString() === productId)
    );
    if (!p) return res.status(404).json({ message: 'Product not found in order' });
    if (!p.cancelled) return res.status(400).json({ message: 'Product is not marked as cancelled' });

    // Set refund details
    const refundAmount = typeof amount === 'number' ? amount : (p.price || 0) * (p.quantity || 1);
    p.refundStatus = 'Processing';
    p.refundAmount = refundAmount;
    p.refundETAHours = Number(etaHours) || 24;
    p.refundConfirmedAt = new Date();

    // Optional: update order level message
    order.statusMessage = message || `Your refund for ${p.name} is being processed and will be returned within ${p.refundETAHours} hour(s).`;
    order.statusUpdatedAt = new Date();

    await order.save();

    // Create a notification for the user
    try {
      const createdNotif = await Notification.create({
        userId: order.userId,
        title: 'Refund processing',
        message: `Your cancellation for "${p.name}" has been confirmed. Refund of ₱${refundAmount?.toFixed(2)} will be returned within ${p.refundETAHours} hour(s).`,
        type: 'refund',
        orderId: order._id.toString(),
      });

      // Emit a socket event to the user's room for real-time updates
      try {
        const io = getIo();
        if (io) {
          io.to(`user:${order.userId}`).emit('notification:new', createdNotif);
        }
      } catch (emitErr) {
        console.error('Socket emit failed:', emitErr);
      }
    } catch (e) {
      console.error('Failed to create notification:', e);
      // Do not fail the request because of notification issues
    }

    res.json({
      message: 'Cancellation confirmed and customer notified',
      order,
      success: true,
    });
  } catch (error) {
    console.error('❌ Error confirming cancelled product:', error);
    res.status(500).json({ message: 'Failed to confirm cancelled product' });
  }
};

// ✅ Delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  cancelOrderItem,
  cancelOrderProduct,
  confirmCancelledProduct,
  markCancelledProductDone,
};
