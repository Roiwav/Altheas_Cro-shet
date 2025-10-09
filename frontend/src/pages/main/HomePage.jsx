import React, { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Flower, ArrowRight, Smartphone, Sparkles, Palette, Heart, Star, CheckCircle, ShoppingBagIcon, ArrowRightCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useUser } from '../../context/useUser.js';
import { useTestimonials } from '../../context/TestimonialsContext.jsx';

// Product data and context for featured products
import productImages from '../../assets/images/productImages.cloudinary.js';

import { useCart } from '../../context/cart-context.js';
import { SERVER_BASE_URL, getProductImageSrc } from '../../utils/product';

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function HomePage() {
  const { aboutRef, contactRef } = useOutletContext() || {};
  const { user } = useUser();

  // (No top-level image/cart handlers needed here)
  return ( // Added transition and margin-left to accommodate the sidebar
    <div className={`relative z-10 space-y-0 ${
      user ? 'lg:ml-[var(--sidebar-width,5rem)]' : ''
    } transition-all duration-300 ease-in-out`}>
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute w-32 h-32 bg-pink-200 rounded-full top-20 left-10 dark:bg-pink-800 blur-3xl opacity-30 animate-float"></div>
        <div className="absolute w-48 h-48 delay-1000 bg-purple-200 rounded-full bottom-32 right-16 dark:bg-purple-800 blur-3xl opacity-20 animate-float"></div>
        <div className="absolute w-24 h-24 delay-500 bg-blue-200 rounded-full top-1/2 left-1/4 dark:bg-blue-800 blur-2xl opacity-30 animate-float"></div>

        <div className="relative z-10 max-w-6xl px-6 py-20 mx-auto text-center">
          <span className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-pink-600 bg-pink-100 rounded-full dark:bg-pink-900/50 dark:text-pink-300">
            <Flower className="w-4 h-4 mr-2" />
            Handcrafted with love in Barangay Lawa
          </span>
          
          <div className="mb-8">
            <h1 className="mb-6 text-5xl font-bold leading-tight text-transparent md:text-7xl lg:text-8xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-800 dark:from-pink-400 dark:via-purple-400 dark:to-pink-600 bg-clip-text">
              Althea's
            </h1>
            <h2 className="mb-4 text-3xl font-light text-gray-800 md:text-5xl lg:text-6xl dark:text-gray-200">
              Cro-shet Creations
            </h2>
            <div className="w-32 h-1 mx-auto mb-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          </div>

          <p className="max-w-3xl mx-auto mb-12 text-xl leading-relaxed text-gray-600 md:text-2xl dark:text-gray-300">
            Timeless crochet flowers & custom creations that never fade
            <span className="block mt-4 text-lg font-medium text-pink-600 dark:text-pink-400">
              Handmade with love, designed to last forever.
            </span>
          </p>

          <div className="flex flex-col items-center justify-center gap-6 mb-16 sm:flex-row">
            <Link 
              to="/shop" 
              className="flex items-center px-8 py-4 text-lg font-medium text-white transition-all duration-300 transform rounded-full shadow-lg group bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:scale-105 hover:shadow-xl"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Shop Now!
            </Link>
            <Link 
              to="/gallery" 
              className="flex items-center px-8 py-4 text-lg font-medium text-pink-600 transition-all duration-300 border-2 border-pink-500 rounded-full group dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
            >
              Explore Collection
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="absolute hidden transform -translate-x-1/2 sm:block left-1/2 bottom-10 animate-bounce">
            <div className="flex justify-center w-8 h-12 border-2 border-pink-500 rounded-full">
              <div className="w-1 h-3 mt-2 bg-pink-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section ref={aboutRef} className="py-20 bg-white dark:bg-gray-900">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Why Choose Our Crochet?</h2>
            <div className="w-24 h-1 mx-auto mb-8 bg-gradient-to-r from-pink-500 to-purple-500"></div>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Each piece is carefully handcrafted with premium materials and attention to detail
            </p>
          </div>
          
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: <Heart className="w-12 h-12 mx-auto mb-4 text-pink-500" />,
                title: "Handmade with Love",
                description: "Each creation is made by skilled artisans who pour their heart into every stitch"
              },
              {
                icon: <Star className="w-12 h-12 mx-auto mb-4 text-purple-500" />,
                title: "Premium Quality",
                description: "We use only the finest yarns and materials to ensure lasting beauty and durability"
              },
              {
                icon: <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-500" />,
                title: "Eco-Friendly",
                description: "Sustainable materials and processes that are kind to our planet"
              }
            ].map((item, index) => (
              <div key={index} className="p-8 transition-shadow duration-300 bg-white shadow-lg dark:bg-gray-800 rounded-2xl hover:shadow-xl">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-pink-50 dark:bg-pink-900/20">
                  {item.icon}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-center text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-center text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AR Section */}
      <section id="ar-section" className="py-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="p-8 bg-white shadow-lg dark:bg-gray-800 rounded-2xl md:p-12">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="space-y-6 md:w-2/3">
                <div className="inline-flex items-center px-4 py-2 mb-4 text-sm font-medium text-pink-600 bg-pink-100 rounded-full dark:bg-pink-900/30 dark:text-pink-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AR Feature
                </div>
                <h2 className="text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                  Customize Your Perfect Flower and see it in Augmented Reality
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  See how our handcrafted crochet flowers will look in your space before you buy. 
                  Mix and match colors, styles, and arrangements to create something truly unique.
                </p>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
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
                <div className="relative flex items-center justify-center w-full h-64 p-6 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-500 dark:text-pink-400">
                    <Smartphone className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium text-center opacity-70">AR Experience Preview</p>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-full h-full">
                    <div className="absolute w-32 h-32 rounded-full bg-pink-400/20 animate-ping"></div>
                    <div className="w-24 h-24 rounded-full shadow-lg bg-gradient-to-br from-pink-500 to-purple-600"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedProductsSection />

      {/* Divider */}
      <div className="h-0.5 bg-gradient-to-r from-pink-500/0 via-pink-500/50 to-pink-500/0"></div>

      {/* Testimonials */}
      {/* The previous change to add the gradient background is missing in the provided context, so I'm re-adding it. */}
      <section ref={contactRef} className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="px-6 mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Loved by Customers</h2>
            <div className="w-24 h-1 mx-auto mb-8 bg-gradient-to-r from-pink-500 to-purple-500"></div>
          </div>
          <Testimonials />
        </div>
      </section>

      {/* Divider */}
      <div className="h-0.5 bg-gradient-to-r from-purple-600/0 via-purple-500/50 to-purple-600/0"></div>
    </div>
  );
}

const FeaturedProductsSection = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const getOptimizedImageSrc = (product) => {
    const PLACEHOLDER =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";

    const base = getProductImageSrc(product?.image);
    if (!base) return productImages[product?.id] || PLACEHOLDER;

    try {
      const url = new URL(base);
      if (url.hostname.includes('res.cloudinary.com')) {
        const parts = url.pathname.split('/');
        const idx = parts.findIndex(p => p === 'upload');
        if (idx !== -1) {
          const transform = 'f_auto,q_auto,w_900';
          if (parts[idx + 1] && parts[idx + 1].includes(',')) {
            parts[idx + 1] = transform + ',' + parts[idx + 1];
          } else {
            parts.splice(idx + 1, 0, transform);
          }
          url.pathname = parts.join('/');
          return url.toString();
        }
      }
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // ignore
    }

    return base || productImages[product?.id] || PLACEHOLDER;
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/v1/products/featured`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.products)) {
          if (data.products.length > 0) {
            setFeaturedProducts(data.products);
          } else {
            // Fallback: load latest products if no featured are set
            const resAll = await fetch(`${SERVER_BASE_URL}/api/v1/products`);
            const dataAll = await resAll.json();
            if (resAll.ok && Array.isArray(dataAll.products)) {
              setFeaturedProducts(dataAll.products.slice(0, 3));
            } else {
              setFeaturedProducts([]);
            }
          }
        } else {
          setFeaturedProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch featured products:", err);
        // Fallback on error: try to load latest products
        try {
          const resAll = await fetch(`${SERVER_BASE_URL}/api/v1/products`);
          const dataAll = await resAll.json();
          if (resAll.ok && Array.isArray(dataAll.products)) {
            setFeaturedProducts(dataAll.products.slice(0, 3));
          } else {
            setFeaturedProducts([]);
          }
        } catch {
          setFeaturedProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  

  if (loading) return null; // Or a loading skeleton

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="px-6 mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Featured Creations</h2>
          <div className="w-24 h-1 mx-auto mb-8 bg-gradient-to-r from-pink-500 to-purple-500"></div>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
            Discover our most loved crochet pieces, handpicked for you.
          </p>
        </div>
        
        {featuredProducts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.slice(0, 3).map((product) => (
              <div key={product._id} className="overflow-hidden transition-all duration-300 transform bg-white shadow-lg group dark:bg-gray-800 rounded-2xl hover:shadow-xl hover:-translate-y-2">
                <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img 
                    src={getOptimizedImageSrc(product)} 
                    alt={product.name}
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Featured gradient ribbon (top-right) */}
                    {product.isFeatured && (
                      <div className="absolute top-3 right-0">
                        <div className="relative">
                          <div className="px-3 py-1 text-[11px] font-extrabold text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-l-full shadow-md">
                            Featured
                          </div>
                          <div className="absolute right-0 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-purple-600 border-b-8 border-b-transparent"></div>
                        </div>
                      </div>
                    )}

                    {/* Confetti-style badges (top-left cluster) */}
                    {Array.isArray(product.badges) && (
                      <>
                        {/* NEW: rotated sticker */}
                        {product.badges.includes('new') && (
                          <div className="absolute top-3 left-3 -rotate-12">
                            <div className="px-2.5 py-1 text-[10px] font-bold text-white bg-green-500 rounded-md shadow-sm">
                              New
                            </div>
                          </div>
                        )}

                        {/* BEST SELLER: star burst */}
                        {product.badges.includes('bestSeller') && (
                          <div className="absolute top-12 left-2">
                            <div className="relative">
                              <div className="flex items-center justify-center w-8 h-8 text-yellow-900 bg-yellow-300 rounded-full shadow">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 17.27 18.18 21 16.54 13.97 22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/></svg>
                              </div>
                              <div className="absolute -z-10 -inset-1 rounded-full bg-yellow-200/60 blur-sm"></div>
                            </div>
                          </div>
                        )}

                        {/* BEST CHOICE: ribbon pill */}
                        {product.badges.includes('bestChoice') && (
                          <div className="absolute top-3 left-16 rotate-6">
                            <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-white bg-blue-500 rounded-full shadow">
                              <span>Best Choice</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="pr-2 text-xl font-bold text-gray-900 truncate dark:text-white">{product.name}</h3>
                    <span className="text-lg font-bold text-pink-500">{currencyFormatter.format(product.price)}</span>
                  </div>
                  <p className="h-12 mb-4 overflow-hidden text-gray-600 dark:text-gray-300">
                    {product.description.substring(0, 70)}{product.description.length > 70 && '...'}
                  </p>
                  <button 
                    onClick={() => addToCart(product, 1)}
                    className="w-full px-4 py-2 font-medium text-white transition-colors bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            No products yet. Check back soon!
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Link 
            to="/shop" 
            className="inline-flex items-center font-medium text-pink-600 transition-colors dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
          >
            View All Products
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

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
                        <p className="h-24 mb-6 overflow-y-auto italic text-gray-600 dark:text-gray-300">"{testimonial.quote}"</p>
                        <p className="font-medium text-gray-900 dark:text-white">— {testimonial.author}</p>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export default HomePage;











