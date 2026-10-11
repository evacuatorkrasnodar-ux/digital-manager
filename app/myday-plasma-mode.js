/* Calendar / My Day: respect the single Home "Show dock" preference.
   Only myday.html uses this file. The animated orb markup is the real Home
   dock-free launcher, not a hand-drawn or generated image. */
(() => {
  'use strict';
  if((location.pathname.split('/').pop()||'index.html')!=='myday.html')return;
  const KEY='digital-manager-black-velvet-v2';
  function dockEnabled(){
    try{
      const settings=JSON.parse(localStorage.getItem(KEY)||'{}');
      return settings?.management?.voice?.dock!==false;
    }catch(_){return true;}
  }
  function init(){
    const stage=document.createElement('div');
    stage.className='dm-myday-plasma-stage';
    stage.hidden=true;
    stage.innerHTML="";
    const button=stage.querySelector('#mydayPlasmaLauncher');
    const menu=document.createElement('nav');
    menu.id='mydayPlasmaMenu';
    menu.className='dm-myday-plasma-menu';
    menu.setAttribute('aria-label','Быстрые действия помощника');
    menu.hidden=true;
    menu.innerHTML=
      '<a href="./index.html" aria-label="На главную"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/></svg><span>Главная</span></a>'+
      '<a href="./index.html?jump=assistant" aria-label="Открыть помощника"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H6l-3 2v-8a8 8 0 1 1 17-2Z"/></svg><span>Помощник</span></a>'+
      '<a href="./index.html?jump=management" aria-label="Открыть управление"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span>Управление</span></a>';
    stage.append(menu);
    document.body.append(stage);
    const legacyDock=document.querySelector('body > nav.bottom-nav');
    function close(){
      menu.hidden=true;
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Открыть действия помощника');
    }
    function sync(){
      const enabled=dockEnabled();
      document.documentElement.classList.toggle('dm-myday-no-dock',!enabled);
      if(legacyDock)legacyDock.hidden=!enabled;
      stage.hidden=enabled;
      if(enabled)close();
    }
    button.addEventListener('click',event=>{
      event.stopPropagation();
      if(dockEnabled())return;
      const open=menu.hidden;
      menu.hidden=!open;
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Закрыть действия помощника':'Открыть действия помощника');
    });
    document.addEventListener('click',event=>{
      if(!stage.contains(event.target))close();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!menu.hidden){close();button.focus();}
    });
    window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)sync();});
    window.addEventListener('pageshow',sync);
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();