// ════════════════════════════════════════
// EPL Service Worker — offline-støtte
// Oppdater CACHE_VERSION ved hver ny deploy
// ════════════════════════════════════════

const CACHE_VERSION = 'epl-1.0.17';
const CACHE_FILES = [
  '/EPL-App/',
  '/EPL-App/index.html',
  '/EPL-App/style.css',
  '/EPL-App/app.js',
  '/EPL-App/manifest.json',
  '/EPL-App/Egenes_Brannteknikk.png'
];

// Installer: cache alle nødvendige filer
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CACHE_FILES))
  );
});

// Aktiver: slett gamle cacher og ta over alle faner
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});


// Fetch: serve fra cache, fall tilbake til nett
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      // Returner cachet versjon hvis den finnes
      if (cachedResponse) {
        return cachedResponse;
      }
      // Ellers hent fra nett og cache for neste gang
      return fetch(event.request).then(function(networkResponse) {
        // Bare cache GET-forespørsler fra samme domene
        if (
          event.request.method === 'GET' &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Offline og ikke i cache — vis index.html som fallback
        return caches.match('/EPL-App/index.html');
      });
    })
  );
});
