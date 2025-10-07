const Order = require("../models/Order");
const jwt = require("jsonwebtoken");

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

    const paymentProofUrl = req.file ? `/uploads/${req.file.filename}` : null;

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

    // Remove the product from the order
    order.products.splice(productIndex, 1);

    // If no products left, delete the entire order
    if (order.products.length === 0) {
      await Order.findByIdAndDelete(orderId);
      return res.status(200).json({ 
        message: "Product cancelled and order deleted", 
        orderDeleted: true 
      });
    }

    // Recalculate total
    const newSubtotal = order.products.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    order.total = newSubtotal + (order.shippingFee || 0);

    await order.save();

    res.status(200).json({ 
      message: "Product cancelled successfully", 
      order,
      orderDeleted: false 
    });
  } catch (error) {
    console.error("❌ Error cancelling product:", error);
    res.status(500).json({ message: "Failed to cancel product" });
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
};
