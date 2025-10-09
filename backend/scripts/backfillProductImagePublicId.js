// backend/scripts/backfillProductImagePublicId.js
// One-off script to backfill Product.imagePublicId from existing Cloudinary secure_url in Product.image
// Usage: node ./scripts/backfillProductImagePublicId.js

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

function extractPublicId(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!u.hostname.includes('res.cloudinary.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    // Find 'upload' segment
    const uploadIdx = parts.findIndex((p) => p === 'upload');
    if (uploadIdx === -1) return null;
    // Everything after 'upload' could be: [transform?], v123?, folder..., file.ext
    let after = parts.slice(uploadIdx + 1);
    // Drop transformation block if it's embedded as a single comma-separated segment
    if (after.length && after[0].includes(',') && after[0].match(/(w_|h_|c_|f_|q_|d_)/)) {
      after = after.slice(1);
    }
    // Drop version segment like v1699999999
    if (after.length && /^v\d+$/.test(after[0])) {
      after = after.slice(1);
    }
    if (!after.length) return null;
    // Join remaining and strip extension
    let joined = after.join('/');
    joined = joined.replace(/\.[a-zA-Z0-9]+$/, '');
    return joined || null;
  } catch (e) {
    return null;
  }
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing in environment.');
    process.exit(1);
  }
  await mongoose.connect(uri, { useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const candidates = await Product.find({
    $or: [{ imagePublicId: { $exists: false } }, { imagePublicId: '' }, { imagePublicId: null }],
    image: { $type: 'string' },
  }).lean();

  console.log(`Found ${candidates.length} products missing imagePublicId`);

  const updates = [];
  for (const p of candidates) {
    const id = extractPublicId(p.image);
    if (id) {
      updates.push({ updateOne: { filter: { _id: p._id }, update: { $set: { imagePublicId: id } } } });
    }
  }

  if (updates.length) {
    const res = await Product.bulkWrite(updates);
    console.log('Updated products:', res.modifiedCount || res.nModified || 0);
  } else {
    console.log('No updates needed');
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
