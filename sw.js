const CACHE_NAME = "quazzys-foodaria-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/audio.js",
  "./js/data.js",
  "./js/save.js",
  "./js/render.js",
  "./js/lobby.js",
  "./js/stations/common.js",
  "./js/stations/burger.js",
  "./js/stations/fries.js",
  "./js/stations/wings.js",
  "./js/stations/pizza.js",
  "./js/stations/milkshake.js",
  "./js/main.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-180.png",
  "./assets/icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
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
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
