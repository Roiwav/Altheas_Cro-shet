import mongoose from 'mongoose';

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
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'feedbacks' });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;