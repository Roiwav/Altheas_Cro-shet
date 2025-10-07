const express = require('express');
const Testimonial = require('./Testimonial.js');

const router = express.Router();

// @route   GET /api/v1/testimonials
// @desc    Get all APPROved testimonials, sorted by most recent
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// @route   GET /api/v1/testimonials/all
// @desc    Get ALL testimonials (admin), sorted by most recent
router.get('/all', async (req, res) => {
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

// @route   PATCH /api/v1/testimonials/:id/approve
// @desc    Approve or unapprove a testimonial
router.patch('/:id/approve', async (req, res) => {
  const { isApproved } = req.body;
  if (typeof isApproved !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isApproved must be a boolean.' });
  }
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }
    testimonial.isApproved = isApproved;
    await testimonial.save();
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// @route   DELETE /api/v1/testimonials/:id
// @desc    Delete a testimonial
router.delete('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }
    res.json({ success: true, message: 'Testimonial deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;