/**
 * src/utils/product.js
 * Helpers related to product data and assets.
 */
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

export const getProductImageSrc = (image) => {
  if (image && typeof image === 'string' && image.startsWith('/uploads')) {
    return `${SERVER_BASE_URL}${image}`;
  }
  return image || '/images/placeholder-product.jpg';
};
