const Order = require("../models/Order");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary');
const Notification = require('../models/Notification');
const { createLog } = require('./logController');

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

    // LOG ORDER CREATION
    try {
      await createLog(
        'Order Creation',
        username || userId || 'Customer',
        newOrder._id.toString(),
        `Order created for ₱${total} - ${products.length} item(s)`,
        'Success',
        { orderTotal: total, productCount: products.length, paymentMethod }
      );
    } catch (logError) {
      console.error("Failed to log order creation:", logError);
    }

    res.status(201).json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    
    // LOG FAILURE
    try {
      await createLog(
        'Order Creation',
        'System',
        'unknown',
        `Failed to create order: ${error.message}`,
        'Failure',
        { error: error.message }
      );
    } catch (logError) {
      console.error("Failed to log order creation failure:", logError);
    }
    
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ✅ Update order status (Admin) - WITH LOGGING - FIXED VERSION
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
    order.statusUpdatedBy = adminName || req.user?.username || req.user?.email || 'Admin';

    // --- Handle products for "rejected" or "cancelled" orders ---
    if (status?.toLowerCase() === "rejected" || status?.toLowerCase() === "cancelled") {
      order.products.forEach((p) => {
        p.cancelled = true;
        p.cancellationReason = status?.toLowerCase() === "rejected"
          ? (rejectionReason || "Rejected by admin")
          : "Order cancelled";
        p.cancelledAt = new Date();
        p.refundStatus = "Pending";
      });
    }

    // --- Status messages, refund logic as before ---
    switch (status?.toLowerCase()) {
      case 'cancelled':
        order.statusMessage = "Your order has been cancelled. A full refund will be processed within 5-7 business days.";
        order.refundStatus = 'Processing';
        order.refundAmount = order.total;
        order.refundEstimatedDays = 7;
        break;
      case 'rejected':
        if (!rejectionReason) {
          return res.status(400).json({ message: "A reason is required to reject an order." });
        }
        order.statusMessage = `Your order has been rejected. Reason: ${rejectionReason}. A full refund will be processed within 5-7 business days.`;
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

    // (Logging, notifications, and response code remains unchanged)
    try {
      await createLog(
        'Order Update',
        order.statusUpdatedBy,
        order._id.toString(),
        `Order status changed from ${previousStatus} to ${status}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`,
        'Success',
        { 
          previousStatus,
          newStatus: status,
          orderId: order._id,
          rejectionReason: rejectionReason || null,
          orderNumber: order.orderNumber
        }
      );
    } catch (logError) {
      console.error("Failed to log order status update:", logError);
    }

    if (previousStatus !== status) {
      try {
        await Notification.create({
          userId: order.userId,
          title: `Order Status Updated: ${status}`,
          message: order.statusMessage || `Your order #${order.orderNumber || order._id.toString().substring(0, 8)} is now ${status}.`,
          type: 'order',
          orderId: order._id.toString(),
        });
      } catch (notificationError) {
        console.error('Failed to create notification for status update:', notificationError);
      }
    }

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


// ✅ Cancel an order item (User) - WITH LOGGING
const cancelOrderItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = "Cancelled";
    
    // Mark all products as cancelled
    order.products.forEach(p => {
      p.cancelled = true;
      p.cancellationReason = "Order cancelled by customer";
      p.cancelledAt = new Date();
      p.refundStatus = "Pending";
    });

    await order.save();

    // LOG USER CANCELLATION
    try {
      await createLog(
        'Order Update',
        order.username || order.userId || 'User',
        order._id.toString(),
        'Order was cancelled by customer',
        'Success',
        { orderId: order._id, orderNumber: order.orderNumber }
      );
    } catch (logError) {
      console.error("Failed to log order cancellation:", logError);
    }

    res.json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// ✅ Cancel a product in an order (User) - WITH LOGGING
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

    const productName = order.products[productIndex].name;

    // Mark the product as cancelled instead of removing it
    order.products[productIndex].cancelled = true;
    order.products[productIndex].cancellationReason = cancellationReason || 'No reason provided';
    order.products[productIndex].cancelledAt = new Date();
    order.products[productIndex].refundStatus = 'Pending';

    // Add a status message about the cancellation
    order.statusMessage = `Item "${productName}" cancelled: ${cancellationReason || 'No reason provided'}`;
    order.statusUpdatedAt = new Date();

    // Check if all products are cancelled
    const allCancelled = order.products.every(product => product.cancelled);
    if (allCancelled) {
      order.status = 'Cancelled';
      order.statusMessage = 'All items in this order have been cancelled';
      order.statusUpdatedAt = new Date();
    }

    // Recalculate total only for non-cancelled items
    const newSubtotal = order.products
      .filter(product => !product.cancelled)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    order.total = newSubtotal + (order.shippingFee || 0);

    await order.save();

    // LOG PRODUCT CANCELLATION
    try {
      await createLog(
        'Order Update',
        order.username || order.userId || 'Customer',
        order._id.toString(),
        `Product "${productName}" cancelled by customer - Reason: ${cancellationReason || 'No reason provided'}`,
        'Success',
        { 
          orderId: order._id,
          productId,
          productName,
          cancellationReason: cancellationReason || 'No reason provided',
          orderNumber: order.orderNumber
        }
      );
    } catch (logError) {
      console.error("Failed to log product cancellation:", logError);
    }

    res.status(200).json({
      message: allCancelled ? "All items cancelled and order closed" : "Item cancelled successfully",
      order,
      orderDeleted: false
    });
  } catch (error) {
    console.error("❌ Error cancelling product:", error);
    res.status(500).json({ message: "Failed to cancel product" });
  }
};

// ✅ Admin: confirm a cancelled product and notify customer - WITH LOGGING
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

    // LOG ADMIN CONFIRMATION
    try {
      await createLog(
        'Order Update',
        req.user?.username || req.user?.email || 'Admin',
        order._id.toString(),
        `Admin confirmed refund for cancelled product "${p.name}" - ₱${refundAmount} within ${p.refundETAHours}h`,
        'Success',
        { 
          orderId: order._id,
          productId,
          productName: p.name,
          refundAmount,
          etaHours: p.refundETAHours,
          orderNumber: order.orderNumber
        }
      );
    } catch (logError) {
      console.error("Failed to log refund confirmation:", logError);
    }

    // Create a notification for the user
    try {
      await Notification.create({
        userId: order.userId,
        title: 'Refund processing',
        message: `Your cancellation for "${p.name}" has been confirmed. Refund of ₱${refundAmount?.toFixed(2)} will be returned within ${p.refundETAHours} hour(s).`,
        type: 'refund',
        orderId: order._id.toString(),
      });
    } catch (e) {
      console.error('Failed to create notification:', e);
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

// ✅ Admin: mark a cancelled product as DONE (refund completed) - WITH LOGGING
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

    // LOG COMPLETION
    try {
      await createLog(
        'Order Update',
        req.user?.username || req.user?.email || 'Admin',
        order._id.toString(),
        `Refund completed for cancelled product "${p.name}"`,
        'Success',
        { 
          orderId: order._id,
          productId,
          productName: p.name,
          refundAmount: p.refundAmount,
          orderNumber: order.orderNumber
        }
      );
    } catch (logError) {
      console.error("Failed to log refund completion:", logError);
    }

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

// ✅ Delete order - WITH LOGGING
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const orderInfo = {
      id: order._id,
      orderNumber: order.orderNumber,
      username: order.username,
      total: order.total
    };

    await Order.findByIdAndDelete(req.params.id);

    // LOG ORDER DELETION
    try {
      await createLog(
        'Order Update',
        req.user?.username || req.user?.email || 'Admin',
        req.params.id,
        `Order deleted - Order #${orderInfo.orderNumber || orderInfo.id.toString().substring(0, 8)} (${orderInfo.username})`,
        'Success',
        { 
          deletedOrderId: orderInfo.id,
          orderNumber: orderInfo.orderNumber,
          customerUsername: orderInfo.username,
          orderTotal: orderInfo.total
        }
      );
    } catch (logError) {
      console.error("Failed to log order deletion:", logError);
    }

    res.json({ message: "Order deleted" });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
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
    res.json({ orders });
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
