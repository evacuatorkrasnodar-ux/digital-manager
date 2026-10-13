/* App-only service worker: fresh documents, styles and scripts; cached offline assets. */
const CACHE = 'digital-manager-black-velvet-v764-20261013';
const CACHE_PREFIX = 'digital-manager-black-velvet-';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // Install the new worker promptly; individual resources cache on first use.
      .then(cache => cache.addAll(['./index.html']))
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
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (documentRequest) {
      // Try a current document first, but avoid an indefinite launch stall.
      const saved = await cache.match(request, {ignoreSearch:true})
        || await cache.match('./index.html');
      const network = fetch(request, {cache:'no-cache'}).then(response => {
        if (response.ok) event.waitUntil(cache.put(request, response.clone()));
        return response;
      }).catch(() => null);
      if (!saved) return await network || Response.error();
      const response = await Promise.race([
        network,
        new Promise(resolve => setTimeout(() => resolve(null), 1400))
      ]);
      if (response && response.ok) return response;
      event.waitUntil(network);
      return saved;
    }
    // CSS and JS URLs have explicit version identifiers. Reuse matching cached
    // resources instantly instead of making every reload wait on the network.
    const saved = await cache.match(request);
    if (saved) return saved;
    try {
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
