import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TestimonialsContext = createContext();

export const useTestimonials = () => useContext(TestimonialsContext);

// The backend API URL. Adjust if your backend runs on a different port.
const API_URL = 'http://localhost:5001/api/v1/testimonials';

export const TestimonialsProvider = ({ children }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const addTestimonial = async (testimonialData) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testimonialData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to submit testimonial.');
    }

    const newTestimonial = await response.json();
    // Add the new testimonial to the top of the list for an instant UI update
    setTestimonials(prevTestimonials => [newTestimonial, ...prevTestimonials]);
  };

  return (
    <TestimonialsContext.Provider value={{ testimonials, addTestimonial, loading, error }}>
      {children}
    </TestimonialsContext.Provider>
  );
};