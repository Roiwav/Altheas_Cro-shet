const Order = require('../models/Order.js');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { userId, username, products, shippingAddress, shippingFee, total } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    const order = new Order({
      userId,
      username,
      products,
      shippingAddress,
      shippingFee,
      total,
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get logged in user's orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Delete an order
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the user owns the order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await order.deleteOne();
    res.json({ success: true, message: 'Order removed' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Cancel a single product from an order
 * @route   DELETE /api/orders/:orderId/product/:productId
 * @access  Private
 */
const cancelOrderItem = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const productToRemove = order.products.find(p => p.productId === productId);

    if (!productToRemove) {
      return res.status(404).json({ success: false, message: 'Product not found in order' });
    }

    // If this is the last product in the order, delete the whole order.
    if (order.products.length === 1) {
      await order.deleteOne();
      // Send a specific response so the frontend knows the order was deleted.
      return res.json({ success: true, orderDeleted: true });
    } else {
      // Otherwise, just remove the product and update the total.
      order.total -= productToRemove.price * productToRemove.quantity;
      order.products = order.products.filter(p => p.productId !== productId);
      const updatedOrder = await order.save();
      res.json({ success: true, order: updatedOrder });
    }
  } catch (error) {
    console.error('Error cancelling order item:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { createOrder, getMyOrders, deleteOrder, cancelOrderItem };