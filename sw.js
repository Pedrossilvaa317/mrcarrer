const CACHE_NAME = 'mrcarrer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache PWA Aberto Mrcarrer');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Ignora chamadas pra API do Supabase ou Vercel Serverless
  if (event.request.url.includes('supabase') || event.request.url.includes('/api/')) {
      return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache hit - return response
        }
        return fetch(event.request);
      })
  );
});
