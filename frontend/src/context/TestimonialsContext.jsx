import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SERVER_BASE_URL } from '../utils/product';

const TestimonialsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTestimonials = () => useContext(TestimonialsContext);

export const TestimonialsProvider = ({ children }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/testimonials`);
      if (res.ok) {
        const data = await res.json();
        const approved = Array.isArray(data) ? data.filter(t => t?.isApproved) : [];
        setTestimonials(approved);
      } else {
        setTestimonials([]);
      }
      setError(null);
    } catch {
      setTestimonials([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const addTestimonial = async (feedbackData) => {
    try {
      // This function now only submits the feedback.
      // The admin panel will have its own logic to refetch the full list.
      // The public testimonial list does not need to be updated here.
      const res = await fetch(`${SERVER_BASE_URL}/api/v1/testimonials`, {
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

  const value = { testimonials, loading, error, addTestimonial, refetchTestimonials: fetchTestimonials };

  return <TestimonialsContext.Provider value={value}>{children}</TestimonialsContext.Provider>;
};