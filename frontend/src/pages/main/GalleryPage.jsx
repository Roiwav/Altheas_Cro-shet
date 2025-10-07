// src/pages/main/GalleryPage.jsx
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../context/useUser.js";
import { FaArrowRight } from 'react-icons/fa';
// Gallery images
import img1 from '../../assets/images/gallery/image1.jpg';
import img2 from '../../assets/images/gallery/image2.jpg';
import img3 from '../../assets/images/gallery/image3.jpg';
import img4 from '../../assets/images/gallery/image4.jpg';
import img5 from '../../assets/images/gallery/image5.jpg';
import img6 from '../../assets/images/gallery/image6.jpg';
import img7 from '../../assets/images/gallery/image7.jpg';
import img8 from '../../assets/images/gallery/image8.jpg';
import img9 from '../../assets/images/gallery/image9.jpg';
import img10 from '../../assets/images/gallery/image10.jpg';
import img11 from '../../assets/images/gallery/image11.jpg';
import img12 from '../../assets/images/gallery/image12.jpg';

// Product data mapping with titles, descriptions, and prices
const productData = {
  'Beautiful Handmade 1': {
    name: 'Carnation Love Bouquet',
    description: 'A beautiful handmade crochet bouquet featuring carnations in various shades of pink and white, perfect for any occasion.',
    price: 340.00
  },
  'Elegant Craft 2': {
    name: 'Tulips Shining',
    description: 'Elegant crochet tulips that bring a touch of spring to any room. These never-wilt flowers are perfect for home decor.',
    price: 290.00
  },
  'Stylish Crochet 3': {
    name: 'Pink Tulips',
    description: 'Charming pink tulips handcrafted with love. These delicate flowers add a pop of color to any space.',
    price: 250.00
  },
  'Charming Design 4': {
    name: 'Purple Lily',
    description: 'Exquisite purple lilies that look incredibly realistic. A perfect gift for any flower lover.',
    price: 320.00
  },
  'Lovely Piece 5': {
    name: 'Rose Pink Charm',
    description: 'Beautiful pink roses arranged in a charming bouquet. These crochet roses will never wilt or fade.',
    price: 270.00
  },
  'Artistic Creation 6': {
    name: 'Sundrop Lily',
    description: 'Bright and cheerful sunflowers that bring warmth and happiness to any space. Handmade with premium yarn.',
    price: 245.00
  },
  'Unique Style 7': {
    name: 'Rose Bloom',
    description: 'Classic red roses that symbolize love and passion. These crochet roses are perfect for romantic occasions.',
    price: 330.00
  },
  'Crafted Beauty 8': {
    name: 'Lily Harmony',
    description: 'Elegant white lilies that represent purity and beauty. A stunning addition to any home decor.',
    price: 305.00
  },
  'Delicate Work 9': {
    name: 'Carnation Love Bouquet',
    description: 'A beautiful handmade crochet bouquet featuring carnations in various shades of pink and white, perfect for any occasion.',
    price: 340.00
  },
  'Masterpiece 10': {
    name: 'Lily Daylight',
    description: 'Bright and beautiful lilies that capture the essence of daylight. Handcrafted with attention to detail.',
    price: 315.00
  },
  'Exquisite Craft 11': {
    name: 'Blush Beauty Bouquet',
    description: 'A stunning bouquet featuring a variety of flowers in blush tones. Perfect for weddings and special occasions.',
    price: 290.00
  },
  'Handmade Wonder 12': {
    name: 'Tulips Garden Bloom',
    description: 'A vibrant collection of tulips in various colors, creating a beautiful garden bloom effect.',
    price: 440.00
  }
};

export default function GalleryPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();

  const images = [
    { id: 1, src: img1, alt: 'Beautiful Handmade 1' },
    { id: 2, src: img2, alt: 'Elegant Craft 2' },
    { id: 3, src: img3, alt: 'Stylish Crochet 3' },
    { id: 4, src: img4, alt: 'Charming Design 4' },
    { id: 5, src: img5, alt: 'Lovely Piece 5' },
    { id: 6, src: img6, alt: 'Artistic Creation 6' },
    { id: 7, src: img7, alt: 'Unique Style 7' },
    { id: 8, src: img8, alt: 'Crafted Beauty 8' },
    { id: 9, src: img9, alt: 'Delicate Work 9' },
    { id: 10, src: img10, alt: 'Masterpiece 10' },
    { id: 11, src: img11, alt: 'Exquisite Craft 11' },
    { id: 12, src: img12, alt: 'Handmade Wonder 12' },
  ];


  return (
    <div
      className={`min-h-screen 
        bg-gradient-to-br from-[#FF90BB] via-[#FFC1DA] to-[#8ACCD5]
        dark:bg-gradient-to-br dark:from-[#2C2C54] dark:via-[#474787] dark:to-[#40407a]
      `}
    >
      <div className={`max-w-7xl mx-auto py-10 px-4 ${
        user ? 'md:pr-4 md:pl-[calc(var(--sidebar-width,5rem)+1rem)]' : ''
      } transition-[padding-left] duration-300 ease-in-out`}>
        {/* Title */}
        <h1 className="mb-12 text-4xl font-extrabold text-center text-white sm:text-5xl drop-shadow-md">
          Our Lovely Gallery
        </h1>

        {/* Image Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              onClick={() => setSelectedProduct(image)}
              className="overflow-hidden transition-all duration-300 transform shadow-lg cursor-pointer group rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:shadow-2xl hover:scale-105 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="object-cover w-full h-64 transition-opacity duration-300 group-hover:opacity-90"
              />
              <div className="p-4 text-center bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                <p className="font-medium text-gray-800 truncate dark:text-gray-200">
                  {image.alt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Product Details Modal */}
        {selectedProduct && (
          <div
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto"
          >
            <div
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl dark:bg-gray-900 animate-scale-in overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row h-[90vh] max-h-[800px] w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Image Section */}
                <div className="relative w-full md:w-[60%] h-[50vh] md:h-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-blue-50 dark:from-gray-700 dark:to-gray-900 opacity-50"></div>
                  <img
                    src={selectedProduct.src}
                    alt={selectedProduct.alt}
                    className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Details Section */}
                <div className="w-full md:w-[40%] flex flex-col overflow-y-auto p-8">
                  {/* Header */}
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {productData[selectedProduct.alt]?.name || selectedProduct.alt}
                    </h2>
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      ₱{productData[selectedProduct.alt]?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Product Details</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {productData[selectedProduct.alt]?.description || 'No description available.'}
                    </p>
                  </div>


                  {/* Action Buttons */}
                  <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => {
                          const product = {
                            id: selectedProduct.id.toString(),
                            name: productData[selectedProduct.alt]?.name || selectedProduct.alt,
                            price: productData[selectedProduct.alt]?.price || 0,
                            description: productData[selectedProduct.alt]?.description || 'No description available.',
                            image: selectedProduct.src,
                            variations: [] // Add empty variations array if your products have variations
                          };
                          
                          // Navigate to shop with the specific product
                          navigate('/shop', { 
                            state: { 
                              openProductModal: true,
                              selectedProduct: product
                            },
                            replace: true
                          });
                        }}
                        className="group relative flex-1 flex items-center justify-center px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl transition-all duration-300 overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center">
                          <FaArrowRight className="mr-2" />
                          I want this!
                        </span>
                        <span className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute flex items-center justify-center w-10 h-10 text-gray-800 transition-colors duration-300 rounded-full top-4 right-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 dark:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
