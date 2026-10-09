/* Only the /app/ subdirectory belongs to this service worker. Root advertising site is untouched. */
const CACHE='digital-manager-black-velvet-v226-20261009';
const OFFLINE=['./','./index.html','./style.css','./app.js','./manifest.json','./assets/architecture-hero.png','./assets/brand-logo.svg','./assets/assistant-mark.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(OFFLINE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('digital-manager-black-velvet-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;const url=new URL(req.url);if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match('./index.html')));return;}
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const clone=res.clone();caches.open(CACHE).then(cache=>cache.put(req,clone));}return res;})));
});
