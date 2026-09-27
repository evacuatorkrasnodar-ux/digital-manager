const CACHE_NAME = "mrs-sites-900-v2";
const BASE = self.registration.scope;

const CORE_ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "mrs-icon-192.png",
  BASE + "mrs-icon-512.png"
];

const OPTIONAL_ASSETS = [
  BASE + "mrs-signature-black.png",
  BASE + "mrs-signature-white.png"
];

/* =====================================================
   INSTALL
===================================================== */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        /*
          Основные файлы должны загрузиться.
          Дополнительные файлы не должны ломать установку SW.
        */
        await cache.addAll(CORE_ASSETS);

        await Promise.all(
          OPTIONAL_ASSETS.map(async url => {
            try {
              const response = await fetch(url, {
                cache: "no-store"
              });

              if (response.ok) {
                await cache.put(url, response);
              }
            } catch {
              // Не блокируем установку service worker.
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* =====================================================
   FETCH
===================================================== */

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(() =>
        caches.match(request)
          .then(cached => {
            if (cached) {
              return cached;
            }

            return caches.match(BASE);
          })
      )
  );
});
