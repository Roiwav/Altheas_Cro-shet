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
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'feedbacks' });

// TTL index to automatically delete low-rated feedback after 30 days.
// This index only applies to documents where 'rating' is less than 3.
testimonialSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000, // 30 days in seconds (30 * 24 * 60 * 60)
    partialFilterExpression: { rating: { $lt: 3 } },
  }
);

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;