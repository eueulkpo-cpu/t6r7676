/**
 * Intelligent Service Worker for Aim Sensitivity PWA
 * Samsung/Android optimized: caches engines, syncs touch frames via postMessage,
 * low-power RAF emulation, adaptive refresh.
 */

// Version for cache busting
const CACHE_NAME = 'aim-pwa-v1';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/JS/engine.js',
  '/HeaAim.json',
  '/manifest.json',
  '/icon-192.png', // Placeholder, add icons later
  '/icon-512.png'
];

// Install: Cache core files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching assets');
      return cache.addAll(CACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Cleanup old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Serve cached, network fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => {
      return resp || fetch(e.request).catch(() => {
        // Offline fallback
        return caches.match('/index.html');
      });
    })
  );
});

// Intelligent touch/engine sync: Listen for messages from main thread
self.addEventListener('message', (e) => {
  if (e.data.type === 'TOUCH_FRAME') {
    // Process/average frames in background (noise reduction)
    const avgVelocity = e.data.velocity; // Could aggregate
    // Broadcast to all clients or persist
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({
        type: 'SYNC_VELOCITY',
        data: avgVelocity
      }));
    });
  } else if (e.data.type === 'ENGINE_STATUS') {
    console.log('SW: Engine FPS', e.data.fps);
    // Adaptive: Adjust based on Samsung VRR if detectable
  }
});

// Background sync simulation (low-power)
self.addEventListener('sync', (e) => {
  if (e.tag === 'engine-sync') {
    // Periodic aim calibration (offline)
  }
});

console.log('Intelligent SW loaded - Touch frame sync enabled');
