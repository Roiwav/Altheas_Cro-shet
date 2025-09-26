// src/pages/main/GalleryPage.jsx
import React, { useState } from "react";
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

export default function GalleryPage({ isSidebarHovered }) {
  const [modalImage, setModalImage] = useState(null);

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
      <div className={`max-w-7xl mx-auto py-10 px-4 transition-all duration-300 ${
          isSidebarHovered ? "md:pl-64" : "md:pl-20"
        }`}
      >
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center mb-12 drop-shadow-md">
          Our Lovely Gallery
        </h1>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {images.map((image) => (
            <div
              key={image.id}
              onClick={() => setModalImage(image)}
              className="group cursor-pointer overflow-hidden rounded-2xl 
                         bg-white/70 dark:bg-gray-800/70 
                         backdrop-blur-sm shadow-lg hover:shadow-2xl 
                         transform hover:scale-105 transition-all duration-300"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
              <div className="p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-center">
                <p className="text-gray-800 dark:text-gray-200 font-medium truncate">
                  {image.alt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Viewer */}
        {modalImage && (
          <div
            onClick={() => setModalImage(null)} // Close modal on overlay click
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div
              className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl 
                         bg-white dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImage.src}
                alt={modalImage.alt}
                className="w-full h-auto object-contain"
              />
              <button
                onClick={() => setModalImage(null)}
                className="absolute top-4 right-4 
                           bg-[#F8F8E1]/90 dark:bg-gray-700 
                           hover:bg-[#FFC1DA]/90 dark:hover:bg-gray-600 
                           text-gray-800 dark:text-gray-200 
                           rounded-full w-10 h-10 flex items-center justify-center transition"
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
