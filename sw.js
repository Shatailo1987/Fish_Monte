const CACHE_NAME = "fish-monte-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./favicon.ico",

  // Icons
  "./icons/icon-16.png",
  "./icons/icon-32.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  // Splash screens
  "./splash-1125x2436.png",
  "./splash-1170x2532.png",
  "./splash-1179x2556.png",
  "./splash-1284x2778.png",
  "./splash-1290x2796.png"
];


// INSTALL
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});


// ACTIVATE (очистка старого кешу)
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});


// FETCH (offline-first стратегія)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return new Response("Offline mode");
        });
    })
  );
});
