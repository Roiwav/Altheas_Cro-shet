import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const TestimonialsContext = createContext();

export const useTestimonials = () => useContext(TestimonialsContext);

const defaultTestimonials = [
  {
    _id: 'default-1',
    quote: 'Absolutely beautiful craftsmanship! The flowers look so real and bring so much joy to my room.',
    author: 'Satisfied Customer',
    rating: 5,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'default-2',
    quote: 'I ordered a custom bouquet for my anniversary and it was perfect. My partner loved it!',
    author: 'Happy Shopper',
    rating: 5,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'default-3',
    quote: 'The quality is amazing and they last forever. A wonderful and sustainable gift idea.',
    author: 'Eco-conscious Buyer',
    rating: 4,
    createdAt: new Date().toISOString(),
  },
];

export const TestimonialsProvider = ({ children }) => {
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/api/v1/testimonials');
      if (!res.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      const data = await res.json();
      // If we get real data, use it. Otherwise, stick with the defaults.
      setTestimonials(data && data.length > 0 ? data : defaultTestimonials);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Fetch Testimonials Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Set up WebSocket connection
  useEffect(() => {
    const socket = io('http://localhost:5001'); // Your backend URL

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('testimonial_inserted', (newTestimonial) => {
      console.log('New testimonial received via WebSocket:', newTestimonial);
      // Add the new testimonial to the top of the list, replacing defaults if necessary
      setTestimonials(prev => {
        const isDefault = prev.some(t => t._id.startsWith('default-'));
        const list = isDefault ? [] : prev;
        return [newTestimonial, ...list];
      });
    });

    socket.on('testimonial_deleted', (deletedId) => {
      console.log('Testimonial deletion received via WebSocket:', deletedId);
      setTestimonials(prev => prev.filter(t => t._id.toString() !== deletedId.toString()));
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const addTestimonial = async (feedbackData) => {
    try {
      // The POST request will trigger the change stream, which updates the UI.
      // We no longer need to manually refetch here.
      const res = await fetch('http://localhost:5001/api/v1/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit feedback.');

      toast.success('Thank you for your feedback!');
      return { success: true };
    } catch (err) {
      toast.error(err.message || 'Server error. Please try again later.');
      return { success: false, error: err.message };
    }
  };

  const value = { testimonials, loading, error, addTestimonial };

  return <TestimonialsContext.Provider value={value}>{children}</TestimonialsContext.Provider>;
};