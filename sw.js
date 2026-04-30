// ════════════════════════════════════════
// EPL Service Worker — offline-støtte
// ════════════════════════════════════════

const CACHE_VERSION = 'epl-1.0.32';

// App-shell: hentes alltid fra nett først (network-first)
const APP_SHELL = [
  '/EPL-App/',
  '/EPL-App/index.html',
  '/EPL-App/style.css',
  '/EPL-App/app.js',
  '/EPL-App/manifest.json',
];

// Statiske ressurser: cache-first (endres sjelden)
const STATIC_ASSETS = [
  '/EPL-App/Egenes_Brannteknikk.png',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll([...APP_SHELL, ...STATIC_ASSETS]))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isAppShell(url) {
  return APP_SHELL.some(path => url.pathname === path);
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (isAppShell(url)) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => caches.match('/EPL-App/index.html'));
      })
    );
  }
});
