/**
 * src/utils/product.js
 * Helpers related to product data and assets.
 */
export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_PRODUCT_CLOUD_NAME ||
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  '';

// Inline SVG placeholder to avoid missing-file errors
const PLACEHOLDER_PRODUCT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='20'>Image not available</text></svg>";

export const getProductImageSrc = (image) => {
  // Accept string or object (cloudinary/multer/meta)
  let val = image;
  if (image && typeof image === 'object') {
    val = image.secure_url || image.url || image.path || image.src || '';
  }

  if (!val || (typeof val === 'string' && !val.trim())) {
    return PLACEHOLDER_PRODUCT;
  }

  if (typeof val === 'string') {
    // Absolute URL already
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('blob:')) return val;

    // Legacy local uploads
    if (val.startsWith('/uploads')) return `${SERVER_BASE_URL}${val}`;
    if (val.startsWith('uploads/')) return `${SERVER_BASE_URL}/${val}`;

    // Treat as Cloudinary public_id if cloud name is available
    if (CLOUDINARY_CLOUD_NAME) {
      const publicId = val.replace(/^\//, '');
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
    }

    return PLACEHOLDER_PRODUCT;
  }

  return PLACEHOLDER_PRODUCT;
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
