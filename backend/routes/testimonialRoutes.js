import express from 'express';
import Testimonial from '../models/Testimonial.js';

const router = express.Router();

// @route   GET /api/testimonials
// @desc    Get all testimonials, sorted by most recent
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/testimonials
// @desc    Create a new testimonial
router.post('/', async (req, res) => {
  const { quote, author, rating } = req.body;

  if (!quote || !author || rating == null) {
    return res.status(400).json({ msg: 'Please include a quote, author, and rating.' });
  }

  try {
    const newTestimonial = new Testimonial({ quote, author, rating });
    const testimonial = await newTestimonial.save();
    res.status(201).json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;