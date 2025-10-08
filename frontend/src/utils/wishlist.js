// src/utils/wishlist.js
// Local wishlist utilities using localStorage
// Each user's wishlist is stored under a unique key: `wishlist_<username>`

const STORAGE_PREFIX = 'wishlist_';

function normalizeUsername(username) {
  if (!username || typeof username !== 'string') return 'guest';
  // Lowercase, trim, replace spaces with underscores, and remove invalid chars
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

export function getKey(username) {
  const safe = normalizeUsername(username);
  return `${STORAGE_PREFIX}${safe || 'guest'}`;
}

export function getWishlist(username) {
  const key = getKey(username);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('wishlist.getWishlist error:', e);
    return [];
  }
}

export function saveWishlist(username, items) {
  const key = getKey(username);
  try {
    localStorage.setItem(key, JSON.stringify(items || []));
  } catch (e) {
    console.error('wishlist.saveWishlist error:', e);
  }
}

function toIdString(id) {
  return id != null ? String(id) : '';
}

export function isInWishlist(username, productId) {
  const idStr = toIdString(productId);
  if (!idStr) return false;
  const items = getWishlist(username);
  return items.some((it) => toIdString(it.id) === idStr);
}

export function addToWishlist(username, product) {
  if (!product || product.id == null) return getWishlist(username);
  const idStr = toIdString(product.id);
  const current = getWishlist(username);
  if (current.some((it) => toIdString(it.id) === idStr)) return current;

  // Store only essentials to keep storage small
  const item = {
    id: idStr,
    name: product.name || '',
    price: product.price ?? 0,
    image: product.image || '',
    description: product.description || '',
    addedAt: Date.now(),
  };
  const next = [item, ...current];
  saveWishlist(username, next);
  return next;
}

export function removeFromWishlist(username, productId) {
  const idStr = toIdString(productId);
  const current = getWishlist(username);
  const next = current.filter((it) => toIdString(it.id) !== idStr);
  saveWishlist(username, next);
  return next;
}

export function toggleWishlist(username, product) {
  const inList = isInWishlist(username, product?.id);
  if (inList) {
    const items = removeFromWishlist(username, product.id);
    return { added: false, items };
  } else {
    const items = addToWishlist(username, product);
    return { added: true, items };
  }
}
