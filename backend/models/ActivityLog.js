// models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['Order Update', 'Payment', 'User Action', 'Security', 'Product Edit', 'Order Creation', 'Customer Interaction'],
    required: true
  },
  actor: {
    type: String, // username or system
    required: true
  },
  resourceId: {
    type: String, // order ID, user ID, product ID, etc.
    required: true
  },
  details: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Success', 'Failure', 'Info'],
    default: 'Success'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Additional data
    default: {}
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
