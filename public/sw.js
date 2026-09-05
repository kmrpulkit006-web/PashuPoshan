/**
 * PashuPoshan AI - Progressive Web App Service Worker (v2)
 * Features dynamic runtime caching for Vite assets, ensuring true offline availability.
 */

const STATIC_CACHE_NAME = 'pashuposhan-static-v4';
const RUNTIME_CACHE_NAME = 'pashuposhan-runtime-v4';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, RUNTIME_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheToDelete) => caches.delete(cacheToDelete))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy 1: Stale-While-Revalidate for bundled assets (/assets/)
  // Immediate load in remote sheds with zero signal or spotty 2G
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback handled by cachedResponse
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy 2: Network-First with /index.html Cache Fallback for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Strategy 3: Cache-First for static icons, manifest, and assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
