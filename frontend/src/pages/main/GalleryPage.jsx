// src/pages/main/GalleryPage.jsx
import React, { useState } from "react";
import { useUser } from "../../context/useUser.js";
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

export default function GalleryPage() {
  const [modalImage, setModalImage] = useState(null);
  const { user } = useUser();

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
              onClick={() => setModalImage(image)}
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

        {/* Modal Viewer */}
        {modalImage && (
          <div
            onClick={() => setModalImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          >
            <div
              className="relative w-full max-w-3xl overflow-hidden bg-white shadow-2xl rounded-2xl dark:bg-gray-900 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImage.src}
                alt={modalImage.alt}
                className="object-contain w-full h-auto"
              />
              <button
                onClick={() => setModalImage(null)}
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
