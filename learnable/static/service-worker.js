/* LearnAble — minimal service worker.
   Caches the app shell so the prototype keeps working after the
   first load even without an internet connection. All actual data
   (students, sessions, settings) lives in localStorage, not here. */

const CACHE_NAME = "learnable-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/static/css/style.css",
  "/static/js/data.js",
  "/static/js/accessibility.js",
  "/static/js/students.js",
  "/static/js/dashboard.js",
  "/static/js/games.js",
  "/static/js/games_extra.js",
  "/static/js/reports.js",
  "/static/js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return response;
        })
        .catch(() => cached);
    })
  );
});
