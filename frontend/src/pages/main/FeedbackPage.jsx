import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import { useTestimonials } from '../../context/TestimonialsContext';

const FeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { addTestimonial } = useTestimonials();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    addTestimonial({
      quote: feedback,
      author: 'A Happy Customer', // This could be dynamic if you add a name field
      rating: rating,
    });
    navigate('/'); // Navigate to homepage to see the new testimonial
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Share Your Feedback</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            We'd love to hear your thoughts about Althea Crochet
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How would you rate your experience?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      rating >= star 
                        ? 'text-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                    }`}
                  >
                    <Star 
                      className={`h-8 w-8 ${rating >= star ? 'fill-current' : ''}`} 
                    size={32} 
                    fill={rating >= star ? 'currentColor' : 'none'}
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid meet"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Not satisfied</span>
                <span>Very satisfied</span>
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your feedback
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={6}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="What did you like or what could we improve?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Your feedback helps us improve our services.
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors duration-300 flex items-center"
                disabled={!feedback || rating === 0}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
