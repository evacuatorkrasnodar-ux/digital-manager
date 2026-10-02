const CACHE_NAME = 'digital-manager-v2';

const FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Устанавливаем новый Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Удаляем старый кэш и сразу активируем новую версию
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith('digital-manager-') &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Получение файлов
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML всегда сначала проверяем в интернете.
  // Если интернета нет — используем кэш.
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-cache'
      })
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy));

          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              return cached || caches.match('./index.html');
            });
        })
    );

    return;
  }

  // Остальные файлы:
  // сначала интернет → затем кэш.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy));
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
