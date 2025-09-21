import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Image as ImageIcon, Users, Calendar, Gift } from 'lucide-react';

// Sample portfolio data - replace with your actual images and content
const portfolioItems = [
  {
    id: 1,
    title: 'Wedding Bouquets',
    category: 'wedding',
    description: 'Elegant crochet bouquets that last forever, capturing the beauty of your special day.',
    image: 'https://via.placeholder.com/600x800/f5e1ff/7f1d8f?text=Wedding+Bouquet',
    featured: true,
    tags: ['featured', 'custom', 'bridal']
  },
  {
    id: 2,
    title: 'Seasonal Collection',
    category: 'seasonal',
    description: 'Celebrate every season with our handcrafted floral arrangements.',
    image: 'https://via.placeholder.com/800x600/e2f9ff/1d8f8f?text=Seasonal+Collection',
    featured: true,
    tags: ['spring', 'summer', 'fall', 'winter']
  },
  {
    id: 3,
    title: 'Home Decor',
    category: 'home',
    description: 'Add a touch of handmade charm to your living space with our crochet decor pieces.',
    image: 'https://via.placeholder.com/800x600/ffe5f1/8f1d5e?text=Home+Decor',
    featured: false,
    tags: ['vases', 'wreaths', 'wall-art']
  },
  {
    id: 4,
    title: 'Customer Creations',
    category: 'custom',
    description: 'See how our customers have incorporated our pieces into their special moments.',
    image: 'https://via.placeholder.com/600x800/f0fff0/1d8f3d?text=Customer+Creations',
    featured: true,
    tags: ['testimonials', 'real-weddings', 'events']
  },
  {
    id: 5,
    title: 'Miniature Arrangements',
    category: 'miniatures',
    description: 'Perfect for gifts or small spaces, these mini creations pack a lot of charm.',
    image: 'https://via.placeholder.com/600x600/fff0f5/8f1d5e?text=Mini+Arrangements',
    featured: false,
    tags: ['gifts', 'desk-decor', 'small-spaces']
  },
  {
    id: 6,
    title: 'Holiday Specials',
    category: 'holiday',
    description: 'Festive crochet flowers for every holiday season throughout the year.',
    image: 'https://via.placeholder.com/800x600/fff5e6/8f5e1d?text=Holiday+Specials',
    featured: false,
    tags: ['christmas', 'valentines', 'easter']
  },
];

const categories = [
  { id: 'all', name: 'All Works', icon: <ImageIcon className="w-4 h-4 mr-2" /> },
  { id: 'wedding', name: 'Wedding', icon: <Heart className="w-4 h-4 mr-2" /> },
  { id: 'seasonal', name: 'Seasonal', icon: <Calendar className="w-4 h-4 mr-2" /> },
  { id: 'custom', name: 'Custom', icon: <Star className="w-4 h-4 mr-2" /> },
  { id: 'home', name: 'Home Decor', icon: <Gift className="w-4 h-4 mr-2" /> },
  { id: 'customer', name: 'Customer Creations', icon: <Users className="w-4 h-4 mr-2" /> },
];

function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'masonry'
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems = activeCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory || item.tags.includes(activeCategory));

  const featuredItems = portfolioItems.filter(item => item.featured);

  if (selectedItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => setSelectedItem(null)}
            className="flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Portfolio
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:w-1/2">
                <div className="flex items-center mb-4">
                  <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-sm font-medium rounded-full">
                    {categories.find(cat => cat.id === selectedItem.category)?.name || selectedItem.category}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedItem.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {selectedItem.description}
                </p>
                
                <div className="mt-8">
                  <Link 
                    to="/shop"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
                  >
                    Order Similar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our Portfolio
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our collection of handcrafted crochet flowers and custom creations
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'}`}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 rounded-md ${viewMode === 'masonry' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'}`}
              title="Masonry view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Portfolio Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="relative overflow-hidden h-64">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                      <p className="text-pink-200">View Details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="break-inside-avoid group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer mb-8"
              >
                <div className="relative overflow-hidden h-64">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{item.description}</p>
                  <button className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured Section */}
        {activeCategory === 'all' && (
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Collections
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover our most popular and loved creations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative rounded-2xl overflow-hidden h-96 cursor-pointer"
                >
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
                    <div className="transform transition-transform group-hover:-translate-y-2 duration-300">
                      <span className="inline-block px-3 py-1 bg-pink-500 text-white text-sm font-medium rounded-full mb-3">
                        Featured
                      </span>
                      <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-pink-100">Explore Collection →</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Create Something Special?</h3>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Let's work together to bring your vision to life with a custom crochet creation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/shop"
              className="px-8 py-4 bg-white text-pink-600 font-semibold rounded-2xl shadow-lg hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
            <Link 
              to="/contact"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioPage;
