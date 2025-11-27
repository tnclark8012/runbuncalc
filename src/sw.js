const CACHE_NAME = 'pokemon-calc-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/dark-theme.css',
  './css/vendor/bootstrap.css',
  './js/vendor/jquery-1.9.1.min.js',
  './js/vendor/select2/select2.min.js',
  './js/vendor/select2/select2.css',
  './js/vendor/url-search-params-0.1.2.min.js',
  './js/vendor/interact.min.js',
  './core.bundle.js',
  './extensions.bundle.js',
  './calc/util.js',
  './calc/stats.js',
  './calc/data/species.js',
  './calc/data/types.js',
  './calc/data/natures.js',
  './calc/data/abilities.js',
  './calc/data/moves.js',
  './calc/data/items.js',
  './calc/data/index.js',
  './calc/move.js',
  './calc/pokemon.js',
  './calc/field.js',
  './calc/items.js',
  './calc/mechanics/util.js',
  './calc/mechanics/gen789.js',
  './calc/mechanics/gen56.js',
  './calc/mechanics/gen4.js',
  './calc/mechanics/gen3.js',
  './calc/mechanics/gen12.js',
  './calc/calc.js',
  './calc/desc.js',
  './calc/result.js',
  './calc/adaptable.js',
  './calc/index.js',
  './js/shared_controls.js',
  './js/index_randoms_controls.js',
  './js/moveset_import.js',
  './js/dark-theme-toggle.js',
  './js/data/sets/gen9.js',
  './js/data/sets/gen8.js',
  './js/data/sets/gen7.js',
  './js/data/sets/gen6.js',
  './js/data/sets/gen5.js',
  './js/data/sets/gen4.js',
  './js/data/sets/gen3.js',
  './js/data/sets/gen2.js',
  './js/data/sets/gen1.js',
  './js/data/truck.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((err) => {
              console.log('Cache put failed: ', err);
            });

          return response;
        });
      })
  );
});
