const CACHE_NAME = 'vicnos-v13'; // Bumped to v13 to force cache clear
const ASSETS = [
  'index.html',
  'dashboard.html',
  'checkin.html',
  'checkout.html',
  'guest-history.html',
  'guest-login.html',
  'guest-portal.html',
  'qr-code.html',
  'pos.html',
  'waitress-sales.html',
  'order-board.html',
  'bar-orders.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});