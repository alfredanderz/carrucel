const CACHE_NAME = "carrucel-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./manifest.json",
  "./offline-photo.png",
];

// Instalar
self.addEventListener("install", (event) => {
  console.log("SW: Instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Archivos cacheados");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activar
self.addEventListener("activate", (event) => {
  console.log("SW: Activado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("SW: Borrando caché antigua:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch (Cache First)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback para navegación
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      })
  );
});
