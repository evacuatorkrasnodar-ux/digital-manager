const CACHE_NAME = 'digital-manager-v3';

const FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Устанавливаем новый Service Worker и сразу переводим его в активное состояние.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Удаляем старые версии кэша и сразу подключаем новый SW ко всем открытым вкладкам.
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

// index.html всегда сначала проверяем в сети.
// Для остальных GET-запросов используем network-first,
// чтобы обновления GitHub Pages появлялись без Ctrl+Shift+R.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML-документы: сеть -> кэш.
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(
          cached => cached || caches.match('./index.html')
        ))
    );
    return;
  }

  // Остальные ресурсы: сеть -> кэш -> ошибка сети.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
