/* Shared miniature assistant actions for personal pages.
   Home keeps the same icon menu and its existing in-page action handlers. */
(()=>{
'use strict';
if(!/\/(?:myday|world|health|care)\.html$/.test(location.pathname))return;
function init(){
 const triggers=[
  document.querySelector('body > nav.bottom-nav #tabAssistant'),
  document.getElementById('mydayPlasmaLauncher'),
  document.getElementById('worldStandalonePlasma')
 ].filter(Boolean);
 if(!triggers.length)return;
 const old=document.querySelector('.dm-assistant-mini-menu');
 if(old)old.remove();
 const menu=document.createElement('nav');
 menu.className='dm-assistant-mini-menu';
 menu.hidden=true;
 menu.setAttribute('aria-label','Быстрые действия помощника');
 const items=[
  ['home','Главная','./index.html','<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/>'],
  ['chat','Чат','./index.html?jump=assistant','<path d="M20 11a8 8 0 0 1-8 8H6l-3 2v-8a8 8 0 1 1 17-2Z"/>'],
  ['attention','Центр внимания','./index.html?jump=attention','<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>'],
  ['manage','Управление','./index.html?jump=management','<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>']
 ];
 menu.innerHTML=items.map(([key,label,href,art])=>
  '<a data-action="'+key+'" href="'+href+'" aria-label="'+label+'" title="'+label+'">'+
  '<svg viewBox="0 0 24 24" aria-hidden="true">'+art+'</svg></a>').join('');
 document.body.append(menu);
 let hideTimer;
 function close(){
  clearTimeout(hideTimer);menu.hidden=true;
  triggers.forEach(t=>t.setAttribute('aria-expanded','false'));
 }
 function toggle(event){
  event.preventDefault();event.stopPropagation();
  const open=menu.hidden;
  close();menu.hidden=!open;
  triggers.forEach(t=>t.setAttribute('aria-expanded',String(open)));
  if(open)hideTimer=setTimeout(close,6000);
 }
 for(const trigger of triggers){
  trigger.setAttribute('aria-haspopup','true');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','dmSharedMiniMenu');
  trigger.addEventListener('click',toggle);
 }
 menu.id='dmSharedMiniMenu';
 document.addEventListener('pointerdown',event=>{
  if(!menu.hidden&&!menu.contains(event.target)&&!triggers.some(t=>t.contains(event.target)))close();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!menu.hidden){close();triggers.find(t=>t.getClientRects().length)?.focus();}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
 function syncDock(){
  let prefs={};try{prefs=JSON.parse(localStorage.getItem('digital-manager-black-velvet-v2')||'{}')?.management?.voice||{};}catch(_){}
  const dockOff=prefs.dock===false;
  document.documentElement.classList.toggle('dm-mini-no-dock',dockOff);
  close();
 }
 window.addEventListener('storage',event=>{if(event.key==='digital-manager-black-velvet-v2'||event.key===null)syncDock();});
 window.addEventListener('pageshow',syncDock);
 syncDock();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
