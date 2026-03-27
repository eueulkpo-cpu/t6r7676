// Intelligent Service Worker for Sensibilidade Trainer
// Caches assets, bg sync for training stats, frame sync hints

const CACHE_NAME = 'sens-trainer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/enginebundle.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Background sync for session stats
self.addEventListener('sync', event => {
  if (event.tag === 'sync-stats') {
    event.waitUntil(syncTrainingStats());
  }
});

async function syncTrainingStats() {
  // Sync to IndexedDB or server
  console.log('Synced training stats');
}

// Push notifications for training reminders
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Touch frame sync hint (for Samsung high-Hz displays)
self.addEventListener('message', event => {
  if (event.data === 'frame-sync') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage('raf-sync'));
    });
  }
});
