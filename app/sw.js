/* PWA updates: network-first documents and code; cached assets usable offline. */
const CACHE='digital-manager-black-velvet-v803-20261014';
const CACHE_PREFIX='digital-manager-black-velvet-';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./index.html'])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const isDoc=request.mode==='navigate'||request.destination==='document';
 const isCode=['script','style','worker'].includes(request.destination)||/\.(?:js|css)$/i.test(url.pathname);
 if(isDoc||isCode){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok)event.waitUntil(cache.put(request,response.clone()));
    return response;
   }catch(_){
    return await cache.match(request,{ignoreSearch:isDoc})||(isDoc?await cache.match('./index.html'):null)||Response.error();
   }
  })());
  return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const saved=await cache.match(request);
  if(saved)return saved;
  try{const response=await fetch(request);if(response.ok)event.waitUntil(cache.put(request,response.clone()));return response}
  catch(_){return Response.error()}
 })());
});
