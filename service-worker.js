const CACHE_NAME = 'poke-rand-v2';
const SCOPE_URL = new URL(self.registration.scope);
const toURL = (path) => new URL(path, SCOPE_URL).toString();
const ASSETS = [
    'index.html',
    'styles.css',
    'app.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png'
].map(toURL);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const inScope = request.url.startsWith(SCOPE_URL.toString());

    // Cache-first for app shell
    if (request.method === 'GET' && request.destination !== 'document' && inScope) {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request))
        );
        return;
    }

    // Network-first for HTML documents (to keep latest)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match(toURL('index.html')))
        );
        return;
    }
});
