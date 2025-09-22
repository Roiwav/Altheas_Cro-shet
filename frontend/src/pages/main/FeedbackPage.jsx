import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTestimonials } from '../../context/TestimonialsContext';
import { Star, MessageSquare, Smile, User, Loader2 } from 'lucide-react';

const FeedbackPage = () => {
  const { addTestimonial } = useTestimonials();
  const [formData, setFormData] = useState({
    quote: '',
    author: '',
    rating: 0,
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const { quote, author, rating } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingClick = (newRating) => {
    setFormData({ ...formData, rating: newRating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await addTestimonial({
      quote,
      author,
      rating: Number(rating),
    });

    if (result.success) {
      // Clear form on successful submission
      setFormData({ quote: '', author: '', rating: 0 });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen lg:pl-20 pt-16 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leave a Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">We'd love to hear what you think about our products!</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="quote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Feedback / Testimonial
              </label>
              <textarea
                id="quote"
                name="quote"
                rows="4"
                value={quote}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Your feedback..."
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name
              </label>
              <input
                id="author"
                name="author"
                type="text"
                value={author}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <Star
                      key={starValue}
                      className={`w-7 h-7 sm:w-8 sm:h-8 cursor-pointer transition-all duration-150 ease-in-out ${
                        starValue <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400 transform scale-110'
                          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                      }`}
                      onClick={() => handleRatingClick(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${starValue} out of 5`}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} />
    </>
  );
};

export default FeedbackPage;