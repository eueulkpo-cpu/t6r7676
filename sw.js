// sw.js - Service Worker de Alta Performance
const CACHE_NAME = 'sensi-pro-v1';

self.addEventListener('install', (event) => {
    // Força a ativação imediata para reduzir lag de carregamento
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Prioriza cache para scripts de engine para evitar quedas de frame
    event.respondWith(
        caches.match(event.request).then((res) => res || fetch(event.request))
    );
});