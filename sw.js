const CACHE_NAME = "electrocompanion-cache-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./js/dmm.js",
  "./js/search.js",
  "./js/details.js",
  "./js/tester.js",
  "./js/resistor.js",
  "./js/smd.js",
  "./js/combinations.js",
  "./js/capacitor.js",
  "./js/inductor.js",
  "./js/led.js",
  "./js/physics.js",
  "./js/substitutes.js",
  "./js/rccb.js",
  "./js/continuity.js"
];

// Install event - caching assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleaning old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Stale-While-Revalidate caching strategy
self.addEventListener("fetch", (e) => {
  // Only handle GET requests
  if (e.request.method !== "GET") return;

  // Skip error logger requests
  if (e.request.url.includes("/log-error")) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or ignore network error if cached response exists
      });
      return cachedResponse || fetchPromise;
    })
  );
});
