/* My World: configure existing dock once; no legacy injection, no re-render. */
(()=>{
'use strict';
function init(){
 try{
  const dock=document.querySelector('body > nav.bottom-nav[data-layout="five"]');
  const centre=dock?.querySelector('#tabAssistant');
  const socket=centre?.querySelector('.dm-world-socket');
  const factory=window.DMSharedPlasma;
  if(!dock||!centre||!socket||!factory?.create)throw Error('World dock/plasma source missing');
  const plasma=factory.create('world');
  plasma.dataset.mode='idle';
  socket.replaceChildren(plasma);
  dock.dataset.mode='idle';centre.dataset.mode='idle';
  const targets={
   clients:['Клиенты','ic-users','./index.html?jump=clients'],
   day:['Мой день','ic-calendar','./myday.html'],
   docs:['Документы','ic-file','./index.html?jump=documents'],
   finance:['Финансы','ic-coins','./index.html?jump=finance'],
   home:['Главная','ic-grid','./index.html'],
   management:['Управление','ic-settings','./index.html?jump=management']
  };
  let prefs={};
  try{prefs=JSON.parse(localStorage.getItem('digital-manager-black-velvet-v2')||'{}')?.management?.voice||{}}catch(_){}
  const choices=Array.isArray(prefs.dockItems)?prefs.dockItems:[];
  [...dock.querySelectorAll('.nav-item.nav-quick')].forEach((button,i)=>{
   const key=targets[choices[i]]?choices[i]:['clients','day','docs','finance'][i];
   const [label,icon,url]=targets[key];
   button.dataset.dockTarget=key;
   const use=button.querySelector('.nav-ico use'),caption=button.querySelector('.nav-label');
   if(use)use.setAttribute('href','#'+icon);
   if(caption)caption.textContent=label;
   button.setAttribute('aria-label','Открыть '+label);
   button.addEventListener('click',()=>location.assign(url));
  });
  // The shared icon-only quick menu attaches to the assistant button.
  if(prefs.dock===false){
   dock.hidden=true;
   const launcher=document.createElement('button');
   launcher.type='button';
   launcher.id='worldStandalonePlasma';
   launcher.className='dm-world-standalone';
   launcher.setAttribute('aria-label','Открыть действия помощника');
   launcher.dataset.mode='idle';
   launcher.append(plasma); // MOVE the same instance: never clone the ring or SVG IDs.
   document.body.append(launcher);
  }
 }catch(error){console.error('My World dock:',error);}
 finally{document.documentElement.classList.remove('dm-world-loading');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
