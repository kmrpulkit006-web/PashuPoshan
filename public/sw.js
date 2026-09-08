/**
 * PashuPoshan AI - Progressive Web App Service Worker (v2)
 * Features dynamic runtime caching for Vite assets, ensuring true offline availability.
 */

const STATIC_CACHE_NAME = 'pashuposhan-static-v6';
const RUNTIME_CACHE_NAME = 'pashuposhan-runtime-v6';

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
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy 0: Cache-First for cross-origin TensorFlow.js MobileNet model weights & shards
  // Enables on-device feed sanity pre-filtering even in remote cattle sheds without internet
  const isTfjsModelRequest =
    (url.hostname === 'storage.googleapis.com' && url.pathname.includes('/tfjs-models/')) ||
    url.hostname === 'tfhub.dev' ||
    (url.hostname.includes('tfhub') && url.pathname.includes('mobilenet'));

  if (isTfjsModelRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Skip other cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Never cache or intercept serverless API endpoints (/api/*)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

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
          // Offline fallback handled by cachedResponse, or return Response.error()
          return cachedResponse || Response.error();
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
        if (!networkResponse || !networkResponse.ok) {
          return caches.match('/index.html').then((cached) => cached || networkResponse);
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
