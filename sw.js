const CACHE_NAME = 'mrcarrer-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-512x512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força a instalação imediata do novo sw
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache PWA Aberto Mrcarrer v2');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento Active para Deletar Versões Antigas do Cache (como o v1 que travou o código)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('mrcarrer-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignora chamadas pra API do Supabase ou Vercel Serverless
  if (event.request.url.includes('supabase') || event.request.url.includes('/api/')) {
      return; 
  }

  // Abordagem Cache-First com fallback (como o cache inteiro acabou de ser renovado no v2, irá bater o JS atualizado)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache hit
        }
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Add fetched resource to cache logic is optional here.
            return response;
          }
        );
      })
  );
});
