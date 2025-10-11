const CACHE_NAME = 'ac-img-v1';
const IMG_EXT_RE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|bmp|tiff|heic|heif)$/i;
const IMG_HOSTS = ['res.cloudinary.com', self.location.host];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isImage = req.destination === 'image' || IMG_EXT_RE.test(url.pathname);
  if (!isImage) return;
  const isImgHost = IMG_HOSTS.includes(url.hostname);
  if (!isImgHost) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      if (resp && (resp.status === 200 || resp.type === 'opaque')) {
        cache.put(req, resp.clone());
      }
      return resp;
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='Arial' font-size='20'>Image unavailable offline</text></svg>";
      return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
    }
  })());
});
