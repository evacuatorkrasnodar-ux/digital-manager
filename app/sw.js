/* App-only service worker: fresh documents, styles and scripts; cached offline assets. */
const CACHE = 'digital-manager-black-velvet-v311-20261010';
const CACHE_PREFIX = 'digital-manager-black-velvet-';
const OFFLINE_FILES = [
  './index.html',
  './style.css?v=284',
  './dock.css?v=295',
  './app.js?v=278',
  './myday.html',
  './myday.css?v=250',
  './russia-calendar.js?v=250',
  './myday.js?v=283',
  './care.html',
  './care.css?v=249',
  './care.js?v=283',
  './world.html',
  './world.css?v=249',
  './world.js?v=283',
  './health.html',
  './health.css?v=249',
  './health-bridge.js?v=286',
  './health.js?v=289',
  './health-navigation.css?v=287',
  './top-tabs.css?v=288',
  './health-metrics.css?v=288',
  './health-motion.css?v=289',
  './voice-hints.css?v=290',
  './control-dock.css?v=291',
  './black-velvet-premium.css?v=292',
  './unified-quiet-glass.css?v=293',
  './home-width.css?v=297',
  './dashboard-reference.css?v=311',
  './voice-hints.js?v=290',
  './system-ui.css?v=283',
  './system-ui.js?v=283',
  './polish.css?v=260',
  './myday-finish.css?v=274',
  './personal-unified.css?v=283',
  './assets/myday-long-v263.avif',
  './assets/glass-refraction.svg',
  './assets/world-lightflow.svg',
  './polish.js?v=257',
  './assets/glass-waves.svg',
  './assets/logo-air.png',
  './manifest.json',
  './assets/architecture-hero.png',
  './assets/brand-logo.svg',
  './assets/assistant-mark.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(OFFLINE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;

  const documentRequest = request.mode === 'navigate' || request.destination === 'document';
  const freshRequest = documentRequest || request.destination === 'style' || request.destination === 'script';

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (freshRequest) {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) event.waitUntil(cache.put(request, response.clone()));
        return response;
      } catch (_) {
        const saved = await cache.match(request, { ignoreSearch: true });
        if (saved) return saved;
        return documentRequest
          ? (await cache.match('./index.html') || Response.error())
          : Response.error();
      }
    }

    const saved = await cache.match(request);
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok) event.waitUntil(cache.put(request, response.clone()));
    return response;
  })());
});
