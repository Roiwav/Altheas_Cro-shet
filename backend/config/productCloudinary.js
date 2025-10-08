// backend/config/productCloudinary.js
const cloudinary = require('cloudinary').v2;

// Dedicated configuration for Product Images (separate Cloudinary account)
// Expects the following env vars in backend/.env
//   CLOUDINARY_PRODUCT_CLOUD_NAME
//   CLOUDINARY_PRODUCT_API_KEY
//   CLOUDINARY_PRODUCT_API_SECRET
const hasExplicitProductCreds =
  process.env.CLOUDINARY_PRODUCT_CLOUD_NAME &&
  process.env.CLOUDINARY_PRODUCT_API_KEY &&
  process.env.CLOUDINARY_PRODUCT_API_SECRET;

if (hasExplicitProductCreds) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_PRODUCT_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_PRODUCT_API_KEY,
    api_secret: process.env.CLOUDINARY_PRODUCT_API_SECRET,
  });
} else {
  // Fallback to CLOUDINARY_URL if provided (e.g., cloudinary://<key>:<secret>@<cloud_name>)
  cloudinary.config();
}

module.exports = cloudinary;
