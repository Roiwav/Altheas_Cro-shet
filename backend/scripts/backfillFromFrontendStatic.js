// backend/scripts/backfillFromFrontendStatic.js
// Backfill Product.image and imagePublicId by matching product names to the
// frontend static product list + Cloudinary mapping.
// Usage: node ./scripts/backfillFromFrontendStatic.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');

function extractPublicId(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!u.hostname.includes('res.cloudinary.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    const uploadIdx = parts.findIndex((p) => p === 'upload');
    if (uploadIdx === -1) return null;
    let after = parts.slice(uploadIdx + 1);
    if (after.length && after[0].includes(',') && after[0].match(/(w_|h_|c_|f_|q_|d_)/)) {
      after = after.slice(1);
    }
    if (after.length && /^v\d+$/.test(after[0])) {
      after = after.slice(1);
    }
    if (!after.length) return null;
    let joined = after.join('/');
    joined = joined.replace(/\.[a-zA-Z0-9]+$/, '');
    return joined || null;
  } catch {
    return null;
  }
}

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function buildNameToUrlMap() {
  const productListPath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'data', 'productList.js');
  const productImagesPath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'assets', 'images', 'productImages.cloudinary.js');

  const [listSrc, imagesSrc] = await Promise.all([
    fs.promises.readFile(productListPath, 'utf8'),
    fs.promises.readFile(productImagesPath, 'utf8'),
  ]);

  // Parse id->url from productImages.cloudinary.js
  const idToUrl = new Map();
  const urlRegex = /(\d+)\s*:\s*['\"]([^'\"]+)['\"]/g;
  let m;
  while ((m = urlRegex.exec(imagesSrc)) !== null) {
    const id = Number(m[1]);
    const url = m[2];
    if (!Number.isNaN(id) && url) idToUrl.set(id, url);
  }

  // Parse id + name from productList.js
  const nameToUrl = new Map();
  const rowRegex = /\{\s*id:\s*(\d+)\s*,\s*name:\s*["']([^"']+)["']/g;
  let r;
  while ((r = rowRegex.exec(listSrc)) !== null) {
    const id = Number(r[1]);
    const name = r[2];
    const url = idToUrl.get(id);
    if (!Number.isNaN(id) && name && url) nameToUrl.set(normalizeName(name), url);
  }

  return nameToUrl;
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const nameToUrl = await buildNameToUrlMap();
  console.log(`Loaded ${nameToUrl.size} name->URL mappings from frontend`);

  // Find products missing imagePublicId
  const candidates = await Product.find({
    $or: [
      { imagePublicId: { $exists: false } },
      { imagePublicId: '' },
      { imagePublicId: null },
    ],
    deletedAt: null,
  }).lean();

  console.log(`Found ${candidates.length} products without imagePublicId`);

  const ops = [];
  for (const p of candidates) {
    const norm = normalizeName(p.name);
    const url = nameToUrl.get(norm);
    if (!url) continue;
    const publicId = extractPublicId(url);
    if (!publicId) continue;
    ops.push({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            image: url,
            imagePublicId: publicId,
          },
        },
      },
    });
  }

  if (ops.length) {
    const res = await Product.bulkWrite(ops);
    console.log('Bulk updated count:', res.modifiedCount || res.nModified || 0);
  } else {
    console.log('No matching names to update.');
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
