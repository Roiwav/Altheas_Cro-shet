// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Prefer explicit vars; fallback to CLOUDINARY_URL if set
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
