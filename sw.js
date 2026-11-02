const CACHE_NAME = 'vicnos-v12'; // Bumped to v12
const ASSETS = [
  'index.html',
  'dashboard.html',
  'checkin.html',
  'checkout.html',
  'guest-history.html',
  'guest-profile.html',
  'qr-code.html',
  'guest-portal.html',
  'inside-life.html',
  'pos.html',
  'finance.html',
  'maintenance.html',
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