import React, { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Flower, ArrowRight, Smartphone, Sparkles, Palette, Heart, Star, CheckCircle, ShoppingBagIcon, ArrowRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTestimonials } from '../../context/TestimonialsContext.jsx';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';

// Product data and context for featured products
import productList from '../../data/productList.js';
import productImages from '../../assets/images/productImages.js';
import { useCart } from '../../context/CartContext.jsx';

// Currency formatter (same as in ShopPage)
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function HomePage() {
  const { aboutRef, contactRef } = useOutletContext() || {};
  const { addToCart } = useCart();
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Initialize EmailJS - it's safe to call this multiple times.
  useEffect(() => {
    // Replace with your EmailJS Public Key
    emailjs.init("YXAWeRbfmChLSofYa"); 
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setIsSubscribing(true);
    const form = e.target;
    const email = form.email.value;

    
    // Reuse  existing contact form template.
   
    const serviceID = "service_dq2932e";// EmailJS service ID
    const templateID = "template_yx6apnf"; //contact form template ID

    const templateParams = {
      name: 'Newsletter Subscriber',
      email: email,
      inquiry_subject: 'New Newsletter Subscription',
      message: `Please add this email to the newsletter list: ${email}`,
    };

    try {
      await emailjs.send(serviceID, templateID, templateParams);
      toast.success("Thanks for subscribing! 🎉");
      form.reset();
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Oops! Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Get product image safely
  const placeholderImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";
  const getImageSrc = (product) => {
    if (productImages?.[product.id]) return productImages[product.id];
    if (productImages?.[String(product.id)]) return productImages[String(product.id)];
    if (product.image && typeof product.image === "string") return product.image;
    return placeholderImage;
  };

  const handleAddToCart = async (product) => {
    if (!product) return;
    try {
      const success = await addToCart(product, 1);
      if (success) {
        toast.success(`${product.name} added to cart!`);
      }
    } catch (err) {
      toast.error("Failed to add to cart.");
      console.error(err);
    }
  };
  return ( // Added transition and margin-left to accommodate the sidebar
    <div className="relative z-10 space-y-0 lg:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200 dark:bg-pink-800 rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-purple-200 dark:bg-purple-800 rounded-full blur-3xl opacity-20 animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full blur-2xl opacity-30 animate-float delay-500"></div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 py-20">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 text-sm font-medium mb-6">
            <Flower className="w-4 h-4 mr-2" />
            Handcrafted with love in Barangay Lawa
          </span>
          
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-800 dark:from-pink-400 dark:via-purple-400 dark:to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
              Althea's
            </h1>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-gray-800 dark:text-gray-200 mb-4">
              Cro-shet Creations
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full mb-8"></div>
          </div>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Timeless crochet flowers & custom creations that never fade
            <span className="block mt-4 text-lg text-pink-600 dark:text-pink-400 font-medium">
              Handmade with love, designed to last forever.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link 
              to="/shop" 
              className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Shop Now!
            </Link>
            <Link 
              to="/shop" 
              className="group px-8 py-4 border-2 border-pink-500 text-pink-600 dark:text-pink-400 rounded-full font-medium text-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-300 flex items-center"
            >
              Explore Collection
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 bottom-10 animate-bounce">
            <div className="w-8 h-12 border-2 border-pink-500 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-pink-500 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section ref={aboutRef} className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Our Crochet?</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Each piece is carefully handcrafted with premium materials and attention to detail
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />,
                title: "Handmade with Love",
                description: "Each creation is made by skilled artisans who pour their heart into every stitch"
              },
              {
                icon: <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />,
                title: "Premium Quality",
                description: "We use only the finest yarns and materials to ensure lasting beauty and durability"
              },
              {
                icon: <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />,
                title: "Eco-Friendly",
                description: "Sustainable materials and processes that are kind to our planet"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="bg-pink-50 dark:bg-pink-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AR Section */}
      <section id="ar-section" className="py-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-2/3 space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AR Feature
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Customize Your Perfect Flower and see it in Augmented Reality
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  See how our handcrafted crochet flowers will look in your space before you buy. 
                  Mix and match colors, styles, and arrangements to create something truly unique.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link 
                    to="/ar"
                    className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                   Customize Now!
                  </Link>
                </div>
              </div>
              <div className="hidden md:block md:w-1/3">
                <div className="relative h-64 w-full bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center p-6">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-500 dark:text-pink-400">
                    <Smartphone className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium text-center opacity-70">AR Experience Preview</p>
                  </div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <div className="absolute w-32 h-32 rounded-full bg-pink-400/20 animate-ping"></div>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Popular Creations</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover our most loved crochet pieces, handpicked by our community
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {productList.slice(0, 3).map((product) => (
              <div key={product.id} className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  <img 
                    src={getImageSrc(product)} 
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Bestseller
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-2">{product.name}</h3>
                    <span className="text-lg font-bold text-pink-500">{currencyFormatter.format(product.price)}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {product.description.substring(0, 70)}...
                  </p>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/shop" 
              className="inline-flex items-center text-pink-600 dark:text-pink-400 font-medium hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
            >
              View All Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Loved by Customers</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mb-8"></div>
          </div>
          <Testimonials />
        </div>
      </section>

      {/* Newsletter */}
      <section ref={contactRef} className="py-20 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-xl text-pink-100 mb-8">
            Subscribe to our newsletter for exclusive offers, new arrivals, and crochet inspiration.
          </p>
          
          <form 
            onSubmit={handleNewsletterSubmit}
            className="space-y-4 max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                placeholder="Enter your email" 
                className="flex-1 min-w-0 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
              <button 
                type="submit"
                disabled={isSubscribing}
                className="bg-white text-pink-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <p className="text-pink-100 text-sm">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function Testimonials() {
  const { testimonials = [] } = useTestimonials() || {};
  const containerRef = useRef(null);
  const [width, setWidth] = useState(1); // Start with 1 to avoid division by zero

  useEffect(() => {
    const calculateWidth = () => {
      if (containerRef.current) {
        // The total width is half the scrollWidth because we've duplicated the items for the loop
        setWidth(containerRef.current.scrollWidth / 2);
      }
    };
    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    return () => window.removeEventListener('resize', calculateWidth);
  }, [testimonials]);

  // We'll show up to 10 of the most recent testimonials to keep the DOM from getting too large.
  const testimonialsToDisplay = testimonials.slice(0, 10);

  if (testimonialsToDisplay.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        No testimonials yet. Be the first to leave a review!
      </div>
    );
  }

  // For a seamless loop, we need to duplicate the testimonials.
  const extendedTestimonials = [...testimonialsToDisplay, ...testimonialsToDisplay];

    return (
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <motion.div
                ref={containerRef}
                className="flex w-max"
                animate={{ x: [0, -width] }}
                transition={{ 
                  duration: testimonialsToDisplay.length * 7, 
                  ease: "linear", 
                  repeat: Infinity,
                  repeatType: "loop"
                }}
            >
                {extendedTestimonials.map((testimonial, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg mx-4 w-[350px] md:w-[400px] flex-shrink-0 pointer-events-none">
                        <div className="flex mb-4">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-500'}`} />)}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 italic mb-6 h-24 overflow-y-auto">"{testimonial.quote}"</p>
                        <p className="font-medium text-gray-900 dark:text-white">— {testimonial.author}</p>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export default HomePage;