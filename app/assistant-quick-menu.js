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
 if(!triggers.length){
  // Health and Care are often embedded inside My Day (which already owns
  // the plasma). When opened alone they need a visible Home link too.
  let standalone=false;
  try{standalone=window.self===window.top}catch(_){}
  if(standalone&&!document.querySelector('.dm-personal-home-link')){
   const header=document.querySelector('.day-header');
   if(header){
    const home=document.createElement('a');
    home.className='dm-personal-home-link';
    home.href='./index.html';
    home.setAttribute('aria-label','Главная — открыть приложение');
    home.setAttribute('title','Главная');
    home.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/></svg>';
    header.append(home);
   }
  }
  return;
 }
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
  menu.classList.remove('dm-plasma-orbit');
  document.documentElement.classList.remove('dm-plasma-orbit-open');
  triggers.forEach(t=>t.setAttribute('aria-expanded','false'));
 }
 function toggle(event){
  event.preventDefault();event.stopPropagation();
  const open=menu.hidden;
  close();
  if(open){
   // Only the actual dock-free plasma gets the four-button semicircle.
   const dayPlasma=document.getElementById('mydayPlasmaLauncher');
   const dayStage=dayPlasma?.closest('.dm-myday-plasma-stage');
   const worldPlasma=document.getElementById('worldStandalonePlasma');
   const plasmaMode=Boolean((dayPlasma&&dayStage&&!dayStage.hidden)||
    (worldPlasma&&!worldPlasma.hidden));
   menu.classList.toggle('dm-plasma-orbit',plasmaMode);
   // The clean black orbital scene is active only around a real, visible
   // dock-free plasma and never during the standard navigation mode.
   document.documentElement.classList.toggle('dm-plasma-orbit-open',plasmaMode);
   menu.hidden=false;
   hideTimer=setTimeout(close,6000);
  }
  triggers.forEach(t=>t.setAttribute('aria-expanded',String(open)));
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
 window.addEventListener('pageshow',close);
}
if(document.readyState==='complete')init();
else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
