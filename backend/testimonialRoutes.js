const express = require('express');
const Testimonial = require('./Testimonial.js');

const router = express.Router();

// @route   GET /api/v1/testimonials
// @desc    Get all testimonials, sorted by most recent
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// @route   POST /api/v1/testimonials
// @desc    Create a new testimonial
router.post('/', async (req, res) => {
  const { quote, author, rating } = req.body;

  try {
    const newTestimonial = new Testimonial({ quote, author, rating });
    const testimonial = await newTestimonial.save();
    res.status(201).json({ success: true, testimonial });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: err.errors });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;