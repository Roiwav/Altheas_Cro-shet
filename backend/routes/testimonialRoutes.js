import express from 'express';
import Testimonial from '../models/Testimonial.js';

const router = express.Router();

// @route   GET /api/testimonials
// @desc    Get all *approved* testimonials, sorted by most recent
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/testimonials/all
// @desc    Get all testimonials for admin, sorted by most recent
// TODO: Add admin authentication middleware
router.get('/all', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({
      createdAt: -1,
    });
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

// @route   PATCH /api/testimonials/:id/approve
// @desc    Approve or unapprove a testimonial
// TODO: Add admin authentication middleware
router.patch('/:id/approve', async (req, res) => {
  const { isApproved } = req.body;

  if (typeof isApproved !== 'boolean') {
    return res.status(400).json({ msg: 'isApproved must be a boolean.' });
  }

  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found.' });
    }
    testimonial.isApproved = isApproved;
    await testimonial.save();
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete a testimonial
// TODO: Add admin authentication middleware
router.delete('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found.' });
    }
    res.json({ msg: 'Testimonial deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;