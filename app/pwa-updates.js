/* Shared PWA update controller for the business and personal entry pages.
   Never clears localStorage, IndexedDB, or user-created data. */
(()=>{
  'use strict';
  if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
  let checking=false,refreshing=false;
  const current=document.querySelector('meta[name="dm-app-build"]')?.content;
  function safeToReload(){
    const el=document.activeElement;
    return !el?.matches('input, textarea, select, [contenteditable="true"]') &&
      !document.querySelector('dialog[open], [role="dialog"]:not([hidden])');
  }
  async function checkPublishedVersion(){
    if(checking||refreshing||document.hidden||!navigator.onLine||!current)return;
    checking=true;
    try{
      const url=new URL(location.pathname,location.origin);
      url.searchParams.set('dm_update_check',String(Date.now()));
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)return;
      const text=await response.text();
      const match=text.match(/<meta\s+name=["']dm-app-build["']\s+content=["']([^"']+)["']/);
      if(match&&match[1]!==current&&safeToReload()){
        refreshing=true;
        location.reload();
      }
    }catch(_){}
    finally{checking=false;}
  }
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
      reg.update().catch(()=>{});
      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(!refreshing&&safeToReload()){refreshing=true;location.reload();}
      });
      document.addEventListener('visibilitychange',()=>{
        if(!document.hidden){reg.update().catch(()=>{});checkPublishedVersion();}
      });
      window.addEventListener('pageshow',checkPublishedVersion);
      window.addEventListener('focus',checkPublishedVersion);
    }).catch(()=>{});
  },{once:true});
})();
