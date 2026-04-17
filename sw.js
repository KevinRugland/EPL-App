// ════════════════════════════════════════
// EPL Service Worker — offline-støtte
// Oppdater CACHE_VERSION ved hver ny deploy
// ════════════════════════════════════════

const CACHE_VERSION = 'epl-1.0.7';
const CACHE_FILES = [
  '/EPL-App/',
  '/EPL-App/index.html',
  '/EPL-App/style.css',
  '/EPL-App/app.js',
  '/EPL-App/manifest.json',
  '/EPL-App/Egenes_Brannteknikk.png'
];

// Installer: cache alle nødvendige filer
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      console.log('Cacher filer for offline-bruk');
      return cache.addAll(CACHE_FILES);
    })
  );
  // Ta over med en gang uten å vente på reload
  self.skipWaiting();
});

// Aktiver: slett gamle cacher
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_VERSION; })
          .map(function(name) {
            console.log('Sletter gammel cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Ta kontroll over alle åpne faner
  self.clients.claim();
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
