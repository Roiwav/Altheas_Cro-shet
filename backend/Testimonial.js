const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  quote: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'feedbacks' });

const Testimonial = mongoose.model('Testimonial', testimonialSchema, 'feedbacks');

module.exports = Testimonial;