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

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  if (typeof url === 'string' && url.startsWith('/uploads')) {
    return `${SERVER_BASE_URL}${url}`;
  }
  return url;
};
