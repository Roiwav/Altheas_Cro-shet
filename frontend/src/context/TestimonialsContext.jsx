import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
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
        // Swallow errors (e.g., 404) and show no testimonials
        setTestimonials([]);
      }
      setError(null);
    } catch {
      // Swallow network errors and show no testimonials
      setTestimonials([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Set up WebSocket connection
  useEffect(() => {
    const socket = io(SERVER_BASE_URL);

    socket.on('connect', () => {});
    // Swallow socket errors to avoid console noise when backend is unavailable
    socket.on('connect_error', () => {});
    socket.on('error', () => {});

    socket.on('testimonial_inserted', (newTestimonial) => {
      // Only show approved testimonials publicly
      if (!newTestimonial?.isApproved) return;
      setTestimonials(prev => [newTestimonial, ...prev]);
    });

    // Handle updates (e.g., admin approval toggles)
    socket.on('testimonial_updated', (updated) => {
      if (updated?.isApproved) {
        setTestimonials(prev => {
          const id = updated._id?.toString?.() || updated._id;
          const exists = prev.some(t => (t._id?.toString?.() || t._id) === id);
          return exists
            ? prev.map(t => ((t._id?.toString?.() || t._id) === id ? updated : t))
            : [updated, ...prev];
        });
      } else {
        // If it became unapproved, remove from public list
        setTestimonials(prev => prev.filter(t => (t._id?.toString?.() || t._id) !== (updated._id?.toString?.() || updated._id)));
      }
    });

    // Some backends may emit a specific approval event
    socket.on('testimonial_approved', (approved) => {
      if (!approved) return;
      const item = approved.doc || approved; // support payload variations
      if (!item?.isApproved) return;
      setTestimonials(prev => {
        const id = item._id?.toString?.() || item._id;
        const exists = prev.some(t => (t._id?.toString?.() || t._id) === id);
        return exists
          ? prev.map(t => ((t._id?.toString?.() || t._id) === id ? item : t))
          : [item, ...prev];
      });
    });

    socket.on('testimonial_deleted', (deletedId) => {
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

  const value = { testimonials, loading, error, addTestimonial };

  return <TestimonialsContext.Provider value={value}>{children}</TestimonialsContext.Provider>;
};