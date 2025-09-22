import { createContext, useState, useEffect, useContext } from 'react';

const TestimonialsContext = createContext();

const initialTestimonials = [
  {
    quote: "These crochet flowers are absolutely stunning! The quality is exceptional and they look so real.",
    author: "Maria S.",
    rating: 5
  },
  {
    quote: "I ordered a custom piece and it exceeded all my expectations. The attention to detail is incredible.",
    author: "John D.",
    rating: 5
  },
  {
    quote: "The perfect gift that lasts forever. My mom loved her crochet bouquet on Mother's Day!",
    author: "Sarah M.",
    rating: 5
  }
];

export const TestimonialsProvider = ({ children }) => {
  const [testimonials, setTestimonials] = useState(() => {
    try {
      const localData = localStorage.getItem('testimonials');
      return localData ? JSON.parse(localData) : initialTestimonials;
    } catch (error) {
      console.error("Could not parse testimonials from localStorage", error);
      return initialTestimonials;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('testimonials', JSON.stringify(testimonials));
    } catch (error) {
      console.error("Could not save testimonials to localStorage", error);
    }
  }, [testimonials]);

  const addTestimonial = (testimonial) => {
    setTestimonials(prevTestimonials => [testimonial, ...prevTestimonials]);
  };

  return (
    <TestimonialsContext.Provider value={{ testimonials, addTestimonial }}>
      {children}
    </TestimonialsContext.Provider>
  );
};

export const useTestimonials = () => useContext(TestimonialsContext);