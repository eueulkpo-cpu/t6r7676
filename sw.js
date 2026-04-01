// Intelligent Service Worker for Gringozin FF PWA
// Caches assets, proxies touch events for low-latency frame sync

const CACHE_NAME = 'gringozin-ff-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/JS/engine.js',
  '/JS/enginebundle.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Intelligent touch frame sync: proxy touches to clients for engine
self.addEventListener('message', event => {
  if (event.data.type === 'SYNC_TOUCH') {
    // Broadcast to all clients (main thread engines)
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({
        type: 'TOUCH_FRAME',
        data: event.data.touchData,
        timestamp: performance.now()
      }));
    });
  }
});

// Background sync for settings (future)
self.addEventListener('sync', event => {
  if (event.tag === 'settings-sync') {
    // Sync sensitivity settings to IndexedDB
  }
});

console.log('Gringozin FF SW ready for touch sync');

